const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const faker = require('faker')
const catchAsync = require('../utils/catchAsync')
const factory = require('./handlerFactory')
const Tour = require('../models/tourModel')
const Booking = require('../models/bookingModel')
const User = require('../models/userModel')



exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // Get currently booked tour 
    const tour = await Tour.findById(req.params.tourId)

    // create checkout session 
    const session = await stripe.checkout.sessions.create({
        // information about session 
        payment_method_types: ['card'],

        // not secure, anyone who know this url can book a tour, nice hack! FOR DEV ONLY
        //success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price} `,
        
        success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        // information about items
        line_items: [{
            name: `${tour.name} Tour`,
            description: tour.summary,
            // faker image
            images: [faker.image.image(), faker.image.image()],
            amount: tour.price * 100, // in cent
            currency: 'aud',
            quantity: 1
        }]
    })

    // send session as response 
    res.status(200).json({
        status: 'success',
        user: req.user,
        session
    })
})

// /**
//  * @DESC 
//  * @PARAM tour, user, price 
//  * @IF there is params, this Guy will do Database Operation 
//  * @ELSE doesn't do anything and goes to next Guy.
//  * !NOT SECURE, TEMP FIX FOR DEV PURPOSE ONLY, ANYONE without paying can book item
//  */
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//     const { tour, user, price } = req.query
//     if (!tour && !user && !price) return next()
    
//     // create a new Booking 
//     await Booking.create({ tour, user, price })
//     // req.originalUrl is the url from where the request came
//     res.redirect(req.originalUrl.split('?')[0]) 
// })

// Stores booking info in DB 
const createBookingCheckoutInDB = async session => {
    console.log(session);
    const tour = session.client_reference_id
    const user = (await (User.findOne({ email: session.customer_email }))).id
    const price = session.amount_total / 100 // convert to $dollar 
    console.log('saving to database');
    await Booking.create({ tour, user, price })
}

/**
 * @DESC When there is successful payment, run this Guy 
 */
exports.webhookCheckout = (req, res, next) => {
    // get Especial signature for webhook
    const signature = req.headers['stripe-signature']

    // create a stripe event
    let event 
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET,
        )   
    } catch (error) {
        // stripe will receive this message.
        return res.status(400).send(`webhook error:${error.message} `)
    }
    // check for correct event, if so do DB operations 
    if (event.type === 'checkout.session.completed') 
        createBookingCheckoutInDB(event.data.object)
    
    // send response to stripe if everything is good
    res.status(200).json({received:true})
}

/**
 * @DESC creates a new Booking 
 */
exports.createBooking = factory.createOne(Booking)

/**
 * @DESC Get a single Booking 
 * @PARAM Booking MODEL with id in req.param.id 
 * @RETURNS 200 json single booking 
 */
exports.getBooking = factory.getOne(Booking)

/**
 * @DESC Gets all Bookings
 * @PARAMS Booking Model 
 * @Returns 200 json Booking List 
 */
exports.getAllBookings = factory.getAll(Booking)

/**
 * @DESC updates a booking 
 */
exports.updateBooking = factory.updateOne(Booking)

/**
 * @DESC deletes a single booking 
 */
exports.deleteBooking = factory.deleteOne(Booking)
