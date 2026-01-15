const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Booking = require('../../models/Booking');
const Service = require('../../models/Service');
const User = require('../../models/User');

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings for current user
 * @access  Private
 */
router.get('/', auth.ensureAuthenticated, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.session.user._id })
      .populate('service', 'title serviceType price images')
      .populate('provider', 'username avatar company')
      .sort({ bookingDate: -1 });
    
    res.json({ success: true, bookings });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/bookings/provider
 * @desc    Get all bookings for a service provider
 * @access  Private (Service Provider)
 */
router.get('/provider', auth.ensureServiceProvider, async (req, res) => {
  try {
    // Find all services owned by the provider
    const services = await Service.find({ provider: req.session.user._id }).select('_id');
    const serviceIds = services.map(service => service._id);
    
    const bookings = await Booking.find({ service: { $in: serviceIds } })
      .populate('service', 'title serviceType price images')
      .populate('user', 'username avatar email phone')
      .sort({ bookingDate: -1 });
    
    res.json({ success: true, bookings });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Private
 */
router.post('/', [
    auth.ensureAuthenticated,
    [
      check('serviceId', 'Service ID is required').not().isEmpty(),
      check('date', 'Date is required').isISO8601().toDate(),
      check('time', 'Time is required').not().isEmpty()
    ]
  ], 
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { serviceId, date, time, notes } = req.body;
      
      // Find the service
      const service = await Service.findById(serviceId);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }
      
      // Combine date and time
      const [hours, minutes] = time.split(':');
      const bookingDateTime = new Date(date);
      bookingDateTime.setHours(parseInt(hours), parseInt(minutes));
      
      // Check if the time slot is available
      const existingBooking = await Booking.findOne({
        service: serviceId,
        bookingDate: bookingDateTime,
        status: { $nin: ['cancelled', 'declined'] }
      });
      
      if (existingBooking) {
        return res.status(400).json({ 
          success: false, 
          message: 'This time slot is no longer available. Please choose another time.' 
        });
      }
      
      // Create a new booking
      const newBooking = new Booking({
        service: serviceId,
        provider: service.provider,
        user: req.session.user._id,
        bookingDate: bookingDateTime,
        notes: notes || '',
        status: 'pending',
        price: service.price
      });
      
      await newBooking.save();
      
      res.json({ 
        success: true, 
        message: 'Booking created successfully',
        booking: await newBooking.populate('service', 'title serviceType')
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/**
 * @route   PUT /api/bookings/:id/status
 * @desc    Update booking status (for provider)
 * @access  Private (Service Provider)
 */
router.put('/:id/status', [
    auth.ensureServiceProvider,
    [
      check('status', 'Status is required').isIn(['pending', 'confirmed', 'completed', 'cancelled', 'declined'])
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { status } = req.body;
      
      // Find booking
      const booking = await Booking.findById(req.params.id)
        .populate('service', 'provider');
      
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      
      // Verify ownership
      if (booking.service.provider.toString() !== req.session.user._id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized to update this booking' 
        });
      }
      
      booking.status = status;
      if (status === 'confirmed') {
        booking.confirmedAt = Date.now();
      } else if (status === 'completed') {
        booking.completedAt = Date.now();
      }
      
      await booking.save();
      
      res.json({ 
        success: true, 
        message: `Booking ${status} successfully`,
        booking
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/**
 * @route   PUT /api/bookings/:id/cancel
 * @desc    Cancel a booking (for user)
 * @access  Private
 */
router.put('/:id/cancel', auth.ensureAuthenticated, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    // Verify ownership
    if (booking.user.toString() !== req.session.user._id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to cancel this booking' 
      });
    }
    
    // Check if booking can be cancelled
    if (booking.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot cancel a completed booking' 
      });
    }
    
    booking.status = 'cancelled';
    booking.cancelledAt = Date.now();
    
    await booking.save();
    
    res.json({ 
      success: true, 
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/bookings/:id
 * @desc    Get a specific booking
 * @access  Private
 */
router.get('/:id', auth.ensureAuthenticated, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('service', 'title serviceType price images location')
      .populate('provider', 'username avatar company email phone')
      .populate('user', 'username avatar email phone');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    // Check if user is authorized to view this booking
    const isProvider = booking.provider._id.toString() === req.session.user._id;
    const isCustomer = booking.user._id.toString() === req.session.user._id;
    
    if (!isProvider && !isCustomer && req.session.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view this booking' 
      });
    }
    
    res.json({ success: true, booking });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 