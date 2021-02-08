const Review = require('./../models/reviewModel')
const factory = require('./handlerFactory')


// middleware function that runs before creating a review
exports.setTourUserIds = (req, res, next) => {
    // Allowing nested routes, user can also allowing user to insert tourId,userId manually
    if (!req.body.tour) req.body.tour = req.params.tourId
    if (!req.body.user) req.body.user = req.user.id
    next()
}
/**
 * @DESC get all reviews 
 * @ROUTES This guy is forwarded via Tour Routes, by passing all the params. 
 * @URL1_URL2 GET api/v1/tours/:tourId/reviews; api/v1/reviews; gets all reviews
 * @RETURNS  GET api/v1/tours/:tourId/reviews; gets reviews for specified tourId
 * @RETURNS  GET api/v1/reviews; gets all reviews
 */
exports.getAllReviews = factory.getAll(Review)
/**
 * @DESC creates a new Review
 * @ROUTES This guy is forwarded via Tour Routes, by passing all the params. 
 * @URL POST api/v1/tours/:tourId/reviews
 */
exports.createReview = factory.createOne(Review)

//Deletes Review
exports.deleteReview = factory.deleteOne(Review)

//updates Review
exports.updateReview = factory.updateOne(Review)

// get Review 
exports.getReview = factory.getOne(Review)

// get All review 
exports.getAllReviews = factory.getAll(Review)