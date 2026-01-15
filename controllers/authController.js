const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Register a new user
 * @route POST /auth/register
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone, address } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User with this email or username already exists' 
      });
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      address: {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zipCode || '',
        country: address.country || ''
      }
    });
    
    // Save user to database
    await user.save();
    
    // Set session with user info (without password)
    const userObj = user.toObject();
    delete userObj.password;
    req.session.user = userObj;
    
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userObj
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during registration'
    });
  }
};

/**
 * Login a user
 * @route POST /auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Verify password
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Set session with user info (without password)
    const userObj = user.toObject();
    delete userObj.password;
    req.session.user = userObj;
    
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userObj
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
};

/**
 * Get current user
 * @route GET /auth/me
 */
exports.getCurrentUser = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }
    
    // Refresh user data (in case it has been updated)
    const user = await User.findById(req.session.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * Logout a user
 * @route GET /auth/logout
 */
exports.logout = (req, res) => {
  try {
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: 'Error during logout'
        });
      }
      
      // Clear the session cookie
      res.clearCookie('connect.sid');
      
      return res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during logout'
    });
  }
};

/**
 * Update user profile
 * @route PUT /auth/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }
    
    const { firstName, lastName, phone, address } = req.body;
    
    // Find and update user
    const user = await User.findByIdAndUpdate(
      req.session.user._id,
      {
        firstName,
        lastName,
        phone,
        address,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Update session
    req.session.user = user.toObject();
    
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during profile update'
    });
  }
};

/**
 * Change password
 * @route PUT /auth/change-password
 */
exports.changePassword = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const user = await User.findById(req.session.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during password change'
    });
  }
}; 