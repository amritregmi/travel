/**
 * @DESC Factory that produces A controller for CRUD actions
 * @PARAMS Model
 * @RETURNS create, read, update, delete controller with .catch block attached to it. 
 * @INFO good example of closure, inner function gets access to outer function's variable 
 */

const catchAsync = require('../utils/catchAsync')
const AppError = require('./../utils/appError')
const APIFeatures = require('../utils/apiFeatures')

/**
 * @DESC delete the data based on id. 
 * @param Model 
 * @RETURNS 204 success
 */
exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id)

    if (!doc) {
        return next(new AppError('No document Found with that ID', 404))
    }
    res.status(204).json({
        status: 'success',
        data: null,
    })
})

/**
 * @DESC update
 */
exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    })
    if (!doc) {
        return next(new AppError('No document Found with that ID', 404))
    }
    res.status(200).json({
        status: 'success',
        data: {
            data: doc,
        },
    })
})
/**
 * @DESC create
 */
exports.createOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body)
    res.status(201).json({
        status: 'success',
        data: {
            data: doc
        }
    })
})
/**
 * @DESC get single query with pop options facility.
 */
exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id)

    if (popOptions) query = query.populate(popOptions)
    const doc = await query

    if (!doc) {
        return next(new AppError('No Document Found with that ID', 404))
    }

    res.status(200).json({
        status: 'success',
        data: {
            data: doc,
        },
    })
})
/**
 * @DESC Get all 
 */
exports.getAll = Model => catchAsync(async (req, res, next) => {
    // for nested GET reviews on TOUR - simple hack
    let filter = {}
    // if request coming from Tour as /tours/:tourId, we only send all reviews for that tourId
    if (req.params.tourId) filter = {
        tour: req.params.tourId
    }
    // Execute the query looks like this = > query.sort().select().skip().limit()
    const features = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()
    // it explains everything about how query was made
    //const doc = await features.query.explain()
    const doc = await features.query
    //send response
    res.status(200).json({
        status: 'success',
        result: doc.length,
        data: {
            data: doc,
        },
    })
})