const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Booking Schema
 * Represents a service booking made by a user for their bike
 */
const bookingSchema = new Schema({
    service: {
        type: Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    provider: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bike: {
        type: Schema.Types.ObjectId,
        ref: 'Bike'
    },
    bookingDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled', 'declined'],
        default: 'pending'
    },
    price: {
        type: Number,
        required: true
    },
    notes: {
        type: String,
        trim: true
    },
    confirmedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    cancelledAt: {
        type: Date
    },
    reviewSubmitted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    scheduledDate: {
        type: String, // Format: YYYY-MM-DD
        required: [true, 'Scheduled date is required']
    },
    scheduledTime: {
        type: String, // Format: HH:MM (24-hour format)
        required: [true, 'Scheduled time is required']
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String
    },
    paymentId: {
        type: String
    },
    providerNotes: {
        type: String,
        trim: true,
        maxlength: [500, 'Provider notes cannot be more than 500 characters']
    },
    cancelledBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    feedback: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            trim: true,
            maxlength: [500, 'Feedback comment cannot be more than 500 characters']
        },
        createdAt: {
            type: Date
        }
    }
}, {
    timestamps: true
});

// Add index for common queries
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ provider: 1, createdAt: -1 });
bookingSchema.index({ service: 1, status: 1 });
bookingSchema.index({ scheduledDate: 1, status: 1 });

// Virtual for formatted date
bookingSchema.virtual('formattedDate').get(function() {
    if (!this.scheduledDate) return '';
    const date = new Date(this.scheduledDate);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

// Virtual for formatted time
bookingSchema.virtual('formattedTime').get(function() {
    if (!this.scheduledTime) return '';
    const [hours, minutes] = this.scheduledTime.split(':');
    const time = new Date();
    time.setHours(hours);
    time.setMinutes(minutes);
    return time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
});

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
    if (this.status === 'completed') return false;
    if (this.status === 'cancelled') return false;
    
    // Can't cancel if less than 24 hours before scheduled time
    const bookingDate = new Date(`${this.scheduledDate}T${this.scheduledTime}`);
    const now = new Date();
    const diffHours = (bookingDate - now) / (1000 * 60 * 60);
    
    return diffHours > 24;
};

// Method to check if booking can be rescheduled
bookingSchema.methods.canBeRescheduled = function() {
    if (this.status !== 'pending' && this.status !== 'confirmed') return false;
    
    // Can't reschedule if less than 24 hours before scheduled time
    const bookingDate = new Date(`${this.scheduledDate}T${this.scheduledTime}`);
    const now = new Date();
    const diffHours = (bookingDate - now) / (1000 * 60 * 60);
    
    return diffHours > 24;
};

// Pre-save hook to set price from service
bookingSchema.pre('save', async function(next) {
    if (!this.price && this.isNew) {
        try {
            const Service = mongoose.model('Service');
            const service = await Service.findById(this.service);
            if (service) {
                this.price = service.price;
            }
        } catch (error) {
            console.error('Error setting booking price:', error);
        }
    }
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Booking', bookingSchema); 