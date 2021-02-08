const express = require('express')
const reviewController = require('../controllers/reviewController')
const authController = require('./../controllers/authController')

/**
 * @INFO Nested routes
 * @DESC This route is called via Tour Routes. Tour routes passes all the parameter 
 *       to this route. Used this when two Guys are very related. (Tour contains Reviews)
 *       Reviews belongs to Tour and Tour has no idea about review. 
 * @WHY  By default, Each router only has access to the parameter of their specific routers.
 *       If the other router wants to get access then it has to pass option as mergeParams:true.  
 */
const router = express.Router({
    mergeParams: true
})

// DO do reviews stuff, The guy should always login 
router.use(authController.isAuthenticated)

/**
 * @PATH1 api/v1/reviews (main path)
 * @PATH2 api/v1/tours/:tourId/reviews (this path comes via tour)
 */
router
    .route('/')
    .post( // creates a reviews on particular Tour.
        authController.isAuthenticated,
        authController.hasAccessTo('user'), // only user can post a review
        reviewController.setTourUserIds,
        reviewController.createReview
    )
    .get(reviewController.getAllReviews); // gets all reviews on Tour

router
    .route('/:id')
    .get(reviewController.getReview)
    .delete(authController.hasAccessTo('admin', 'user'), reviewController.deleteReview) // admin, user only
    .patch(authController.hasAccessTo('admin', 'user'), reviewController.updateReview) // admin, user only

module.exports = router