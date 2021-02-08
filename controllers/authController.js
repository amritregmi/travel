const crypto = require('crypto')
const { promisify } = require('util')
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const jwt = require('jsonwebtoken')
const AppError = require('./../utils/appError')
const Email = require('./../utils/email')

/**
 * @DESC when id is provided to this function
 * It creates a JWT signed Token with the help of secret key.
 * @PARAM id
 * @RETURNS token 
 */
const signToken = id => {
    // takes id, secret key and expire time
    const token = jwt.sign({
        id
    }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
    return token
}
/**
 * @DESC signs a token and send a response 
 * @PARAM userObject, statusCode, response Obj
 * @RETURNS final response with status code and token
 */
const createSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id)

    // const cookieOptions = {
    //     expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000), // 90 days in millisecond
    //     httpOnly: true // cookie cannot be accessed or modified by browser
    // }
    // if (process.env.NODE_ENV === 'production') {
    //     cookieOptions.secure = true // sends cookie only in encrypted connection HTTPS. 
    // }

    // for heroku 
    //cookieOptions.secure = req.secure || req.headers['x-forwarded-proto'] === 'https'
    
    // sending cookie to the web browser
    res.cookie('jwt', token, {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000), // 90 days in millisecond
        httpOnly: true, // cookie cannot be accessed or modified by browser,
        // for heroku
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https' // this header will be set
    })

    //removes the password field in response
    user.password = undefined

    res.status(statusCode).json({
        status: 'success',
        token: token,
        data: {
            user
        }
    })
}
/**
 * @DESC    User is created,
 *           password is hashed, 
 *          token is generated,
 *          UserModel (name, email, password, passwordConfirm, photo)
 * @RETURNS response with token and welcome email.
 */

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        photo: req.body.photo,
        role: req.body.role
    })
    // send welcome email
    const url = `${req.protocol}://${req.get('host')}/me`
    await new Email(newUser, url).sendWelcome() // move on if email is sent

    // send response.
    createSendToken(newUser, 201, req, res)
})
/**
 * @DESC If user exist and password is correct, the user loges in and gets a token.
 */

exports.login = catchAsync(async (req, res, next) => {

    const {
        email,
        password
    } = req.body

    //check if email and password exist 
    //! check this, should return 
    if (!email || !password) next(new AppError('provide email and password', 400))

    // check if user exist and password is correct 
    const user = await User.findOne({
        email
    }).select('+password')

    // Compare password 
    if (!user || !await user.correctPassword(password, user.password)) {
        return next(new AppError('Incorrect email or password'), 401)
    }

    // if everything is ok, get signed token
    const token = signToken(user._id)

    // 4 log user in, send jwt
    createSendToken(user, 200, req, res)

})

/**
 * @DESC sends back cookie without the token
 * @USED for logging out the user. 
 */
exports.logout = (req, res) => {
    res.cookie('jwt', 'logged out cookie', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    })
    res.status(200).json({
        status: 'success'
    })
}
/**
 * @DESC checks if the user isAuthenticated.
 *       gets a token and verifies if the token is valid. 
 * @PARAMS token (in req.authorization.token)
 * @RETURNS goes to next function. adds Current user in req.user
 */
exports.isAuthenticated = catchAsync(async (req, res, next) => {
    let token
    //1 check if there is token in request object. as a Bearer token (FOR POSTMAN API)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies.jwt) { // Or check for cookie in req.cookies 
        token = req.cookies.jwt // this way it works with postman and web request via cookies.
    }
    if (!token) {
        return next(new AppError('You are not logged in! Please log in to access', 401))
    }
    //2 Validate the token, verification! 
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);

    //3 Check if the user still exist
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) return next(new AppError('The user belonging to this token no longer exist', 401))

    //4 check if user changed password after JWT was issued. 
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password, please log in again', 401))
    }

    // if user is authenticated, we attach authenticated user into req.user (NICE HACK)
    req.user = currentUser
    res.locals.user = currentUser // this helps templates to access user data anywhere
    next()
})

