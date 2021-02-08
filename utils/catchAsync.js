/**
 * @DESC takes a async function 
 * @param function 
 * @RETURN returns a same function with error handler attached to it.
 */

module.exports = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(err => next(err))
    }
}