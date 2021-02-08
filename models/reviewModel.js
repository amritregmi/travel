const mongoose = require('mongoose')
const Tour = require('./tourModel')

const reviewSchema = mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review cannot be empty']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    }
}, {
    toJSON: {
        virtuals: true
    }, // this are not stored in database
    toObject: {
        virtuals: true
    }, // but are derived from current data.
})

/**
 * @DESC compound index adds a validation to check same user for same tour 
 * @WHY each combination of tour and user has always to be unique
 * @SO  One guy can only review for one Tour. i.e people are not allowed 
 *      to give multiple review on same tour.  
 * @ERROR throws mongo err: duplicate key error collection. 
 * !PROBLEM it's not working yet, same user is able to add review many times for same tour
 * !CHECK tomorrow, might take some time to update in mongodb 
 */
reviewSchema.index({tour: 1,user: 1},{unique: true})


// Query middleware 
/**
 * @DESC this Guy populates Review with User details.
 * @RETURNS modified find query with populate attached to it.
 */
reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: 'name photo'
    })
    next()
})

/**
 * @DESC Review Model takes a tour id, based on that , finds all the reviews and calculates it . 
 *       Update the tour data based on this calculations. 
 * @this refers to review model 
 * @WHAT this is a static method on reviewSchema itself and are available directly on the model not in prototype.
 * @whySTATIC because we needed to call aggregate function on the model. In static method, this variable points to the method 
 */
reviewSchema.statics.calcAverageRatings = async function (tourId) {
    // get the required data 
    const stats = await this.aggregate([{
            $match: {
                tour: tourId
            },
        },
        {
            $group: {
                _id: '$tour',
                nRating: {
                    $sum: 1
                },
                avgRating: {
                    $avg: '$rating'
                }
            }
        }
    ])

    try {
        if (stats.length > 0) {
            /**
             * when there is new review, Create a reviews and also update the 
             * tour fields [ratingsAverage, ratingsQuantity] by 
             * counting no of reviews and avg of rating 
             */
            //! FIXME Tour is not updated. (11-22.-03:50)
            //! Error is TypeError: Tour.findByIdAndUpdate is not a function
            await Tour.findByIdAndUpdate(tourId, {
                ratingsAverage: stats[0].avgRating,
                ratingsQuantity: stats[0].nRating,
            })
        } else {
            await Tour.findByIdAndUpdate(tourId, {
                ratingsAverage: 4.5,
                ratingsQuantity: 0,
            })
        }

    } catch (error) {
        console.log(error);
    }

}
//!FIXME look  23.calculate avg rating on tours
// middleware; do calculation after saving the document
reviewSchema.post('save', function () {
    // this points to current review Model 
    //Review.calcAverageRatings(this.tour) // this doesn't work so constructor is called down. 
    
    this.constructor.calcAverageRatings(this.tour) // stands for Tour; need to do this because Review is not available yet

})
//!FIXME
// findByIdAndUpdate ; this guy has access to query middleware only
// findByIdAndDelete 
// Pre middleware
reviewSchema.pre(/^findOneAnd/, async function (next) {
    // this points to current query 
    this.r = await this.findOne()
    next()
})
//!FIX ME 
reviewSchema.post(/^findOneAnd/, async function () {
    // this points to current query 
    // await this.findOne() ; does not work here, query has already executed
    await this.r.constructor.calcAverageRatings(this.r.tour)
})

const Review = mongoose.model('Review', reviewSchema)

module.exports = Review