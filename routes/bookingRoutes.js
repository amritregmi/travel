const express = require('express')
const authController = require('../controllers/authController')
const bookingController = require('./../controllers/bookingController')

// localhost:3000/bookings/

const router = express.Router()

// Should be authenticated to use these services 
router.use(authController.isAuthenticated)


router.get('/checkout-session/:tourId',
    bookingController.getCheckoutSession
)

// only access to admin and lead-guide
router.use(authController.hasAccessTo('admin', 'lead-guide'))

// crud operation 
router
    .route('/')
    .get(bookingController.getAllBookings)
    .post(bookingController.createBooking)

router
    .route('/:id')
    .get(bookingController.getBooking)
    .patch(bookingController.updateBooking)
    .delete(bookingController.deleteBooking)


module.exports = router