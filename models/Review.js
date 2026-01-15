const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    seller: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewer: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        validate: {
            validator: Number.isInteger,
            message: 'Rating must be a whole number between 1 and 5'
        }
    },
    text: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 1000
    },
    isHelpful: {
        type: Number,
        default: 0
    },
    isNotHelpful: {
        type: Number,
        default: 0
    },
    helpfulVoters: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    notHelpfulVoters: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Create compound index to ensure a user can review a seller only once
reviewSchema.index({ seller: 1, reviewer: 1 }, { unique: true });

// Index for sorting by date
reviewSchema.index({ createdAt: -1 });

// Add a pre-save hook to update the updatedAt field
reviewSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

// Create a virtual for the time since review was posted
reviewSchema.virtual('timeSince').get(function() {
    const now = new Date();
    const diff = now - this.createdAt;
    
    // Convert milliseconds to appropriate time unit
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
        return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    const days = Math.floor(hours / 24);
    if (days < 7) {
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    
    const weeks = Math.floor(days / 7);
    if (weeks < 4) {
        return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    }
    
    const months = Math.floor(days / 30);
    if (months < 12) {
        return `${months} month${months !== 1 ? 's' : ''} ago`;
    }
    
    const years = Math.floor(days / 365);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
});

// Make sure virtuals are included when converting to JSON
reviewSchema.set('toJSON', { virtuals: true });
reviewSchema.set('toObject', { virtuals: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 