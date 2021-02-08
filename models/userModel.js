const crypto = require('crypto')
const mongoose = require('mongoose');
const validator = require('validator')
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'name is required']
    },
    email: {
        type: String,
        required: [true, 'email is required'],
        unique: [true, 'email already taken'],
        lowercase: true,
        validate: [validator.isEmail, 'invalid email type']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, 'password is required'],
        minlength: [5, 'password must be at least 8 characters'],
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'confirm password is required'],
        validate: {
            // works only in create and save but not updateById
            validator: function (passwordConfirm) {
                return passwordConfirm === this.password
            },
            message: 'confirm password must match'
        },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
})

/**
 * @DESC password is hashed before saving. Runs before saving the document
 *       Password is hashed before saving. 
 *       works with save, doesn't work with update.
 * @PARAM {this} points current user document (document middleware)
 * @RETURNS from middleware stack, by hashing the current document password.
 */

userSchema.pre('save', async function (next) {
    // Running this function if password is actually modified. 
    if (!this.isModified('password')) return next()
    // if the user is new, above middleware function is invoked. 
    this.password = await bcrypt.hash(this.passwordConfirm, 12)
    // we don't save confirm password, no point in saving same thing in two fields. 
    this.passwordConfirm = undefined
    next()

})
/**
 * @DESC adds PasswordChangedAt field to the current document, when password is reset is called. 
 * @PARAM {this} => points to current user
 * @RETURNS from middleware stack, by adding passwordChangedAt field to current user.
 */
userSchema.pre('save', function () {
    // don't do anything if password is not changed or its a new signup document.  
    if (!this.isModified('password') || this.isNew) return next()
    // time is 1 sec just before now. 
    this.passwordChangedAt = Date.now() - 1000
    next()
})

/**
 * @DESC Query Middleware runs before any query. we are adding some more information to it. 
 *       we are excluding all users that are not active.
 * @PARAM {this} => points to current query
 * @RETURNS new Query with restricting user that are not active
 *          ANY guy querying for the user whose role is not active, wont be able to find it.
 */
userSchema.pre(/^find/, function (next) {
    //this points to current query
    this.find({
        active: {
            $ne: false
        }
    })
    next()
})

/**
 * @DESC This is an instance method, and is available for all document automatically,
 *       adding a method in the objects prototype
 * @PARAMS candidate password, real hashed password from database
 * @RETURNS boolean, true if match; false if no match. 
 */
userSchema.methods.correctPassword = async function (candidatePassword, actualPassword) {
    return await bcrypt.compare(candidatePassword, actualPassword)
}

/**
 * @DESC checks if user changed password after JWT was issued
 * @PARAM JWTTimeStamp, jwt issued time (is acquired when jwt is decoded by 
 *          decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);)
 * @RETURNS boolean ; true if password is changed after issuing token else false. 
 */
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
        return JWTTimestamp < changedTimestamp
    }
    return false
}
/**
 * @DESC This guy generates the token for password reset token.
 *        should be a random string, but should be cryptographically strong.
 *        randomBytes function from crypto module is best for this option.
 * @PARAMS 
 * @RETURNS resetToken 
 */
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex')

    this.passwordResetToken = crypto.createHash('sha256')
        .update(resetToken)
        .digest('hex')

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000 // adding 10 mins from now. 
    return resetToken
}

const User = mongoose.model('User', userSchema)

module.exports = User