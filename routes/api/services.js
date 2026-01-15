const express = require('express');
const router = express.Router();
const { body, validationResult, param } = require('express-validator');
const { ensureAuthenticated } = require('../../middleware/auth');
const serviceController = require('../../controllers/serviceController');
const Service = require('../../models/Service');
const User = require('../../models/User');
const Review = require('../../models/Review');
const Booking = require('../../models/Booking');
const { isServiceProvider } = require('../../middleware/roleCheck');

/**
 * @route   GET /api/services
 * @desc    Get all services with filters
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const services = await serviceController.getAllServices(req.query);
    res.json(services);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/services/featured
 * @desc    Get featured services
 * @access  Public
 */
router.get('/featured', async (req, res) => {
  try {
    const services = await serviceController.getFeaturedServices();
    res.json(services);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/services/:id
 * @desc    Get service by ID
 * @access  Public
 */
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid service ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const service = await serviceController.getServiceById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.json({ success: true, data: service });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/services
 * @desc    Create a service
 * @access  Private (Service providers only)
 */
router.post('/', [
  ensureAuthenticated,
  isServiceProvider,
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('serviceType').trim().notEmpty().withMessage('Service type is required'),
  body('price').isNumeric().withMessage('Price must be a number').custom(value => value > 0).withMessage('Price must be greater than 0'),
  body('location.address').trim().notEmpty().withMessage('Address is required'),
  body('location.city').trim().notEmpty().withMessage('City is required'),
  body('location.state').trim().notEmpty().withMessage('State is required'),
  body('location.coordinates').optional().isArray().withMessage('Coordinates must be an array'),
  body('availability').isArray().withMessage('Availability must be an array'),
  body('contactPhone').optional().trim().isMobilePhone().withMessage('Valid phone number is required'),
  body('contactEmail').optional().trim().isEmail().withMessage('Valid email is required'),
  body('specializations').optional().isArray().withMessage('Specializations must be an array'),
  body('certifications').optional().isArray().withMessage('Certifications must be an array')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
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
});

/**
 * @route   PUT /api/services/:id
 * @desc    Update a service
 * @access  Private (Service provider who owns the service)
 */
router.put('/:id', [
  ensureAuthenticated,
  isServiceProvider,
  param('id').isMongoId().withMessage('Invalid service ID'),
  body('title').optional().trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description').optional().trim().notEmpty().withMessage('Description is required').isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('serviceType').optional().trim().notEmpty().withMessage('Service type is required'),
  body('price').optional().isNumeric().withMessage('Price must be a number').custom(value => value > 0).withMessage('Price must be greater than 0'),
  body('location.address').optional().trim().notEmpty().withMessage('Address is required'),
  body('location.city').optional().trim().notEmpty().withMessage('City is required'),
  body('location.state').optional().trim().notEmpty().withMessage('State is required'),
  body('contactPhone').optional().trim().isMobilePhone().withMessage('Valid phone number is required'),
  body('contactEmail').optional().trim().isEmail().withMessage('Valid email is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
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
});

/**
 * @route   DELETE /api/services/:id
 * @desc    Delete a service
 * @access  Private (Service provider who owns the service)
 */
router.delete('/:id', [
  ensureAuthenticated,
  isServiceProvider,
  param('id').isMongoId().withMessage('Invalid service ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

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
});

/**
 * @route   GET /api/services/:id/availability
 * @desc    Get available time slots for a service on a specific date
 * @access  Public
 */
router.get('/:id/availability', [
  param('id').isMongoId().withMessage('Invalid service ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ success: false, message: 'Date parameter is required' });
  }

  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Find the service's availability for the selected day of week
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayAvailability = service.availability.find(day => day.day.toLowerCase() === dayNames[dayOfWeek]);

    if (!dayAvailability || !dayAvailability.available) {
      return res.json({ success: true, availableTimeSlots: [] });
    }

    // Get all existing bookings for this service on the selected date
    const bookings = await Booking.find({
      service: req.params.id,
      date: {
        $gte: new Date(new Date(date).setHours(0, 0, 0)),
        $lt: new Date(new Date(date).setHours(23, 59, 59))
      }
    }).select('timeSlot');

    // Generate available time slots based on opening and closing hours
    const bookedTimeSlots = bookings.map(booking => booking.timeSlot);
    const openTime = dayAvailability.openTime || '09:00';
    const closeTime = dayAvailability.closeTime || '17:00';
    
    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);
    
    const timeSlots = [];
    const slotDuration = 60; // in minutes
    
    let currentHour = openHour;
    let currentMinute = openMinute;
    
    while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
      const timeSlot = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      if (!bookedTimeSlots.includes(timeSlot)) {
        timeSlots.push(timeSlot);
      }
      
      currentMinute += slotDuration;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute %= 60;
      }
    }

    res.json({ success: true, availableTimeSlots: timeSlots });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/services/:id/reviews
 * @desc    Get reviews for a service
 * @access  Public
 */
router.get('/:id/reviews', [
  param('id').isMongoId().withMessage('Invalid service ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const reviews = await Review.find({ serviceId: req.params.id })
      .populate('userId', 'username profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalReviews = await Review.countDocuments({ serviceId: req.params.id });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        total: totalReviews,
        page,
        pages: Math.ceil(totalReviews / limit)
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/services/:id/reviews
 * @desc    Add a review for a service
 * @access  Private
 */
router.post('/:id/reviews', [
  ensureAuthenticated,
  param('id').isMongoId().withMessage('Invalid service ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').trim().notEmpty().withMessage('Review text is required').isLength({ max: 500 }).withMessage('Review cannot exceed 500 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Check if user has already reviewed this service
    const existingReview = await Review.findOne({
      serviceId: req.params.id,
      userId: req.session.user._id
    });

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this service' });
    }

    // Create new review
    const newReview = new Review({
      serviceId: req.params.id,
      userId: req.session.user._id,
      rating: req.body.rating,
      review: req.body.review
    });

    await newReview.save();

    // Update service rating
    const allReviews = await Review.find({ serviceId: req.params.id });
    const ratingSum = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const ratingAvg = ratingSum / allReviews.length;

    service.rating.average = ratingAvg;
    service.rating.count = allReviews.length;
    await service.save();

    // Return the new review with user info
    const populatedReview = await Review.findById(newReview._id).populate('userId', 'username profileImage');

    res.status(201).json({ success: true, data: populatedReview });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   PUT /api/services/:id/toggle-save
 * @desc    Toggle save/unsave a service
 * @access  Private
 */
router.put('/:id/toggle-save', [
  ensureAuthenticated,
  param('id').isMongoId().withMessage('Invalid service ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const user = await User.findById(req.session.user._id);
    
    // Check if user has already saved this service
    const serviceIndex = user.savedServices.indexOf(req.params.id);
    let message = '';
    
    if (serviceIndex === -1) {
      // Save service
      user.savedServices.push(req.params.id);
      message = 'Service saved successfully';
    } else {
      // Unsave service
      user.savedServices.splice(serviceIndex, 1);
      message = 'Service removed from saved items';
    }
    
    await user.save();
    
    res.json({ 
      success: true, 
      message,
      isSaved: serviceIndex === -1
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 