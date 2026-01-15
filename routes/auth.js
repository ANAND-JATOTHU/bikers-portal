const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// @route   POST /auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authController.register);

// @route   POST /auth/login
// @desc    Login user and return token
// @access  Public
router.post('/login', authController.login);

// @route   GET /auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authController.getCurrentUser);

// @route   GET /auth/logout
// @desc    Logout user and destroy session
// @access  Private
router.get('/logout', (req, res) => {
  // Destroy session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
    }
    
    // Clear the session cookie
    res.clearCookie('connect.sid');
    
    // Redirect to home page
    res.redirect('/');
  });
});

// @route   PUT /auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authController.updateProfile);

// @route   PUT /auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authController.changePassword);

module.exports = router; 