/**
 * This middleware is only for rendered pages
 * To check if user is logged in (THis is similar to isAuthenticated(protects the route))
 * The goal is not to protect any route, just check for logged user 
 * There won't be any errors here
 * @RETURNS logged in user or not logged in user for templates by attaching user info in res.locals.user
 */
exports.isLoggedIn = async (req, res, next) => {
    //1 check for the cookie in req.cookies
    if (req.cookies.jwt) { // Or check for cookie in req.cookies 
        try {
            //2 Validate the token, verification! 
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET_KEY);

            //3 Check if the user still exist
            const currentUser = await User.findById(decoded.id)
            if (!currentUser) return next() // if not don't do anything go to next middleware

            //4 check if user changed password after JWT was issued. 
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next()
            }
            // At this point there is a logged in user
            // In template there will be a variable called user 
            // All template has access to res.locals 
            res.locals.user = currentUser
            return next()
        } catch (error) {
            // There is no logged in user
            return next()
        }
    }
    next() // when no cookie , res.locals won't have logged in user
}

/**
 * @DESC This function gets the roles and checks if the user is allowed to access the role.
 * @PARAMS roles array
 * @RETURNS a middleware function and provides roles to middleware function via closure. 
 */
exports.hasAccessTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'lead-guide']
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action.', 403))
        }
        next()
    }
}
/**
 * @DESC This guy sends sends reset link in the email.
 * @PARAM email 
 * @RETURNS 200 json 
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1. Get user based on posted email
    const user = await User.findOne({
        email: req.body.email
    })

    if (!user) return next(new AppError('There is no user with this email', 404))
    // 2. Generate the random reset token 
    const resetToken = await user.createPasswordResetToken()
    await user.save({
        validateBeforeSave: false
    })

    try {
        // create a reset url
        const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`

        // send reset email to the user
        await new Email(user, resetUrl).sendPassportReset() // move on if email is sent

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        })
    } catch (error) {
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save({
            validateBeforeSave: false
        })

        return next(error)
    }


})
/**
 * @DESC Changes the password
 * @PARAMS token (users/resetPassword/:token)
 * @RETURNS 200 status and token 
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1. Get user based on the token 
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    // need to grab a user which has same hash token and is not expired at this time. 
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {
            $gt: Date.now()
        }
    })

    //2. If token has not expired, and there is user, set new password 
    if (!user) {
        return next(new AppError('Token is not valid or has expired', 400))
    }
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken = undefined // it has been already used, OTP is deleted 
    user.passwordResetExpires = undefined // same as above
    await user.save()

    //3. update changedPasswordAt property for the user done by middleware function

    //4. Log the user in, Send JWT
    createSendToken(user, 200, req, res)
    
})

/**
 * @DESC Updates password 
 * @PARAM id 
 * @RETURNS 200 json token 
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1 Get user from collection and ask for password data explicitly
    const user = await User.findById(req.user.id).select('+password')

    // 2 Check if the posted current password is correct 
    if (!await user.correctPassword(req.body.passwordCurrent, user.password)) {
        return next(new AppError('current password wrong', 401))
    }

    // 3 if so, update password 
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm

    /**
     * @cannot use user.findByIdAndUpdate() will not work. ? 
     *  !validation doesn't work. Mongoose doesn't keep track of current obj in memory.
     *  !Two pre save middleware will also not work
     *  # For validation, the function validates with this.password and we don't have this.password
     *  # we only have PasswordCurrent and password and passwordConfirm 
     * !SO DON'T USE UPDATE ANYTHING RELATED TO PASSWORD, ONLY USE save() or create()
     * 
     */
    await user.save() // two pre hook middleware functions are run before saving, hashing 

    // 4 log user in, send jwt
    createSendToken(user, 200, req, res)
    
})