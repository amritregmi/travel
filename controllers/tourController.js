const Tour = require('../models/tourModel')
const catchAsync = require('../utils/catchAsync')
const factory = require('../controllers/handlerFactory')
const AppError = require('../utils/appError')
const imageUploader = require('./../utils/imageUploader') 
const sharp = require('sharp')
/**
 * @DESC Creates a new tour 
 */
exports.createTour = factory.createOne(Tour)

/**
 * @DESC Updates a tour 
 */
exports.updateTour = factory.updateOne(Tour)

/**
 * @DESC Deletes a single Tour 
 */
exports.deleteTour = factory.deleteOne(Tour)

/**
 * @DESC Gets a single tour 
 * @PARAMS id 
 * @RETURNS 200 json single tour 
 */
exports.getTour = factory.getOne(Tour, {
    path: 'reviews',
})
/**
 * 
 */
exports.uploadTourImages = imageUploader.upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 },
])

/**
 * upload.single('image) - is in req.file
 * upload.fields('images',imageCover) - in req.files
 */
exports.resizeTourImages = catchAsync(async (req, res, next) => {
    if (!req.files.imageCover || !req.files.images) return next()

    // Process cover Image
        // push this filename to req.body.imageCover so that next middleware can update in db 
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1331)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${req.body.imageCover}`)
    
    // Process array of tour images
    req.body.images =[]

    const processedImagePromises = await req.files.images.map(async (file, index) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`

        await sharp(file.buffer)
            .resize(2000, 1331) 
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/img/tours/${filename}`)
        
        req.body.images.push(filename) // push this filename to req.body.images
    })

    await Promise.all(processedImagePromises) // wait for all promise to resolve

    next() // means go and update the tour document in db 
})

/**
 * @DESC Returns top 5 tours, is a middleware function that modifies the query
 * @PARAM query conditions limit=5, sort by [ratingsAvg,price], fields [name price summary...]
 * @RETURN modified query to next middleware function.
 */
exports.aliasTopTours = async (req, res, next) => {
    // limit=5&sort=-ratingsAverage,price
    req.query.limit = '5'
    req.query.sort = '-ratingsAverage,price'
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
    next()
}

/**
 * @DESC gets allTours 
 * @PARAM find query
 * @RETURNS 200 json tours list 
 */

exports.getAllTours = factory.getAll(Tour)

/**
 * @DESC Gets a single tour 
 * @PARAMS id 
 * @RETURNS 200 json single tour 
 */
exports.getTour = factory.getOne(Tour, {
    path: 'reviews',
})


/**
 * @DESC Gets tour Statistics 
 * @PARAMS aggregate framework
 * @RETURNS 200 json tours
 */
exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([{
            $match: {
                ratingsAverage: {
                    $gte: 4.5
                }
            }
        },
        {
            $group: {
                _id: {
                    $toUpper: '$difficulty'
                },
                numTours: {
                    $sum: 1
                },
                numRatings: {
                    $sum: '$ratingsAverage'
                },
                avgRatting: {
                    $avg: '$ratingsQuantity'
                },
                avgPrice: {
                    $avg: '$price'
                },
                minPrice: {
                    $min: '$price'
                },
                maxPrice: {
                    $max: '$price'
                }

            }
        },
        {
            $sort: {
                avgPrice: 1
            }
        },
        // {
        //     $match: {
        //         _id: {$ne: 'EASY'} // can use pipeline multiple times
        //     }
        // }
    ])

    res.status(200).json({
        status: 'success',
        data: stats,
    })
})

/**
 * @DESC Gets a tour according to month. Aggregation Framework extensively used.
 * @PARAM year 
 * @RETURNS 200 json plan 
 */
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1

    const plan = await Tour.aggregate([{
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: {
                    $month: '$startDates'
                },
                numTourStats: {
                    $sum: 1
                },
                tours: {
                    $push: '$name'
                }
            }
        },
        {
            $addFields: {
                month: '$_id'
            }
        },
        {
            $sort: {
                numTourStats: -1
            }
        },
        {
            $limit: 12
        }
    ])
    res.status(200).json({
        status: 'Success',
        data: {
            plan
        }
    })
})

/**
 * @DESC Get a tour document within km radius from . (this point is; lt,lng)
 * @ROUTES tours-within/233/from/-40,50/unit/miles
 * @PARAM {radius, latlng, unit} tour within 200km from . in km/miles
 */
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { radius, latlng, unit } = req.params
    const [lat, lng] = latlng.split(',') 
    
    const radiusInRadian = unit === 'mi' ? radius/3963.2 : radius/ 6378.1

    if(!lat || !lng) return next(new AppError('Please specify lat and longitude',400))
    
    // Here we write mongo geospatial queries. looks like this
    const query = {
        startLocation: {
            $geoWithin: {
                $centerSphere: [
                    [
                        lng,lat// lng, lat
                    ],
                    radiusInRadian // radius in radian 
                ]
            }
        }
    }
    // To do geoSpatial Query , we need to attribute index to that field where 
    // we are searching for. So, startLocation should be indexed in Tour model
    const tours = await(Tour.find(query))

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours
        }
    })
})

/**
 * @DESC calculates distance to all tours from certain points
 * @PARAM point coordinate , unit 
 * @ROUTES distances/11,-22/unit/km 
 */
exports.getDistances = catchAsync(async (req, res, next) => {
    const {latlng, unit } = req.params
    const [lat, lng] = latlng.split(',') 

    // convert from meter to miles or km 
    const multiplier = unit === 'mi' ? 0.000621371 : 0.001
    
    if (!lat || !lng) return next(new AppError('Please specify lat and longitude', 400))
    
    // calculation is done via aggregation framework.
    // for geospatial aggregation there is only one single stage called $geoNear
    const stages = [
        {
            // should be always first stage and needs one geospatial index which it uses automatically 
            $geoNear: {
                near: {// point from where we need to calculate distances
                    type: 'point',
                    coordinates: [lng*1,lat*1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]

    const distances = await Tour.aggregate(stages)

    res.status(200).json({
        status: 'success',
        data: {
            data: distances 
        }
    })
})