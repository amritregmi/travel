/**
 * @NAME Global Error Controller
 * @param {err,req,res,next} 
 * @DESC this guy is responsible to send actual error message.
 *       This is invoked via middleware in app.js Department.
 *       Last Guy to send the message, this is the last response for any request. 
 * @FLOW Any Guy working finds error -> Ask ErrorController to make a appropriate Error Object
 *       Guy receives an Error Object; Error = new appError('sth wrong',404)
 *       Guy passes that Error Object into next function; next(Error)
 *       Then that error comes to this department. 
 */


const AppError = require("../utils/appError")

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`
    return new AppError(message, 400)
}
const handleDuplicateFieldDB = err => {
    const message = `Duplicate field value:${err.keyValue.name}. Please use another value`
    return new AppError(message, 400)
}
const handleValidationErrorDB = err => {
    let errors = Object.values(err.errors).map(el => el.properties.message)
    const message = `Invalid Input Data: ${errors.join('. ')}`

    return new AppError(message, 400)
}
const handleJWTError = err => new AppError('Invalid token. Please log in error', 401)
const handleJWTExpiredError = err => new AppError('Token expired, log in again', 401)

const sendErrorForDev = (err, req, res) => {
    // API
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        })
    } 
    // RENDERED WEBSITE 
    console.error('ERROR', err)
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        message:err.message
    })
}
const sendErrorProd = (err, req, res) => {
    // API ERROR 
    if (req.originalUrl.startsWith('/api')) {
        // OPERATIONAL ERROR: check documents under error_handling
        // are those error which are certain to happen, client error, db error, server err
        if (err.operational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            })
        } 
        // PROGRAMMING ERROR : we don't have control over this kind of error.
        // we don't leak our internal error if we are not sure. SO, 
        console.error('ERROR', err)
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong!'
        })
    } 
    // FOR RENDERED WEBSITE 
    if (err.operational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong',
            message:err.message
        })
    } 
    // PROGRAMMING ERROR : we don't have control over this kind of error.
    // we don't leak our internal error if we are not sure. SO, 
    console.error('ERROR', err)
    return res.status(500).render('error', {
        title: 'Something went wrong',
        message:'Please try again later'
    })
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.status = err.status || 'error'

    if (process.env.NODE_ENV === 'development') {
        sendErrorForDev(err, req, res)
    } else if (process.env.NODE_ENV === 'production') {
        // Three types of mongo error => cast(ObjectId),mongo,validation ERROR. 
        let error = {
            ...err
        }
        error.message = err.message 
        if (error.kind === 'ObjectId') error = handleCastErrorDB(error)
        if (error.code === 11000) error = handleDuplicateFieldDB(error)
        if (error.errors) error = handleValidationErrorDB(error)
        if (error.name === 'JsonWebTokenError') error = handleJWTError()
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError()

        sendErrorProd(error,req, res)
    }

}