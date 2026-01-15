const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Bike = require('../models/Bike');
const User = require('../models/User');
const mongoose = require('mongoose');
const { sendNotification } = require('../utils/notification');

/**
 * Create a new service booking
 * @param {Object} bookingData - The booking data object
 * @returns {Promise<Object>} - The created booking
 */
exports.createBooking = async (bookingData) => {
    // Validate service exists
    const service = await Service.findById(bookingData.serviceId);
    if (!service) {
        throw new Error('Service not found');
    }

    // Validate bike exists and belongs to user
    const bike = await Bike.findOne({
        _id: bookingData.bikeId,
        seller: bookingData.userId
    });
    if (!bike) {
        throw new Error('Bike not found or does not belong to you');
    }

    // Create new booking
    const booking = new Booking({
        service: bookingData.serviceId,
        bike: bookingData.bikeId,
        user: bookingData.userId,
        serviceProvider: service.provider,
        scheduledDate: bookingData.date,
        scheduledTime: bookingData.time,
        notes: bookingData.notes,
        status: 'pending'
    });

    await booking.save();

    // Send notification to service provider
    await sendNotification({
        recipient: service.provider,
        type: 'new_booking',
        title: 'New Service Booking',
        message: `You have a new booking request for ${service.title}`,
        data: {
            bookingId: booking._id
        }
    });

    return booking;
};

/**
 * Get a booking by ID with populated references
 * @param {String} bookingId - The booking ID
 * @returns {Promise<Object>} - The booking with populated references
 */
exports.getBookingById = async (bookingId) => {
    return await Booking.findById(bookingId)
        .populate('service', 'title description price serviceType images provider')
        .populate('bike', 'title brand model year images')
        .populate('user', 'username firstName lastName email phone')
        .populate('serviceProvider', 'username firstName lastName email phone');
};

/**
 * Get all bookings for a user
 * @param {String} userId - The user ID
 * @returns {Promise<Array>} - Array of bookings
 */
exports.getUserBookings = async (userId) => {
    return await Booking.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate('service', 'title description price serviceType images provider')
        .populate('bike', 'title brand model year images')
        .populate('serviceProvider', 'username firstName lastName email phone');
};

/**
 * Get all bookings for a service provider
 * @param {String} providerId - The service provider ID
 * @returns {Promise<Array>} - Array of bookings
 */
exports.getProviderBookings = async (providerId) => {
    return await Booking.find({ serviceProvider: providerId })
        .sort({ createdAt: -1 })
        .populate('service', 'title description price serviceType images')
        .populate('bike', 'title brand model year images')
        .populate('user', 'username firstName lastName email phone');
};

/**
 * Update a booking status
 * @param {String} bookingId - The booking ID
 * @param {String} status - The new status (pending, confirmed, completed, cancelled)
 * @param {String} notes - Additional notes from the service provider
 * @returns {Promise<Object>} - The updated booking
 */
exports.updateBookingStatus = async (bookingId, status, notes) => {
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        throw new Error('Invalid booking status');
    }

    // Update booking
    const booking = await Booking.findByIdAndUpdate(
        bookingId,
        { 
            status,
            providerNotes: notes,
            ...(status === 'confirmed' && { confirmedAt: Date.now() }),
            ...(status === 'completed' && { completedAt: Date.now() }),
            ...(status === 'cancelled' && { cancelledAt: Date.now() })
        },
        { new: true }
    )
    .populate('service', 'title')
    .populate('user', '_id');

    if (!booking) {
        throw new Error('Booking not found');
    }

    // Send notification to user
    let notificationTitle = '';
    let notificationMessage = '';

    switch (status) {
        case 'confirmed':
            notificationTitle = 'Booking Confirmed';
            notificationMessage = `Your booking for ${booking.service.title} has been confirmed.`;
            break;
        case 'completed':
            notificationTitle = 'Service Completed';
            notificationMessage = `Your service booking for ${booking.service.title} has been marked as completed.`;
            break;
        case 'cancelled':
            notificationTitle = 'Booking Cancelled';
            notificationMessage = `Your booking for ${booking.service.title} has been cancelled by the service provider.`;
            break;
    }

    if (notificationTitle) {
        await sendNotification({
            recipient: booking.user._id,
            type: `booking_${status}`,
            title: notificationTitle,
            message: notificationMessage,
            data: {
                bookingId: booking._id
            }
        });
    }

    return booking;
};

