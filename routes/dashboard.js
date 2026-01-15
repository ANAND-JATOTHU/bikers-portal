const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const Bike = require('../models/Bike');
const { ensureAuthenticated } = require('../middleware/auth');

// @route   GET /dashboard
// @desc    Get user dashboard
// @access  Private
router.get('/', dashboardController.getDashboard);

// @route   GET /dashboard/profile
// @desc    Get user profile for dashboard
// @access  Private
router.get('/profile', dashboardController.getProfile);

// @route   GET /dashboard/bikes
// @desc    Get user's bike listings for dashboard
// @access  Private
router.get('/bikes', dashboardController.getUserBikes);

// @route   GET /dashboard/services
// @desc    Get user's service listings for dashboard
// @access  Private (Service Provider Only)
router.get('/services', dashboardController.getUserServices);

// @route   GET /dashboard/saved
// @desc    Get user's saved items for dashboard
// @access  Private
router.get('/saved', dashboardController.getSavedItems);

// @route   GET /dashboard/security
// @desc    Get account security page
// @access  Private
router.get('/security', dashboardController.getSecurity);

// @route   GET /dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', dashboardController.getDashboardStats);

// API routes for AJAX calls from dashboard
router.get('/api/bikes', ensureAuthenticated, async (req, res) => {
  try {
    const userBikes = await Bike.find({ seller: req.session.user._id })
      .sort({ createdAt: -1 })
      .select('title brand model year price mileage images thumbnailImage createdAt updatedAt status');
    
    // Process bikes for display on dashboard
    const bikes = userBikes.map(bike => {
      const bikeObj = bike.toObject();
      
      // Check if each image is a data URL or file path
      if (bikeObj.images && bikeObj.images.length > 0) {
        // Keep valid images only (actual data URLs or valid image paths)
        bikeObj.images = bikeObj.images.filter(img => {
          return img && (
            img.startsWith('data:image/') || 
            img.startsWith('http') || 
            img.startsWith('/uploads/')
          );
        });
      }
      
      // If no valid images, use default
      if (!bikeObj.images || bikeObj.images.length === 0) {
        bikeObj.images = ['/images/default-bike.jpg'];
      }
      
      // If thumbnail is not set or is not valid, use the first valid image
      if (!bikeObj.thumbnailImage || (
          !bikeObj.thumbnailImage.startsWith('data:image/') && 
          !bikeObj.thumbnailImage.startsWith('http') && 
          !bikeObj.thumbnailImage.startsWith('/uploads/')
        )) {
        bikeObj.thumbnailImage = bikeObj.images[0];
      }
      
      return bikeObj;
    });
    
    res.json({ success: true, bikes });
  } catch (error) {
    console.error('Error fetching user bikes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch your bikes' });
  }
});

router.get('/api/saved', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }
    
    const user = await require('../models/User').findById(req.session.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Get user's favorite bikes
    const favoriteBikes = await require('../models/Bike').find({
      _id: { $in: user.favorites?.bikes || [] }
    }).select('title images price year mileage').limit(3);
    
    // Get user's favorite services
    const favoriteServices = await require('../models/Service').find({
      _id: { $in: user.favorites?.services || [] }
    }).select('title images price').limit(3);
    
    // Format items for the frontend
    const items = [
      ...favoriteBikes.map(bike => ({
        itemId: bike._id,
        title: bike.title,
        type: 'bike',
        image: bike.images && bike.images.length > 0 ? bike.images[0] : '/images/placeholder-bike.jpg'
      })),
      ...favoriteServices.map(service => ({
        itemId: service._id,
        title: service.title,
        type: 'service',
        image: service.images && service.images.length > 0 ? service.images[0] : '/images/placeholder.jpg'
      }))
    ];
    
    return res.status(200).json({
      success: true,
      items
    });
  } catch (error) {
    console.error('Error fetching saved items:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router; 