const express = require('express')
const tourController = require('../controllers/tourController')
const authController = require('../controllers/authController')
const router = express.Router()

const reviewRouter = require('../routes/reviewRoutes')

router
    .route('/top-5-cheap') // public api 
    .get(tourController.aliasTopTours, tourController.getAllTours)

router.route('/tour-stats').get(tourController.getTourStats) // public api 

router
    .route('/monthly-plan/:year')
    .get(
        authController.isAuthenticated,
        authController.hasAccessTo('admin', 'lead-guide', 'guide'),
        tourController.getMonthlyPlan
    )
// routes to get geospatial data 
// tours-within/233/from/-40,50/unit/miles
router
    .route('/tours-within/:radius/from/:latlng/unit/:unit')
    .get(tourController.getToursWithin)

 // calculates distance to all tours from certain points
router
    .route('/distances/:latlng/unit/:unit')
    .get(tourController.getDistances)

router
    .route('/')
    .get(tourController.getAllTours) // public api 
    .post(
        authController.isAuthenticated,
        authController.hasAccessTo('admin', 'lead-guide'),
        tourController.createTour)

router
    .route('/:id')
    .get(tourController.getTour) // public api 
    .patch(
        authController.isAuthenticated,
        authController.hasAccessTo('admin', 'lead-guide'),
        tourController.uploadTourImages, // uploads in memory as buffer
        tourController.resizeTourImages, // saves in folder & adds filename to req.body
        tourController.updateTour // updates the tour
    )
    .delete(
        authController.isAuthenticated,
        authController.hasAccessTo('admin', 'lead-guy'),
        tourController.deleteTour
    )
/**
 * @DESC nested router, 
 *       when /:tourId/review is hit, we are transferring to Review Router 
 *       Review Router gets all the parameter 
 * @MORE another way of using middleware also called mounting router
 */
router.use('/:tourId/reviews', reviewRouter)

module.exports = router