const express = require('express'); 
const viewsController = require('../controllers/viewsController')
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController')
const { route } = require('./reviewRoutes');

const router = express.Router()

router.use(viewsController.alerts)

router.get('/signup', authController.isLoggedIn, viewsController.getSignUpForm)

router.get('/',
    //bookingController.createBookingCheckout, // if there is a checkout, it stores into db
    authController.isLoggedIn,
    viewsController.getOverview
)

router.get('/tour/:slug', authController.isLoggedIn,viewsController.getTour)
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm)

router.get('/me', authController.isAuthenticated, viewsController.getMyAccount)

router.get('/my-tours', authController.isAuthenticated, viewsController.getMyTours)

router.post('/submit-user-data',authController.isAuthenticated, viewsController.updateUserData) // connects html form to route handler 

module.exports = router