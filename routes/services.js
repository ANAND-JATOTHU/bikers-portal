const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Service = require('../models/Service');
const User = require('../models/User');
const Review = require('../models/Review');
const { ensureAuthenticated } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const serviceController = require('../controllers/serviceController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up storage for service images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads/services');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `service-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Images only! Please upload a JPEG, JPG, PNG, or WEBP image.'));
    }
  }
});

// @route   GET /services
// @desc    Get services listing page
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Just render the services page - data will be loaded via AJAX
    res.render('services.html', {
      title: 'Find Motorcycle Services',
      page: 'services',
      currentUser: req.session.user
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).render('error.html', {
      error: 'Server error loading services',
      currentUser: req.session.user
    });
  }
});

// @route   GET /services/create
// @desc    Get service creation form
// @access  Private (Service Provider)
router.get('/create', [ensureAuthenticated, checkRole(['serviceProvider'])], (req, res) => {
  res.render('service-create.html', {
    title: 'Create a New Service',
    page: 'service-create',
    currentUser: req.session.user
  });
});

// @route   GET /services/:id
// @desc    Get service detail page
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('provider', 'username avatar company bio phone email website socialMedia location');
    
    if (!service) {
      return res.status(404).render('404.html', { 
        message: 'Service not found',
        currentUser: req.session.user
      });
    }
    
    // Get provider stats
    const provider = await User.findById(service.provider._id);
    const providerStats = {
      totalServices: await Service.countDocuments({ provider: provider._id, isActive: true }),
      reviewCount: await Review.countDocuments({ 
        targetType: 'Service',
        targetRef: { $in: await Service.find({ provider: provider._id }).select('_id') }
      }),
      avgRating: provider.avgRating || 0
    };
    
    // Get similar services
    const similarServices = await Service.find({
      _id: { $ne: service._id },
      serviceType: service.serviceType,
      isActive: true
    })
    .populate('provider', 'username avatar company')
    .limit(4);
    
    // Render the service detail page
    res.render('service-detail.html', {
      title: service.title,
      page: 'service-detail',
      service,
      provider: service.provider,
      providerStats,
      similarServices,
      currentUser: req.session.user,
      isSaved: req.session.user ? 
        req.session.user.savedServices && 
        req.session.user.savedServices.includes(service._id) : false
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).render('404.html', { 
        message: 'Service not found',
        currentUser: req.session.user
      });
    }
    res.status(500).render('error.html', {
      error: 'Server error loading service details',
      currentUser: req.session.user
    });
  }
});

// @route   GET /services/:id/edit
// @desc    Get service edit form
// @access  Private (Service Provider)
router.get('/:id/edit', [ensureAuthenticated, checkRole(['serviceProvider'])], async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).render('404.html', { 
        message: 'Service not found',
        currentUser: req.session.user
      });
    }
    
    // Check if service belongs to current user
    if (service.provider.toString() !== req.session.user._id) {
      return res.status(403).render('error.html', {
        error: 'Unauthorized - You can only edit your own services',
        currentUser: req.session.user
      });
    }
    
    res.render('service-edit.html', {
      title: `Edit Service: ${service.title}`,
      page: 'service-edit',
      service,
      currentUser: req.session.user
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).render('404.html', { 
        message: 'Service not found',
        currentUser: req.session.user
      });
    }
    res.status(500).render('error.html', {
      error: 'Server error loading service edit form',
      currentUser: req.session.user
    });
  }
});

// @route   POST /services
// @desc    Create a service
// @access  Private (Service Provider)
router.post(
  '/',
  [
    ensureAuthenticated,
    checkRole(['serviceProvider']),
    upload.array('images', 8),
    [
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('serviceType', 'Service type is required').not().isEmpty(),
      check('price', 'Price is required').isNumeric(),
      check('location', 'Location is required').not().isEmpty(),
      check('contact', 'Contact information is required').not().isEmpty(),
    ]
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const serviceData = {
        ...req.body,
        provider: req.session.user._id
      };
      
      const service = await serviceController.createService(serviceData, req.files);
      res.status(201).json({ success: true, data: service });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route   PUT /services/:id
// @desc    Update a service
// @access  Private (Service Provider)
router.put(
  '/:id',
  [
    ensureAuthenticated,
    checkRole(['serviceProvider']),
    upload.array('images', 8),
    [
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('serviceType', 'Service type is required').not().isEmpty(),
      check('price', 'Price is required').isNumeric(),
    ]
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const service = await Service.findById(req.params.id);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }
      
      // Check if user owns the service
      if (service.provider.toString() !== req.session.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to update this service' });
      }
      
      const updatedService = await serviceController.updateService(req.params.id, req.body, req.files);
      res.json({ success: true, data: updatedService });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route   DELETE /services/:id
// @desc    Delete a service
// @access  Private (Service Provider)
router.delete(
  '/:id',
  [ensureAuthenticated, checkRole(['serviceProvider'])],
  async (req, res) => {
    try {
      const service = await Service.findById(req.params.id);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }
      
      // Check if user owns the service
      if (service.provider.toString() !== req.session.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to delete this service' });
      }
      
      await serviceController.deleteService(req.params.id);
      res.json({ success: true, message: 'Service deleted successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

module.exports = router; 