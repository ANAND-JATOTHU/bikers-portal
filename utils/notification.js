const mongoose = require('mongoose');

/**
 * Send a notification to a user
 * This is a placeholder function that could be extended with:
 * - In-app notifications
 * - Email notifications
 * - Push notifications (if mobile app is available)
 * - SMS notifications
 * 
 * @param {Object} notificationData - Notification data
 * @param {String} notificationData.recipient - User ID to send notification to
 * @param {String} notificationData.type - Type of notification (e.g. 'new_booking', 'booking_confirmed')
 * @param {String} notificationData.title - Notification title
 * @param {String} notificationData.message - Notification message content
 * @param {Object} notificationData.data - Additional data for the notification
 * @returns {Promise<Object>} - The created notification
 */
exports.sendNotification = async (notificationData) => {
    try {
        // Get the User model
        const User = mongoose.model('User');
        
        // Check if recipient exists
        const recipient = await User.findById(notificationData.recipient);
        if (!recipient) {
            console.error(`Notification recipient not found: ${notificationData.recipient}`);
            return null;
        }
        
        // If there's a Notification model in the database, save the notification
        try {
            const Notification = mongoose.model('Notification');
            
            const notification = new Notification({
                recipient: notificationData.recipient,
                type: notificationData.type,
                title: notificationData.title,
                message: notificationData.message,
                data: notificationData.data,
                isRead: false
            });
            
            await notification.save();
            
            // If websockets are implemented, could emit an event here
            // io.to(recipient._id).emit('new_notification', notification);
            
            return notification;
        } catch (modelError) {
            // Notification model might not exist yet, just log the notification
            console.log('Notification would be sent:', {
                recipient: recipient.username,
                title: notificationData.title,
                message: notificationData.message
            });
        }
        
        // Send email notification if user has email notifications enabled
        if (recipient.preferences && recipient.preferences.emailNotifications) {
            await sendEmailNotification(
                recipient.email,
                notificationData.title,
                notificationData.message
            );
        }
        
        return {
            success: true,
            message: 'Notification sent'
        };
    } catch (error) {
        console.error('Error sending notification:', error);
        return null;
    }
};

/**
 * Send an email notification
 * This is a placeholder that would be implemented with a real email provider
 * 
 * @param {String} email - Recipient email address
 * @param {String} subject - Email subject
 * @param {String} message - Email message
 * @returns {Promise<void>}
 */
async function sendEmailNotification(email, subject, message) {
    // This would be implemented with an email service like Nodemailer, SendGrid, etc.
    console.log('Email would be sent:', {
        to: email,
        subject,
        message
    });
    
    // Example implementation with Nodemailer:
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({
    //     from: 'bikers-portal@example.com',
    //     to: email,
    //     subject,
    //     text: message,
    //     html: `<p>${message}</p>`
    // });
} 