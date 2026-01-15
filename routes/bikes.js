const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const bikeController = require('../controllers/bikeController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const Bike = require('../models/Bike');
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth');

// Middleware
const isAuthenticated = authMiddleware.isAuthenticated;
const isSellerRole = authMiddleware.isSellerRole;
const uploadBikeImages = uploadMiddleware.uploadBikeImages;

// Validation middleware
const validateBikeInput = [
    body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
    body('brand').trim().notEmpty().withMessage('Brand is required'),
    body('model').trim().notEmpty().withMessage('Model is required'),
    body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Valid year is required'),
    body('price').isInt({ min: 1 }).withMessage('Valid price is required'),
    body('mileage').isInt({ min: 0 }).withMessage('Valid mileage is required'),
    body('engineCapacity').isInt({ min: 1 }).withMessage('Valid engine capacity is required'),
    body('description').trim().isLength({ min: 20, max: 2000 }).withMessage('Description must be between 20 and 2000 characters'),
    body('condition').isIn(['new', 'excellent', 'good', 'fair', 'poor']).withMessage('Valid condition is required'),
    body('color').trim().notEmpty().withMessage('Color is required'),
    body('fuelType').isIn(['petrol', 'diesel', 'electric', 'hybrid']).withMessage('Valid fuel type is required'),
    body('category').isIn(['sport', 'cruiser', 'touring', 'standard', 'off-road', 'scooter', 'moped', 'other']).withMessage('Valid category is required'),
    body('location').trim().notEmpty().withMessage('Location is required')
];

// Public routes
// GET /bikes - Get all bikes (buyer's view with filtering)
router.get('/', async (req, res) => {
  try {
    // Parse query parameters for filtering
    const query = {};
    
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = 12; // Number of bikes per page
    const skip = (page - 1) * limit;
    
    // Build filter for database query
    const filter = { status: 'Active' };
    
    // Apply filters based on query parameters
    if (req.query.brand) {
      filter.brand = req.query.brand;
      query.brand = req.query.brand;
    }
    
    if (req.query.category) {
      filter.category = req.query.category;
      query.category = req.query.category;
    }
    
    if (req.query.condition) {
      filter.condition = req.query.condition;
      query.condition = req.query.condition;
    }
    
    if (req.query.location) {
      filter.location = req.query.location;
      query.location = req.query.location;
    }
    
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) {
        filter.price.$gte = parseInt(req.query.minPrice);
        query.minPrice = req.query.minPrice;
      }
      if (req.query.maxPrice) {
        filter.price.$lte = parseInt(req.query.maxPrice);
        query.maxPrice = req.query.maxPrice;
      }
    }
    
    if (req.query.minYear || req.query.maxYear) {
      filter.year = {};
      if (req.query.minYear) {
        filter.year.$gte = parseInt(req.query.minYear);
        query.minYear = req.query.minYear;
      }
      if (req.query.maxYear) {
        filter.year.$lte = parseInt(req.query.maxYear);
        query.maxYear = req.query.maxYear;
      }
    }
    
    // Determine sort order
    let sortOptions = { createdAt: -1 }; // Default: newest first
    if (req.query.sortBy) {
      query.sortBy = req.query.sortBy;
      
      switch(req.query.sortBy) {
        case 'price-low':
          sortOptions = { price: 1 };
          break;
        case 'price-high':
          sortOptions = { price: -1 };
          break;
        case 'year-new':
          sortOptions = { year: -1 };
          break;
        case 'year-old':
          sortOptions = { year: 1 };
          break;
      }
    }
    
    // Get total count of bikes matching the filter
    const totalBikes = await Bike.countDocuments(filter);
    const totalPages = Math.ceil(totalBikes / limit);
    
    // Get bikes with the filter and sort options
    const bikes = await Bike.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('seller', 'firstName lastName username');
    
    // Get unique values for filter dropdowns
    const brands = await Bike.distinct('brand', { status: 'Active' });
    const categories = await Bike.distinct('category', { status: 'Active' });
    const conditions = await Bike.distinct('condition', { status: 'Active' });
    const locations = await Bike.distinct('location', { status: 'Active' });
    
    // Get min/max values for range filters
    const stats = {};
    const priceStats = await Bike.aggregate([
      { $match: { status: 'Active' } },
      { 
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          minYear: { $min: '$year' },
          maxYear: { $max: '$year' }
        }
      }
    ]);
    
    if (priceStats.length > 0) {
      stats.minPrice = priceStats[0].minPrice;
      stats.maxPrice = priceStats[0].maxPrice;
      stats.minYear = priceStats[0].minYear;
      stats.maxYear = priceStats[0].maxYear;
    } else {
      // Default values if no bikes exist
      stats.minPrice = 0;
      stats.maxPrice = 1000000;
      stats.minYear = 2000;
      stats.maxYear = new Date().getFullYear();
    }
    
    res.render('bikes.html', {
      title: 'Motorcycles',
      page: 'bikes',
      bikes,
      totalBikes,
      brands,
      categories,
      conditions,
      locations,
      stats,
      query,
      currentPage: page,
      totalPages,
      getPaginationUrl: (pageNum) => {
        const url = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
        url.searchParams.set('page', pageNum);
        return `${url.pathname}${url.search}`;
      },
      currentUser: req.session.user
    });
  } catch (err) {
    console.error('Error fetching bikes:', err);
    res.status(500).render('error.html', { 
      error: 'Error loading motorcycles',
      currentUser: req.session.user
    });
  }
});

// GET /bikes/:id - Get single bike details
router.get('/:id', async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id)
      .populate('seller', 'firstName lastName username profileImage');
    
    if (!bike) {
      return res.status(404).render('404.html', {
        message: 'Bike not found',
        currentUser: req.session.user
      });
    }
    
    // Get similar bikes
    const similarBikes = await Bike.find({
      _id: { $ne: bike._id },
      $or: [
        { category: bike.category },
        { brand: bike.brand }
      ],
      status: 'Active'
    })
    .limit(4)
    .populate('seller', 'firstName lastName username');
    
    res.render('bike-details.html', {
      title: bike.title,
      bike,
      similarBikes,
      currentUser: req.session.user
    });
  } catch (err) {
    console.error('Error fetching bike details:', err);
    res.status(500).render('error.html', { 
      error: 'Error loading bike details',
      currentUser: req.session.user
    });
  }
});

// Seller routes (authenticated)
// GET /bikes/new - Form to create a new bike listing
router.get('/new', isAuthenticated, isSellerRole, bikeController.getCreateBikeForm);

// POST /bikes - Create a new bike listing
router.post('/', 
    isAuthenticated, 
    isSellerRole, 
    uploadBikeImages, 
    validateBikeInput, 
    bikeController.createBike
);

// GET /bikes/:id/edit - Form to edit a bike listing
router.get('/:id/edit', isAuthenticated, bikeController.getEditBikeForm);

// PUT /bikes/:id - Update a bike listing
router.put('/:id', 
    isAuthenticated, 
    uploadBikeImages, 
    validateBikeInput, 
    bikeController.updateBike
);

// DELETE /bikes/:id - Delete a bike listing
router.delete('/:id', isAuthenticated, bikeController.deleteBike);

// PATCH /bikes/:id/mark-sold - Mark a bike as sold
router.patch('/:id/mark-sold', isAuthenticated, bikeController.markBikeAsSold);

module.exports = router; 