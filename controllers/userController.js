const sharp = require('sharp')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const User = require('./../models/userModel')
const factory = require('./handlerFactory')
const uploader = require('../utils/imageUploader')

/**
 * @DESC Gets a fully fledged object and filters it to required obj.
 * @PARAMS db object, fields to update
 * @RETURNS filtered object that is getting updated.
 */
const filterObj = (obj, ...allowedFields) => {
    const newObj = {}
    Object.keys(obj).forEach(key => {
        if (allowedFields.includes(key)) {
            newObj[key] = obj[key]
        }
    })
    return newObj
}
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id
    next()
}
/**
 * @DESC user are allowed to update their email and name only
 * @FORBIDS user to change password and role. 
 * @PARAMS name, email 
 * @RETURNS 201 json updated user.
 */

exports.updateMe = catchAsync(async (req, res, next) => {
    //1 Throw error if user wants to update password
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('For password update use, /updateMyPassword', 400))
    }
    //2 Filter unwanted fields name that are not allowed to update by current user.
    const filterBody = filterObj(req.body, 'name', 'email')

    // add photo property to filterBody so that we can upload photo name 
    if (req.file) filterBody.photo = req.file.filename
    
    //3 update User Document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
        new: true,
        runValidator: true,
    })
    res.status(201).json({
        status: 'success',
        user: updatedUser,
    })
})
/**
 * @DESC Deactivates the Current User.
 * @PARAM signed in user details 
 * @HOW the current user's active field is set to false.
 * @RETURNS 204 json nodata
 * @PERFORMED by : current user
 */
exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, {
        active: false
    })
    res.status(204).json({
        status: 'success',
        data: null
    })
})
/**
 * @DESC deletes user based on id 
 * @PERFORMED by: only admin 
 */
exports.deleteUser = factory.deleteOne(User)

/**
 * @DESC updates user based on id 
 * @PERFORMED by: only admin 
 * @Dont update password with this
 */
exports.updateUser = factory.updateOne(User)

/**
 * @DESC get single user
 */
exports.getUser = factory.getOne(User)

/**
 * @DESC Gets all user 
 * @RETURNS 200 json list if users.
 */
exports.getAllUsers = factory.getAll(User)


exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not yet defined, please use /signup instead'
    })
}

/**
 * Upload user photo in memory 
 */
exports.uploadUserPhoto = uploader.upload.single('photo')

/**
 * Resize the photo, and adds file name in req.file.filename
 * Stores the image in public/img/users
 */
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next()
    
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

    // resize the image 
    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`)
    
    next()

})