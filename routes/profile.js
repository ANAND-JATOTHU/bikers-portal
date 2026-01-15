const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Bike = require('../models/Bike');
const Review = require('../models/Review');

// @route   GET /profile
// @desc    Get current user's profile page
// @access  Private
router.get('/', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/login.html');
    }
    
    const userId = req.session.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).render('error', {
        message: 'User not found',
        error: { status: 404 }
      });
    }
    
    // Get user's bikes
    const bikes = await Bike.find({ seller: userId }).sort({ createdAt: -1 });
    
    // Get reviews for the user
    const reviews = await Review.find({ seller: userId })
      .populate('reviewer', 'username profileImage')
      .sort({ createdAt: -1 });
    
    // Calculate average rating
    const averageRating = reviews.length 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;
    
    // Calculate stats
    const stats = {
      totalBikes: bikes.length,
      soldBikes: bikes.filter(bike => bike.availability === 'sold').length,
      availableBikes: bikes.filter(bike => bike.availability === 'available').length,
      reviewsCount: reviews.length
    };
    
    res.render('profile', {
      title: 'My Profile',
      currentUser: user,
      profileUser: user,
      isSelf: true,
      bikes,
      reviews,
      averageRating,
      stats,
      page: 'profile'
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).render('error', {
      message: 'Error loading profile',
      error: { status: 500 }
    });
  }
});

// @route   GET /profile/:id
// @desc    Get public profile page for a user
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const profileUser = await User.findById(id);
    
    if (!profileUser) {
      return res.status(404).render('error', {
        message: 'User not found',
        error: { status: 404 }
      });
    }
    
    // Get user's bikes
    const bikes = await Bike.find({ 
      seller: id,
      availability: 'available' // Only show available bikes for public profiles
    }).sort({ createdAt: -1 });
    
    // Get reviews for the user
    const reviews = await Review.find({ seller: id })
      .populate('reviewer', 'username profileImage')
      .sort({ createdAt: -1 });
    
    // Calculate average rating
    const averageRating = reviews.length 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;
    
    // Calculate stats
    const stats = {
      totalBikes: bikes.length,
      soldBikes: 0, // Don't show sold bikes count for public profiles
      availableBikes: bikes.length,
      reviewsCount: reviews.length
    };
    
    // Check if current user is following this user
    let isFollowing = false;
    if (req.session.user) {
      const currentUser = await User.findById(req.session.user._id);
      isFollowing = currentUser.following && currentUser.following.includes(id);
    }
    
    res.render('profile', {
      title: `${profileUser.firstName} ${profileUser.lastName} - Profile`,
      currentUser: req.session.user || null,
      profileUser,
      isSelf: req.session.user && req.session.user._id.toString() === id,
      bikes,
      reviews,
      averageRating,
      stats,
      isFollowing,
      page: 'profile'
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).render('error', {
      message: 'Error loading profile',
      error: { status: 500 }
    });
  }
});

// @route   POST /profile/image
// @desc    Upload profile image
// @access  Private
router.post('/image', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }
    
    // Handle file upload logic here
    // This would typically involve multer or another file upload middleware
    // For simplicity, we'll just update with a dummy image path
    
    const user = await User.findByIdAndUpdate(
      req.session.user._id,
      { profileImage: `/images/user-${Date.now()}.jpg` },
      { new: true }
    );
    
    return res.status(200).json({
      success: true,
      profileImage: user.profileImage
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /profile/cover
// @desc    Upload cover image
// @access  Private
router.post('/cover', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }
    
    // Handle file upload logic here
    // This would typically involve multer or another file upload middleware
    // For simplicity, we'll just update with a dummy image path
    
    const user = await User.findByIdAndUpdate(
      req.session.user._id,
      { coverImage: `/images/cover-${Date.now()}.jpg` },
      { new: true }
    );
    
    return res.status(200).json({
      success: true,
      coverImage: user.coverImage
    });
  } catch (error) {
    console.error('Error uploading cover image:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router; 