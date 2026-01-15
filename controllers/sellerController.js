const User = require('../models/User');
const Bike = require('../models/Bike');
const Review = require('../models/Review');
const Message = require('../models/Message');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');

// Display list of all sellers
exports.getAllSellers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 12; // Number of sellers per page
        const skip = (page - 1) * limit;
        
        // Get filter parameters
        const { search, location, minRating } = req.query;
        
        // Build filter query
        const filter = { isSeller: true }; // Only get users who are sellers
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { bio: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (location) {
            filter.location = location;
        }
        
        // Query for sellers
        let sellersQuery = User.find(filter)
            .sort({ avgRating: -1 }) // Sort by rating
            .skip(skip)
            .limit(limit)
            .select('name profileImage location avgRating reviewCount bikeCount bio createdAt');
        
        // Apply minimum rating filter after query to not affect pagination count
        const sellers = await sellersQuery;
        
        const filteredSellers = minRating 
            ? sellers.filter(seller => seller.avgRating >= parseInt(minRating))
            : sellers;
        
        // Get total count for pagination
        const totalSellers = await User.countDocuments(filter);
        const totalPages = Math.ceil(totalSellers / limit);
        
        // Get unique locations for filter dropdown
        const locations = await User.distinct('location', { isSeller: true });
        
        res.render('sellers', {
            title: 'Motorcycle Sellers',
            sellers: filteredSellers,
            currentPage: page,
            totalPages,
            search,
            location,
            minRating,
            locations,
            user: req.user
        });
    } catch (err) {
        console.error('Error fetching sellers:', err);
        res.status(500).render('error', { 
            message: 'Error fetching sellers', 
            error: { status: 500, stack: process.env.NODE_ENV === 'development' ? err.stack : '' } 
        });
    }
};

// Get seller profile page
exports.getSellerProfile = async (req, res) => {
    try {
        const sellerId = req.params.id;
        
        // Check if valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(404).render('error', { 
                title: 'Seller Not Found',
                message: 'The seller you are looking for does not exist.' 
            });
        }
        
        // Find seller
        const seller = await User.findById(sellerId);
        
        if (!seller || seller.role !== 'seller') {
            return res.status(404).render('error', { 
                title: 'Seller Not Found',
                message: 'The seller you are looking for does not exist.' 
            });
        }
        
        // Get pagination parameters
        const currentBikePage = parseInt(req.query.bikePage) || 1;
        const currentReviewPage = parseInt(req.query.reviewPage) || 1;
        const limit = 6; // Items per page
        
        // Calculate skip values
        const bikeSkip = (currentBikePage - 1) * limit;
        const reviewSkip = (currentReviewPage - 1) * limit;
        
        // Get bikes from this seller with pagination
        const bikes = await Bike.find({ seller: sellerId })
            .sort({ createdAt: -1 })
            .skip(bikeSkip)
            .limit(limit);
            
        const totalBikes = await Bike.countDocuments({ seller: sellerId });
        const totalBikePages = Math.ceil(totalBikes / limit);
        
        // Get sold bikes count
        const totalSold = await Bike.countDocuments({ 
            seller: sellerId, 
            availability: 'sold' 
        });
        
        // Get reviews with pagination
        const reviews = await Review.find({ seller: sellerId })
            .populate('reviewer', 'username profileImage')
            .sort({ createdAt: -1 })
            .skip(reviewSkip)
            .limit(limit);
            
        const totalReviews = await Review.countDocuments({ seller: sellerId });
        const totalReviewPages = Math.ceil(totalReviews / limit);
        
        // Calculate average rating
        const aggregateResult = await Review.aggregate([
            { $match: { seller: mongoose.Types.ObjectId(sellerId) } },
            { $group: { _id: null, averageRating: { $avg: "$rating" } } }
        ]);
        
        const averageRating = aggregateResult.length > 0 
            ? aggregateResult[0].averageRating 
            : 0;
        
        // Check if current user is following this seller
        let isFollowing = false;
        if (req.user) {
            isFollowing = req.user.following && 
                req.user.following.some(id => id.toString() === sellerId);
        }
        
        // Check if current user has already reviewed this seller
        let hasReviewed = false;
        if (req.user) {
            const existingReview = await Review.findOne({
                seller: sellerId,
                reviewer: req.user._id
            });
            
            hasReviewed = !!existingReview;
        }
        
        res.render('seller-profile', {
            title: `${seller.username} - Seller Profile`,
            seller,
            bikes,
            reviews,
            totalBikePages,
            totalReviewPages,
            currentBikePage,
            currentReviewPage,
            totalSold,
            averageRating,
            isFollowing,
            hasReviewed,
            user: req.user // Pass current user
        });
        
    } catch (error) {
        console.error('Error in getSellerProfile:', error);
        res.status(500).render('error', { 
            title: 'Server Error',
            message: 'An error occurred while loading the seller profile.' 
        });
    }
};

