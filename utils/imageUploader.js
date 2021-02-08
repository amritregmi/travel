const multer = require('multer')
const AppError = require('./appError')

/**
 * @Returns memory storage unit 
 * @TELLING multer to use memory not disk.
 */
const multerMemoryStorage = multer.memoryStorage();

/**
 * @Returns Disk storage unit 
 * @TELLING multer to use disk not memory
 */
const multerDiskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null,'public/img/users')
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split('/')[1]
        cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
    }
})

/**
 * @DESC creating filter object for images only
 * @ONLY images are accepted
 */
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null,true) 
    } else {
        cb(new AppError('Not an image type, please upload only image', 400), false)
    }
}

/**
 * @DESC create a multer object with memory storage. 
 */
exports.upload = multer({
    multerFilter,
    multerMemoryStorage,
})
