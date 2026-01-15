const express = require('express');
const router = express.Router();
const Bike = require('../../models/Bike');
const User = require('../../models/User');
const mongoose = require('mongoose');
const { ensureAuthenticated } = require('../../middleware/auth');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Update image upload configuration to limit file size to 3MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   GET /api/bikes
// @desc    Get bikes with filters and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || 'newest';
    
    // Build query from filters
    const query = { status: 'Active' };
    
    // Category filter
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Brand filter
    if (req.query.brand) {
      query.brand = req.query.brand;
    }
    
    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseInt(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseInt(req.query.maxPrice);
    }
    
    // Condition filter
    if (req.query.condition) {
      query.condition = req.query.condition;
    }
    
    // Year range filter
    if (req.query.minYear || req.query.maxYear) {
      query.year = {};
      if (req.query.minYear) query.year.$gte = parseInt(req.query.minYear);
      if (req.query.maxYear) query.year.$lte = parseInt(req.query.maxYear);
    }
    
    // Engine size filter
    if (req.query.engineSize) {
      const [min, max] = req.query.engineSize.split('-');
      query.engineCapacity = {};
      
      if (min && max) {
        query.engineCapacity.$gte = parseInt(min);
        query.engineCapacity.$lte = parseInt(max);
      } else if (min === '0' && max) {
        query.engineCapacity.$lte = parseInt(max);
      } else if (min && !max) {
        query.engineCapacity.$gte = parseInt(min);
      }
    }
    
    // Location filter
    if (req.query.location) {
      query.$or = [
        { 'location.city': { $regex: req.query.location, $options: 'i' } },
        { 'location.state': { $regex: req.query.location, $options: 'i' } },
        { 'location.country': { $regex: req.query.location, $options: 'i' } }
      ];
    }
    
    // Determine sort order
    let sortOptions = {};
    switch (sort) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'price_low':
        sortOptions = { price: 1 };
        break;
      case 'price_high':
        sortOptions = { price: -1 };
        break;
      case 'year_new':
        sortOptions = { year: -1 };
        break;
      case 'year_old':
        sortOptions = { year: 1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }
    
    // Execute query with pagination
    const bikes = await Bike.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('seller', 'firstName lastName username');
    
    // Get total count for pagination
    const total = await Bike.countDocuments(query);
    
    // Check if user has favorited these bikes
    const bikesWithFavorites = bikes.map(bike => {
      const bikeObj = bike.toObject();
      
      // Add isFavorite property
      if (req.session.user) {
        bikeObj.isFavorite = req.session.user.favorites?.bikes?.includes(bike._id.toString()) || false;
      } else {
        bikeObj.isFavorite = false;
      }
      
      return bikeObj;
    });
    
    return res.json({
      success: true,
      bikes: bikesWithFavorites,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching bikes:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching bikes'
    });
  }
});

// @route   GET /api/bikes/featured
// @desc    Get featured bikes for homepage
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const featuredBikes = await Bike.find({ 
      status: 'Active',
      isFeatured: true 
    })
    .sort({ createdAt: -1 })
    .limit(6)
    .populate('seller', 'firstName lastName username');
    
    return res.json({
      success: true,
      bikes: featuredBikes
    });
  } catch (error) {
    console.error('Error fetching featured bikes:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching featured bikes'
    });
  }
});

// @route   GET /api/bikes/:id
// @desc    Get a single bike by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id)
      .populate('seller', 'firstName lastName username profileImage');
    
    if (!bike) {
      return res.status(404).json({
        success: false,
        error: 'Bike not found'
      });
    }
    
    // Increment view count
    bike.views += 1;
    await bike.save();
    
    // Check if user has favorited this bike
    const bikeObj = bike.toObject();
    if (req.session.user) {
      bikeObj.isFavorite = req.session.user.favorites?.bikes?.includes(bike._id.toString()) || false;
    } else {
      bikeObj.isFavorite = false;
    }
    
    return res.json({
      success: true,
      bike: bikeObj
    });
  } catch (error) {
    console.error('Error fetching bike:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching bike'
    });
  }
});

// Helper function to get valid images for a bike
function getValidBikeImages(bike) {
  if (!bike || !bike.images || !Array.isArray(bike.images) || bike.images.length === 0) {
    return [];
  }
  
  // Filter out placeholder and invalid images
  return bike.images.filter(img => {
    return img && 
           typeof img === 'string' && 
           img.trim() !== '' && 
           !img.includes('placeholder') && 
           img !== '/images/placeholder-bike.jpg' && 
           img !== '/images/placeholder.jpg';
  });
}

// @route   GET /api/bikes/:id/quickview
// @desc    Get quick view data for a bike
// @access  Public
router.get('/:id/quickview', async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id)
      .populate('seller', 'username firstName lastName');
    
    if (!bike) {
      return res.status(404).json({
        success: false,
        error: 'Bike not found'
      });
    }
    
    // Convert to object and ensure valid images
    const bikeData = bike.toObject();
    bikeData.images = getValidBikeImages(bikeData);
    
    return res.json(bikeData);
  } catch (error) {
    console.error('Error fetching bike for quick view:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching bike data'
    });
  }
});