// API: Follow/unfollow a seller
exports.toggleFollow = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'You must be logged in to follow sellers' 
            });
        }
        
        const sellerId = req.params.id;
        
        // Check if valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(404).json({ 
                success: false, 
                message: 'Seller not found' 
            });
        }
        
        // Check if seller exists
        const seller = await User.findById(sellerId);
        if (!seller || seller.role !== 'seller') {
            return res.status(404).json({ 
                success: false, 
                message: 'Seller not found' 
            });
        }
        
        // Check if trying to follow self
        if (req.user._id.toString() === sellerId) {
            return res.status(400).json({ 
                success: false, 
                message: 'You cannot follow yourself' 
            });
        }
        
        const user = await User.findById(req.user._id);
        
        // Check if already following
        const isFollowing = user.following && 
            user.following.some(id => id.toString() === sellerId);
        
        if (isFollowing) {
            // Unfollow
            await User.findByIdAndUpdate(req.user._id, {
                $pull: { following: sellerId }
            });
            
            await User.findByIdAndUpdate(sellerId, {
                $pull: { followers: req.user._id }
            });
            
            // Get updated follower count
            const updatedSeller = await User.findById(sellerId);
            const followerCount = updatedSeller.followers ? updatedSeller.followers.length : 0;
            
            return res.json({ 
                success: true, 
                isFollowing: false,
                followerCount
            });
        } else {
            // Follow
            await User.findByIdAndUpdate(req.user._id, {
                $addToSet: { following: sellerId }
            });
            
            await User.findByIdAndUpdate(sellerId, {
                $addToSet: { followers: req.user._id }
            });
            
            // Get updated follower count
            const updatedSeller = await User.findById(sellerId);
            const followerCount = updatedSeller.followers ? updatedSeller.followers.length : 0;
            
            return res.json({ 
                success: true, 
                isFollowing: true,
                followerCount
            });
        }
        
    } catch (error) {
        console.error('Error in toggleFollow:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
};

// API: Add a review for a seller
exports.addReview = async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'You must be logged in to leave a review' 
            });
        }
        
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }
        
        const sellerId = req.params.id;
        const { rating, text } = req.body;
        
        // Check if valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(404).json({ 
                success: false, 
                message: 'Seller not found' 
            });
        }
        
        // Check if seller exists
        const seller = await User.findById(sellerId);
        if (!seller || seller.role !== 'seller') {
            return res.status(404).json({ 
                success: false, 
                message: 'Seller not found' 
            });
        }
        
        // Check if trying to review self
        if (req.user._id.toString() === sellerId) {
            return res.status(400).json({ 
                success: false, 
                message: 'You cannot review yourself' 
            });
        }
        
        // Check if already reviewed
        const existingReview = await Review.findOne({
            seller: sellerId,
            reviewer: req.user._id
        });
        
        if (existingReview) {
            return res.status(400).json({ 
                success: false, 
                message: 'You have already reviewed this seller' 
            });
        }
        
        // Create new review
        const newReview = new Review({
            seller: sellerId,
            reviewer: req.user._id,
            rating: parseInt(rating),
            text
        });
        
        await newReview.save();
        
        // Update seller's average rating
        const aggregateResult = await Review.aggregate([
            { $match: { seller: mongoose.Types.ObjectId(sellerId) } },
            { $group: { _id: null, averageRating: { $avg: "$rating" } } }
        ]);
        
        const averageRating = aggregateResult.length > 0 
            ? aggregateResult[0].averageRating 
            : 0;
        
        await User.findByIdAndUpdate(sellerId, {
            $set: { averageRating }
        });
        
        res.status(201).json({ 
            success: true, 
            message: 'Review added successfully',
            review: await newReview.populate('reviewer', 'username profileImage').execPopulate()
        });
        
    } catch (error) {
        console.error('Error in addReview:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
};

// API: Get seller's bikes with pagination
exports.getSellerBikes = async (req, res) => {
    try {
        const sellerId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = 6; // Items per page
        const skip = (page - 1) * limit;
        
        // Check if valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(404).json({ 
                success: false, 
                message: 'Seller not found' 
            });
        }
        
        // Find seller's bikes
        const bikes = await Bike.find({ seller: sellerId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalBikes = await Bike.countDocuments({ seller: sellerId });
        const totalPages = Math.ceil(totalBikes / limit);
        
        res.json({
            success: true,
            bikes,
            currentPage: page,
            totalPages,
            totalBikes
        });
        
    } catch (error) {
        console.error('Error in getSellerBikes:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
};

// API: Get seller's reviews with pagination
exports.getSellerReviews = async (req, res) => {
    try {
        const sellerId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = 6; // Items per page
        const skip = (page - 1) * limit;
        
        // Check if valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(404).json({ 
                success: false, 
                message: 'Seller not found' 
            });
        }
        
        // Find reviews
        const reviews = await Review.find({ seller: sellerId })
            .populate('reviewer', 'username profileImage')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalReviews = await Review.countDocuments({ seller: sellerId });
        const totalPages = Math.ceil(totalReviews / limit);
        
        // Calculate average rating
        const aggregateResult = await Review.aggregate([
            { $match: { seller: mongoose.Types.ObjectId(sellerId) } },
            { $group: { _id: null, averageRating: { $avg: "$rating" } } }
        ]);
        
        const averageRating = aggregateResult.length > 0 
            ? aggregateResult[0].averageRating 
            : 0;
        
        res.json({
            success: true,
            reviews,
            currentPage: page,
            totalPages,
            totalReviews,
            averageRating
        });
        
    } catch (error) {
        console.error('Error in getSellerReviews:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
};

// Send a message to a seller
exports.sendMessage = async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'You must be logged in to send messages' 
            });
        }
        
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed', 
                errors: errors.array() 
            });
        }
        
        const { recipient, subject, content } = req.body;
        
        // Check if valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(recipient)) {
            return res.status(404).json({ 
                success: false, 
                message: 'Recipient not found' 
            });
        }
        
        // Check if recipient exists
        const recipientUser = await User.findById(recipient);
        if (!recipientUser) {
            return res.status(404).json({ 
                success: false, 
                message: 'Recipient not found' 
            });
        }
        
        // Create new message
        const newMessage = new Message({
            sender: req.user._id,
            recipient,
            subject,
            content,
            isRead: false
        });
        
        await newMessage.save();
        
        res.status(201).json({ 
            success: true, 
            message: 'Message sent successfully',
            messageId: newMessage._id
        });
        
    } catch (error) {
        console.error('Error in sendMessage:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
};

// Contact seller
exports.contactSeller = async (req, res) => {
  try {
    const sellerId = req.params.id;
    
    // Validate user is logged in
    if (!req.user) {
      req.flash('error', 'You must be logged in to contact a seller');
      return res.redirect(`/sellers/${sellerId}`);
    }
    
    // Find seller
    const seller = await User.findOne({ _id: sellerId, isSeller: true });
    
    if (!seller) {
      req.flash('error', 'Seller not found');
      return res.redirect('/sellers');
    }
    
    // In a real app, we would send an email or notification to the seller
    // For demo purposes, we'll just show a success message
    
    req.flash('success', `Message sent to ${seller.firstName}. They will contact you soon.`);
    res.redirect(`/sellers/${sellerId}`);
  } catch (error) {
    console.error('Error contacting seller:', error);
    req.flash('error', 'Failed to send message. Please try again later.');
    res.redirect(`/sellers/${req.params.id}`);
  }
};

// Submit a review for a seller
exports.submitReview = [
  // Validate input
  check('rating', 'Rating is required').isInt({ min: 1, max: 5 }),
  check('comment', 'Comment must be between 10 and 500 characters').isLength({ min: 10, max: 500 }),
  
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg);
        return res.redirect(`/sellers/${req.params.id}`);
      }
      
      const { rating, comment } = req.body;
      const sellerId = req.params.id;
      
      // Validate user is logged in
      if (!req.user) {
        req.flash('error', 'You must be logged in to leave a review');
        return res.redirect(`/sellers/${sellerId}`);
      }
      
      // Find seller
      const seller = await User.findOne({ _id: sellerId, isSeller: true });
      
      if (!seller) {
        req.flash('error', 'Seller not found');
        return res.redirect('/sellers');
      }
      
      // Check if user has already left a review
      if (seller.reviews && seller.reviews.some(review => review.user.toString() === req.user._id.toString())) {
        req.flash('error', 'You have already reviewed this seller');
        return res.redirect(`/sellers/${sellerId}`);
      }
      
      // Add review
      const newReview = {
        user: req.user._id,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        rating: parseInt(rating),
        comment,
        date: new Date()
      };
      
      if (!seller.reviews) {
        seller.reviews = [];
      }
      
      seller.reviews.push(newReview);
      
      // Update average rating
      seller.rating = seller.reviews.reduce((sum, review) => sum + review.rating, 0) / seller.reviews.length;
      
      await seller.save();
      
      req.flash('success', 'Review submitted successfully');
      res.redirect(`/sellers/${sellerId}`);
    } catch (error) {
      console.error('Error submitting review:', error);
      req.flash('error', 'Failed to submit review. Please try again later.');
      res.redirect(`/sellers/${req.params.id}`);
    }
  }
]; 