const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const sellerController = require('../controllers/sellerController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware to check if user is authenticated
const isAuthenticated = authMiddleware.isAuthenticated;

// GET /sellers - List all sellers
router.get('/', sellerController.getAllSellers);

// GET /sellers/:id - Get seller profile
router.get('/:id', sellerController.getSellerProfile);

// API Routes
// POST /api/sellers/:id/follow - Follow/unfollow a seller
router.post('/api/sellers/:id/follow', isAuthenticated, sellerController.toggleFollow);

// POST /api/sellers/:id/reviews - Add a review for a seller
router.post('/api/sellers/:id/reviews', 
    isAuthenticated,
    [
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        body('text').isLength({ min: 5, max: 1000 }).withMessage('Review text must be between 5 and 1000 characters')
    ],
    sellerController.addReview
);

// GET /api/sellers/:id/bikes - Get seller's bikes with pagination
router.get('/api/sellers/:id/bikes', sellerController.getSellerBikes);

// GET /api/sellers/:id/reviews - Get seller's reviews with pagination
router.get('/api/sellers/:id/reviews', sellerController.getSellerReviews);

// POST /api/messages - Send a message
router.post('/api/messages', 
    isAuthenticated,
    [
        body('recipient').isMongoId().withMessage('Valid recipient ID is required'),
        body('subject').isLength({ min: 3, max: 100 }).withMessage('Subject must be between 3 and 100 characters'),
        body('content').isLength({ min: 5, max: 2000 }).withMessage('Message content must be between 5 and 2000 characters')
    ],
    sellerController.sendMessage
);

module.exports = router; 