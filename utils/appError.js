/**
 * @DESC Custom Error class
 * @PARAM String:message, Number:statusCode 
 * @EXPLAIN This is Error Department, where all kinds of guy  
 *          gives responsibility to create an error object.
 *          The error object created by this department is then passed to next() function
 *          next(error) invokes the middleware function 
 *           globalErrorHandler, and this function sends appropriate error response
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message)
        this.statusCode = statusCode
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
        this.operational = true

        /**
         * @EXPLAIN 
         * Without passing this.constructor to captureStackTrace, the this.constructor
         * frame would show up in the .stack property. By passing
         * the constructor, we omit that frame, and retain all frames below it.
         */

        Error.captureStackTrace(this, this.constructor)
    }
}
module.exports = AppError