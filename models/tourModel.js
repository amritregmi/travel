const mongoose = require('mongoose')
const Review = require('../models/reviewModel')
const slugify = require('slugify')

const tourSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true,
        maxlength: [40, 'A tour name must have less or equal 40 characters'],
        minlength: [10, 'A tour name must have more or equal 10 characters'],
        // validate: {
        //     validator: validator.isAlpha,
        //     message:'Tour name can only have alphabet'
        // }
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have group size'],
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either easy, medium or difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        set: val => Math.round(val * 10) / 10 // 4.6666 is rounded to 4.7

    },
    ratingsQuantity: {
        type: Number,
        default: 0,
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {
                // this only points to the current document on NEW DOCUMENT creation
                return val < this.price // priceDiscount should be less than price
            },
            message: 'Discount price ({VALUE}) should be below regular price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have summary'],
    },
    description: {
        type: String,
        trim: true,
        required:[true, 'A tour must have description']
    },
    imageCover: {
        type: String,
        required: [true, ' A tour must have a cover page']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false,
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        type: {
            type: String,
            default: "Point",
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [{
        type: { // this block defines geo spatial types. 
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
    }],
    guides: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }]
}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
})

/**
 * @DESC creating price field to be one of the index
 * @WHY people query for cheaper price first, hence while searching, instead of looking through
 *      collection, mongo will look through this index field. 
 * @OTHER we can use compound index (adding two fields for index)
 * @WORKS with single field as well. 
 * @ADVANTAGE makes query run faster
 */
tourSchema.index({ // compound index
    price: 1,
    ratingsAverage: -1,
})

tourSchema.index({ // normal field index 
    slug: 1
})
/**
 * @DESC for geospatial query we need to index that we are searching for 
 * @SEE https://docs.mongodb.com/manual/geospatial-queries/
 * @INFO mongoDb provides 2dsphere, 2d index types to support geoSpatial queries
 * @INDEX startLocation in 2dsphere format , we are saying to Mongo 
 */
tourSchema.index({ startLocation: '2dsphere' })

/**
 * @DESC Adding a additional virtual property to the data coming from database 
 * @PARAM property to add to the data 
 * @RETURNS virtual property
 */
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7
})
/**
 * @DESC As we don't have reference of review in Tour model. (we need all reviews for Tour)
 *       But, review has tour id. So this virtual Guy goes to Review collection,
 *       make a query with given tour_id. and populates the data
 *       (GOOD SOLUTION for guys who don't now about their children)    
 * @RETURNS all the reviews belonging to the given Tour
 * @OPTION reference to the model, localField , foreignField
 */
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id',
})

/**
 * @DESC adds slug field to tour data
 *       @DOCUMENT_MIDDLEWARE: runs before the .save() and .create() 
 * @DoesNotWorkFor update()
 * @PARAMS returns to next middleware 
 * @DOCUMENT_MIDDLEWARE 
 */
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, {
        lower: true
    })
    next()
})
/**
 * @DESC Gets the whole document based on user's id provided by client.
 *       coming from User Model to be embedded into Tour Model. 
 * @DOCUMENT_MIDDLEWARE 
 * @PARAM array of ids 
 * @RETURN arrays of ids is converted into arrays of user document.
 * !RESTRICTION works for creating document not for updating document.
 *              !so need to add same logic to update documents. 
 *      !IF USER is updated from tour guide to lead guide, we need to update in Tour model as well
 *      !(HENCE BETTER TO REFERENCE THIS KIND because, WRITE OPERATION IS MORE)
 *      tourSchema = {guides: Array}
 */
// tourSchema.pre('save', async function (next) {
//     // guides is a array full of promises 

//     const guidesPromise = this.guides.map(async id => await User.findById(id))
//     this.guides = await Promise.all(guidesPromise) 
//     next()
// })



// tourSchema.pre('save', function(next){
//     console.log('..will save the document..');
//     next()
// })

/**
 * @DESC Document Middleware function, Runs before saving a document 
 * @PARAMS !FOR TESTING PURPOSE ONLY
 * @RETURNS nothing.
 */
tourSchema.post('save', function (doc, next) {
    console.log('Document save SUCCESSFUL!');
    next()
})

/**
 * @DESC Query Middleware Function, that runs before executing find(),findOne(),..   query
 * @PARAM query object 
 * @RETURNS updated query and adds start property to the query
 */
tourSchema.pre(/^find/, function (next) {
    this.find({
        secretTour: {
            $ne: true
        }
    })
    this.start = Date.now()
    next()
})
/**
 * @DESC populates the guide id with actual guide details from user collections.
 *          runs before any find query.  
 * @PARAMS find query object
 * @RETURNS query with attaching guide details from user collection. 
 */
tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    })
    next()
})


/**
 * @DESC Query Middleware Function, that runs after executing find(),findOne(),..   query
 * @PARAM query object 
 * @RETURNS time taken to execute the query.
 */
tourSchema.post(/^find/, function (docs, next) {
    console.log(`Query took ${Date.now() - this.start} milliseconds`);
    next()
})

/**
 * @DESC Aggregate middleware, doesn't show the secret tour
 * @PARAMS aggregate object 
 * @RETURNS updated aggregate query.
 */
// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({
//         $match: {
//             secretTour: {
//                 $ne: true
//             }
//         }
//     })
//     console.log(this.pipeline());
//     next()
// })

const Tour = mongoose.model('Tour', tourSchema)

module.exports = Tour