// @route   POST /api/bikes
// @desc    Create a new bike listing
// @access  Private
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    // Validate request body
    if (!req.body) {
      return res.status(400).json({ success: false, error: 'Request body is missing' });
    }

    // Extract image data and validate sizes
    const imageDataUrls = req.body.imageDataUrls || [];
    if (imageDataUrls.length > 0) {
      // Check if any image exceeds size limit (3MB)
      const oversizedImages = imageDataUrls.filter(img => {
        // Rough estimate: base64 string length * 0.75 gives approximate byte size
        const base64Data = img.dataUrl.split(',')[1] || '';
        return (base64Data.length * 0.75) > 3 * 1024 * 1024;
      });

      if (oversizedImages.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: `${oversizedImages.length} image(s) exceed the maximum size limit of 3MB. Please resize and try again.`
        });
      }
    }
    
    // Check if user is authenticated now handled by middleware
    
    // Log request body for debugging
    console.log('Request body:', Object.keys(req.body));
    
    const {
      title,
      brand,
      model,
      year,
      category,
      price,
      condition,
      mileage,
      engineCapacity,
      description,
      features,
      location
    } = req.body;
    
    // Create data object with all required fields
    const bikeData = {
      title: title || 'Untitled Bike',
      brand: brand || 'Other',
      model: model || 'Unknown Model',
      year: parseInt(year) || new Date().getFullYear(),
      category: category || 'Other',
      price: parseInt(price) || 0,
      condition: condition || 'Good',
      mileage: parseInt(mileage) || 0,
      engineCapacity: parseInt(engineCapacity) || 0,
      description: description || 'No description provided',
      location: location || 'Unknown location',
      seller: req.session.user._id,
      status: 'Active',
      isNew: true,
      createdAt: new Date()
    };
    
    // Ensure required fields are present and valid
    if (!bikeData.year || isNaN(bikeData.year)) {
      bikeData.year = new Date().getFullYear();
    }
    
    if (!bikeData.price || isNaN(bikeData.price)) {
      bikeData.price = 0;
    }
    
    if (!bikeData.mileage || isNaN(bikeData.mileage)) {
      bikeData.mileage = 0;
    }
    
    if (!bikeData.engineCapacity || isNaN(bikeData.engineCapacity)) {
      bikeData.engineCapacity = 0;
    }
    
    console.log('Bike data prepared:', bikeData);
    
    // Process image data URLs
    let images = [];
    let thumbnailImage = null;
    if (req.body.imageDataUrls) {
      try {
        // Handle both string and array formats
        const imageDataUrls = typeof req.body.imageDataUrls === 'string' 
          ? JSON.parse(req.body.imageDataUrls) 
          : req.body.imageDataUrls;
        
        console.log('Image data URLs received:', 
          Array.isArray(imageDataUrls) ? `${imageDataUrls.length} images` : 'Invalid format');
        
        // Process each image data URL
        if (Array.isArray(imageDataUrls) && imageDataUrls.length > 0) {
          // Find primary image or use the first one
          const primaryImageData = imageDataUrls.find(img => img.isPrimary) || imageDataUrls[0];
          
          // Set thumbnail image directly from the data URL
          if (primaryImageData && primaryImageData.dataUrl) {
            thumbnailImage = primaryImageData.dataUrl;
            console.log('Primary image set as thumbnail');
          } else {
            console.log('No primary image found, using first image');
          }
          
          // Store all image data URLs directly
          images = imageDataUrls.map((imageData, index) => {
            // Handle both object and string formats
            const dataUrl = typeof imageData === 'object' ? imageData.dataUrl : imageData;
            
            // Skip invalid data URLs
            if (!dataUrl || typeof dataUrl !== 'string') {
              console.log(`Skipping invalid image data at index ${index}`);
              return null;
            }
            
            // Basic validation for data URLs
            if (dataUrl.startsWith('data:image/') || dataUrl.startsWith('http')) {
              return dataUrl;
            } else {
              console.log(`Skipping invalid image format at index ${index}`);
              return null;
            }
          }).filter(Boolean); // Remove any null entries
          
          console.log(`Processed ${images.length} image data URLs for storage in MongoDB`);
        } else {
          console.log('No valid image data URLs found in the request');
        }
      } catch (err) {
        console.error('Error processing image data URLs:', err);
      }
    } else if (req.body.images) {
      try {
        // Handle both string and array formats
        images = typeof req.body.images === 'string' 
          ? JSON.parse(req.body.images) 
          : req.body.images;
        
        if (Array.isArray(images) && images.length > 0) {
          // Set thumbnail from the first image
          thumbnailImage = images[0];
          console.log(`Processed ${images.length} images from images field`);
        } else {
          console.log('No valid images found in images field');
        }
      } catch (err) {
        console.error('Error parsing images:', err);
      }
    }
    
    // If no images were provided, we can't proceed without a thumbnail
    if (!images || images.length === 0 || !thumbnailImage) {
      console.error('Image validation failed: No valid images or thumbnail found');
      return res.status(400).json({
        success: false,
        error: 'At least one image is required for your bike listing'
      });
    }
    
    // Process features
    let parsedFeatures = [];
    if (req.body.features) {
      try {
        parsedFeatures = JSON.parse(req.body.features);
      } catch (err) {
        console.error('Error parsing features:', err);
      }
    }
    
    // Add features to bike data
    bikeData.features = parsedFeatures;
    
    // Add images to bike data
    bikeData.images = images;
    
    // Add thumbnail to bike data
    bikeData.thumbnailImage = thumbnailImage;
    
    console.log('Image data added to bike:', {
      imagesCount: bikeData.images.length,
      hasThumbnail: !!bikeData.thumbnailImage,
      firstImagePreview: typeof bikeData.images[0] === 'string' ? bikeData.images[0].substring(0, 30) + '...' : 'No preview available'
    });
    
    // Create new bike listing
    const newBike = new Bike(bikeData);
    
    try {
      // Verify the user exists before saving
      const user = await User.findById(req.session.user._id);
      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user. Please log in again.'
        });
      }
      
      // Log user information for debugging
      console.log('User found:', {
        id: user._id,
        username: user.username,
        role: user.role
      });
      
      await newBike.save();
      console.log('Bike saved successfully with ID:', newBike._id);
      
      // Add the bike to the user's listings
      await User.findByIdAndUpdate(
        req.session.user._id,
        { $push: { listings: newBike._id } }
      );
      
      return res.status(201).json({
        success: true,
        message: 'Bike listing created successfully',
        bike: newBike
      });
    } catch (validationError) {
      console.error('Validation error:', validationError);
      const errorMessages = [];
      
      if (validationError.errors) {
        Object.keys(validationError.errors).forEach(field => {
          errorMessages.push(`${field}: ${validationError.errors[field].message}`);
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed: ' + errorMessages.join(', ')
      });
    }
  } catch (error) {
    console.error('Error creating bike listing:', error);
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: validationErrors.join(', ')
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Server error while creating bike listing'
    });
  }
});

