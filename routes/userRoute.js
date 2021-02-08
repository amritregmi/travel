const express = require('express')

const userController = require('../controllers/userController')
const authController = require('../controllers/authController')

const router = express.Router()

//public api
router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.get('/logout', authController.logout)
router.post('/forgotPassword', authController.forgotPassword)
router.patch('/resetPassword/:token', authController.resetPassword)

/**
 * all routes below this point must be run via common middleware
 * and middleware function always runs in sequence.
 * To pass this line and go to below endpoint, THE CLIENT must logged IN 
 */
router.use(authController.isAuthenticated)

router.patch('/updateMyPassword', authController.updatePassword)
router.get('/me', userController.getMe, userController.getUser)

router.patch('/updateMe',
    userController.uploadUserPhoto, // upload photo in memory
    userController.resizeUserPhoto, // upload photo in disk
    userController.updateMe // update photo property in model.
)

router.delete('/deleteMe', userController.deleteMe)

/**
 * all the action below can be used only by administrator 
 * SO, add a restrict to middleware if they want to use below endpoints 
 */
router.use(authController.hasAccessTo('admin'))

router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser)

router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser)

module.exports = router