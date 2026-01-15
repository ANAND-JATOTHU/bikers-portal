const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Set up storage for bike images
const bikeStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadPath = path.join(__dirname, '../public/uploads/bikes');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        // Generate unique filename with original extension
        const uniquePrefix = crypto.randomBytes(8).toString('hex');
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, `${uniquePrefix}-${Date.now()}${extension}`);
    }
});

// Set up storage for profile images
const profileStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadPath = path.join(__dirname, '../public/uploads/profiles');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        // Generate unique filename with original extension
        const uniquePrefix = crypto.randomBytes(8).toString('hex');
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, `${uniquePrefix}-${Date.now()}${extension}`);
    }
});

// File filter for images
const imageFilter = function(req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files (jpg, jpeg, png, gif) are allowed!'), false);
    }
    cb(null, true);
};

// Initialize upload for bike images
const uploadBikeImages = multer({
    storage: bikeStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    },
    fileFilter: imageFilter
}).array('images', 10); // Allow up to 10 images

// Initialize upload for profile image
const uploadProfileImage = multer({
    storage: profileStorage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB max file size
    },
    fileFilter: imageFilter
}).single('profileImage');

// Middleware wrappers
exports.uploadBikeImages = function(req, res, next) {
    uploadBikeImages(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading
            if (err.code === 'LIMIT_FILE_SIZE') {
                req.fileValidationError = 'File size too large. Maximum size is 5MB.';
            } else if (err.code === 'LIMIT_FILE_COUNT') {
                req.fileValidationError = 'Too many files. Maximum is 10 images.';
            } else {
                req.fileValidationError = 'Error uploading files.';
            }
            return next();
        } else if (err) {
            // An unknown error occurred
            req.fileValidationError = err.message;
            return next();
        }
        
        // Everything went fine
        next();
    });
};

exports.uploadProfileImage = function(req, res, next) {
    uploadProfileImage(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading
            if (err.code === 'LIMIT_FILE_SIZE') {
                req.fileValidationError = 'File size too large. Maximum size is 2MB.';
            } else {
                req.fileValidationError = 'Error uploading profile image.';
            }
            return next();
        } else if (err) {
            // An unknown error occurred
            req.fileValidationError = err.message;
            return next();
        }
        
        // Everything went fine
        next();
    });
}; 