// @route   PUT /api/bikes/:id
// @desc    Update a bike listing
// @access  Private (Owner only)
router.put('/:id', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }
    
    // Get the bike listing
    const bike = await Bike.findById(req.params.id);
    
    if (!bike) {
      return res.status(404).json({
        success: false,
        error: 'Bike not found'
      });
    }
    
    // Check if user is the owner
    if (bike.seller.toString() !== req.session.user._id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this listing'
      });
    }
    
    // Update bike listing
    const updatedBike = await Bike.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    return res.json({
      success: true,
      message: 'Bike listing updated successfully',
      bike: updatedBike
    });
  } catch (error) {
    console.error('Error updating bike listing:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error while updating bike listing'
    });
  }
});

// @route   DELETE /api/bikes/:id
// @desc    Delete a bike listing
// @access  Private (Owner only)
router.delete('/:id', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }
    
    // Get the bike listing
    const bike = await Bike.findById(req.params.id);
    
    if (!bike) {
      return res.status(404).json({
        success: false,
        error: 'Bike not found'
      });
    }
    
    // Check if user is the owner or admin
    if (bike.seller.toString() !== req.session.user._id && req.session.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this listing'
      });
    }
    
    // Delete bike listing
    await Bike.findByIdAndDelete(req.params.id);
    
    return res.json({
      success: true,
      message: 'Bike listing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bike listing:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error while deleting bike listing'
    });
  }
});

// @route   POST /api/bikes/:id/favorite
// @desc    Add/Remove a bike from favorites
// @access  Private
router.post('/:id/favorite', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }
    
    const bikeId = req.params.id;
    
    // Get user
    const user = await User.findById(req.session.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Initialize favorites if it doesn't exist
    if (!user.favorites) {
      user.favorites = {
        bikes: [],
        services: []
      };
    }
    
    if (!user.favorites.bikes) {
      user.favorites.bikes = [];
    }
    
    // Check if bike is already in favorites
    const bikeIndex = user.favorites.bikes.indexOf(bikeId);
    let action;
    
    if (bikeIndex === -1) {
      // Add to favorites
      user.favorites.bikes.push(bikeId);
      action = 'added';
    } else {
      // Remove from favorites
      user.favorites.bikes.splice(bikeIndex, 1);
      action = 'removed';
    }
    
    // Save user
    await user.save();
    
    // Update session
    req.session.user = user.toObject();
    
    return res.json({
      success: true,
      message: `Bike ${action === 'added' ? 'added to' : 'removed from'} favorites`,
      action
    });
  } catch (error) {
    console.error('Error updating favorites:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error while updating favorites'
    });
  }
});

module.exports = router; 