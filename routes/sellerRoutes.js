const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /sellers - List all sellers
router.get('/', sellerController.getAllSellers);

// GET /sellers/:id - View a specific seller's profile
router.get('/:id', sellerController.getSellerProfile);

// POST /sellers/:id/follow - Follow/unfollow a seller (requires authentication)
router.post('/:id/follow', authMiddleware.isAuthenticated, sellerController.toggleFollowSeller);

// POST /sellers/:id/review - Add a review for a seller (requires authentication)
router.post('/:id/review', authMiddleware.isAuthenticated, sellerController.addSellerReview);

// GET /sellers/:id/bikes - Get a seller's bikes (for AJAX pagination)
router.get('/:id/bikes', sellerController.getSellerBikes);

// GET /sellers/:id/reviews - Get a seller's reviews (for AJAX pagination)
router.get('/:id/reviews', sellerController.getSellerReviews);

module.exports = router; 