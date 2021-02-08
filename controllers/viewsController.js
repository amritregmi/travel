const Tour = require('../models/tourModel')
const User = require('../models/userModel')
const Booking = require('../models/bookingModel')
const AppError = require('../utils/appError')
const catchAsync = require('./../utils/catchAsync')

exports.alerts = (req, res, next) => {
    const { alert } = req.query
    if (alert === 'booking')
        res.locals.alert = 'Your Booking was successful, Please check you for confirmation! \n Might Take a while to arrive'
    next()
}

exports.getOverview = catchAsync(async (req, res) => {
    // Get all the tours 
    const tours = await Tour.find()

    // Build template by the data coming from this guy 

    // Render the template and send it to client 
    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    })
})

exports.getTour = catchAsync(async (req, res, next) => {
    // Get tour based on slug /tour/slug-file from (req.params.slug)
    // populate the review model as well 
    const tour = await Tour.findOne(
        { slug: req.params.slug })
        .populate({
            path: 'reviews',
            fields: 'review rating user'
        })
    
    // if there is no tour 
    if (!tour) {
        return next(new AppError('There is no Tour with That name',404))
    }
    // Build the template using above data 

    // Render the template and send it to client 
    res.status(200).render('tour', {
        title: `${tour.name} tour`,
        tour
    })
})

/**
 * @returns Login Form 
 */
exports.getLoginForm = (req, res) => {
    // Render the template and send it to client 
    res.status(200).render('login',{title:'Log into your account'})
}
/**
 * @returns Sign up Form
 */
exports.getSignUpForm = (req, res) => {
    res.status(200).render('signup', {
        title: 'Signup Page'
    })
}
/**
 * @returns user account page 
 */
exports.getMyAccount = (req, res, next) => {
    // Render the template and send it to client 
    res.status(200).render('account', {
        title: 'My Account',
    })
}
/**
 * 
 */
exports.getMyTours = catchAsync(async (req, res, next) => {
    // find all bookings 
    const bookings = await Booking.find({ user: req.user.id })
    
    // find the tour with that booking 
    const tourIds = bookings.map(el => el.tour)
    
    // Get the tour belonging to the tourIds 
    const tours = await Tour.find(
        {
            _id:
            {
                $in: tourIds
            }
        }
    )
    res.status(200).render('overview', {
        title: 'My Tours',
        tours
    })
})

/**
 * @DESC Gets a form data posted via html 
 * needs a middleware to parse the form.
 * !WARNING this is not a good practice, Use JS to process form ; js/updateSettings.js is used. 
 */
exports.updateUserData =catchAsync( async(req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id, // option 1 - id
        { // option 2 - what to update
            name: req.body.name,
            email: req.body.email
        },
        {// option 3 - what to do after update
            new: true,
            runValidators: true
        }) // if authenticated user info will be in req.user
    
    res.status(200).render('account', {
        title: 'Your account',
        user: updatedUser
    })
})
