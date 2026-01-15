const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../../models/User');

// Middleware to check authentication
const ensureAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  return res.status(401).json({
    success: false,
    error: 'Not authenticated'
  });
};

// @route   GET /api/account/test
// @desc    Test route to check authentication status
// @access  Public
router.get('/test', (req, res) => {
  if (req.session.user) {
    return res.json({
      success: true,
      message: 'User is authenticated',
      user: {
        id: req.session.user._id,
        username: req.session.user.username,
        role: req.session.user.role
      }
    });
  } else {
    return res.json({
      success: false,
      message: 'User is not authenticated'
    });
  }
});

// @route   POST /api/account/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', ensureAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }
    
    // Get user from database
    const user = await User.findById(req.session.user._id);
    
    // Check if current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/account/enable-2fa
// @desc    Enable two-factor authentication
// @access  Private
router.post('/enable-2fa', ensureAuthenticated, async (req, res) => {
  try {
    // In a real app, this would generate a QR code for the user to scan
    // For this example, we'll just simulate the process
    
    // Get user
    const user = await User.findById(req.session.user._id);
    
    // Generate a fake secret
    const secret = Math.random().toString(36).substring(2, 15);
    
    // Update user with 2FA secret
    user.twoFactorAuth = {
      enabled: false,
      secret: secret,
      pending: true
    };
    
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: '2FA setup initiated',
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/BikersPortal:${user.email}?secret=${secret}&issuer=BikersPortal`
    });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/account/session/:id/logout
// @desc    Logout from a specific session
// @access  Private
router.post('/session/:id/logout', ensureAuthenticated, async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // Get user
    const user = await User.findById(req.session.user._id);
    
    // Find and remove the session
    if (user.sessions) {
      user.sessions = user.sessions.filter(session => session.id !== sessionId);
      await user.save();
    }
    
    return res.status(200).json({
      success: true,
      message: 'Session logged out successfully'
    });
  } catch (error) {
    console.error('Session logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/account/logout-all
// @desc    Logout from all devices
// @access  Private
router.post('/logout-all', ensureAuthenticated, async (req, res) => {
  try {
    // Get user
    const user = await User.findById(req.session.user._id);
    
    // Clear all sessions
    user.sessions = [];
    await user.save();
    
    // Destroy current session
    req.session.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Logged out from all devices'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/account/delete
// @desc    Delete user account
// @access  Private
router.delete('/delete', ensureAuthenticated, async (req, res) => {
  try {
    // Delete user's bikes
    await require('../../models/Bike').deleteMany({ seller: req.session.user._id });
    
    // Delete user's services if they are a service provider
    if (req.session.user.isServiceProvider) {
      await require('../../models/Service').deleteMany({ provider: req.session.user._id });
    }
    
    // Delete user
    await User.findByIdAndDelete(req.session.user._id);
    
    // Destroy session
    req.session.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router; 