/**
 * Cancel a booking
 * @param {String} bookingId - The booking ID
 * @param {String} userId - The user ID (to determine who cancelled)
 * @returns {Promise<void>}
 */
exports.cancelBooking = async (bookingId, userId) => {
    const booking = await Booking.findById(bookingId)
        .populate('service', 'title provider')
        .populate('user', '_id');

    if (!booking) {
        throw new Error('Booking not found');
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.cancelledAt = Date.now();
    booking.cancelledBy = userId;
    await booking.save();

    // Determine recipient and message based on who cancelled
    const isServiceProvider = booking.service.provider.toString() === userId.toString();
    const recipientId = isServiceProvider ? booking.user._id : booking.service.provider;
    const messagePrefix = isServiceProvider ? 'The service provider has' : 'The customer has';

    // Send notification
    await sendNotification({
        recipient: recipientId,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `${messagePrefix} cancelled the booking for ${booking.service.title}.`,
        data: {
            bookingId: booking._id
        }
    });
};

/**
 * Check for availability of a service on a specific date
 * @param {String} serviceId - The service ID
 * @param {String} date - The date to check for availability (YYYY-MM-DD)
 * @returns {Promise<Array>} - Array of available time slots
 */
exports.getServiceAvailability = async (serviceId, date) => {
    // Get service
    const service = await Service.findById(serviceId);
    if (!service) {
        throw new Error('Service not found');
    }

    // Get service availability
    const availability = service.availability || {};
    const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayAvailability = availability[dayNames[dayOfWeek]] || {};
    
    // If day is not available
    if (!dayAvailability.available) {
        return [];
    }

    // Get all time slots for the day
    const startTime = dayAvailability.startTime || '09:00';
    const endTime = dayAvailability.endTime || '17:00';
    const slotDuration = service.slotDuration || 60; // minutes
    
    // Generate time slots
    const timeSlots = [];
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    
    let current = new Date(start);
    while (current < end) {
        const timeString = current.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        });
        
        timeSlots.push(timeString);
        current = new Date(current.getTime() + slotDuration * 60000);
    }
    
    // Get existing bookings for the day
    const existingBookings = await Booking.find({
        service: serviceId,
        scheduledDate: date,
        status: { $in: ['pending', 'confirmed'] }
    });
    
    // Filter out booked slots
    const bookedTimes = existingBookings.map(booking => booking.scheduledTime);
    const availableTimeSlots = timeSlots.filter(time => !bookedTimes.includes(time));
    
    return availableTimeSlots;
};

/**
 * Get booking statistics for a service provider
 * @param {String} providerId - The service provider ID
 * @returns {Promise<Object>} - Booking statistics
 */
exports.getProviderBookingStats = async (providerId) => {
    const stats = await Booking.aggregate([
        { $match: { serviceProvider: mongoose.Types.ObjectId(providerId) } },
        { $group: {
            _id: '$status',
            count: { $sum: 1 }
        }}
    ]);
    
    // Format stats
    const result = {
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        total: 0
    };
    
    stats.forEach(stat => {
        result[stat._id] = stat.count;
        result.total += stat.count;
    });
    
    return result;
};

/**
 * Get recent bookings for a service provider
 * @param {String} providerId - The service provider ID
 * @param {Number} limit - Maximum number of bookings to return
 * @returns {Promise<Array>} - Array of recent bookings
 */
exports.getRecentProviderBookings = async (providerId, limit = 5) => {
    return await Booking.find({ serviceProvider: providerId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('service', 'title images')
        .populate('bike', 'brand model year')
        .populate('user', 'username firstName lastName');
}; 