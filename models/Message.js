const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100
    },
    content: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 2000
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isDeletedBySender: {
        type: Boolean,
        default: false
    },
    isDeletedByRecipient: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create an index for faster queries
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ createdAt: -1 });

// Prevent returning deleted messages in queries
messageSchema.pre('find', function() {
    const query = this.getQuery();
    const userField = query.sender ? 'isDeletedBySender' : 'isDeletedByRecipient';
    
    if (!query[userField]) {
        this.where({ [userField]: false });
    }
});

// This will populate the sender and recipient fields with selected user data
messageSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'sender',
        select: 'username profileImage'
    }).populate({
        path: 'recipient',
        select: 'username profileImage'
    });
    
    next();
});

// Create a virtual for the time since message was sent
messageSchema.virtual('timeSince').get(function() {
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
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 