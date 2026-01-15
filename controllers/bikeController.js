const Bike = require('../models/Bike');
const User = require('../models/User');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

/**
 * Helper function to get valid images for a bike
 * @param {Object} bike - Bike object
 * @returns {Array} - Array of valid image URLs
 */
function getValidBikeImages(bike) {
  if (!bike || !bike.images || !Array.isArray(bike.images) || bike.images.length === 0) {
    return ['/images/default-bike.jpg'];
  }
  
  // Filter out placeholder and invalid images, keeping data URLs
  const validImages = bike.images.filter(img => {
    return img && 
           typeof img === 'string' && 
           img.trim() !== '' && 
           (img.startsWith('data:image/') || 
            img.startsWith('http') || 
            img.startsWith('/uploads/') || 
            (!img.includes('placeholder') && 
             img !== '/images/placeholder-bike.jpg' && 
             img !== '/images/placeholder.jpg'));
  });
  
  // Return default image if no valid images found
  return validImages.length > 0 ? validImages : ['/images/default-bike.jpg'];
}

/**
 * Helper function to process image data URLs
 * @param {Array} imageDataUrls - Array of image data URLs
 * @returns {Array} - Processed image URLs
 */
function processImageDataUrls(imageDataUrls) {
  // If no images provided, return empty array
  if (!imageDataUrls || !Array.isArray(imageDataUrls) || imageDataUrls.length === 0) {
    return [];
  }

  // Process each image data URL
  const processedImages = imageDataUrls.map(img => {
    // Ensure we have valid data
    if (!img || !img.dataUrl) return null;
    
    // Image is already a URL, just return it
    if (img.dataUrl.startsWith('http://') || img.dataUrl.startsWith('https://')) {
      return img.dataUrl;
    }
    
    // Validate data URL format
    if (!img.dataUrl.startsWith('data:image/')) {
      console.log('Invalid image data URL format, must start with data:image/');
      return null;
    }
    
    // Store image data directly in MongoDB
    // This is a valid approach for smaller images up to 3MB
    return img.dataUrl;
  }).filter(img => img !== null);

  return processedImages;
}

/**
 * Get all bikes
 * @route GET /bikes
 */
exports.getAllBikes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = { availability: true };
    const query = {};
    
    // Text search
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
      query.search = req.query.search;
    }
    
    // Price range
    if (req.query.minPrice) {
      filter.price = { $gte: parseInt(req.query.minPrice) };
      query.minPrice = req.query.minPrice;
    }
    if (req.query.maxPrice) {
      if (filter.price) {
        filter.price.$lte = parseInt(req.query.maxPrice);
      } else {
        filter.price = { $lte: parseInt(req.query.maxPrice) };
      }
      query.maxPrice = req.query.maxPrice;
    }
    
    // Year range
    if (req.query.minYear) {
      filter.year = { $gte: parseInt(req.query.minYear) };
      query.minYear = req.query.minYear;
    }
    if (req.query.maxYear) {
      if (filter.year) {
        filter.year.$lte = parseInt(req.query.maxYear);
      } else {
        filter.year = { $lte: parseInt(req.query.maxYear) };
      }
      query.maxYear = req.query.maxYear;
    }
    
    // Brand filter
    if (req.query.brand) {
      filter.brand = req.query.brand;
      query.brand = req.query.brand;
    }
    
    // Category filter
    if (req.query.category) {
      filter.category = req.query.category;
      query.category = req.query.category;
    }
    
    // Condition filter
    if (req.query.condition) {
      filter.condition = req.query.condition;
      query.condition = req.query.condition;
    }
    
    // Fuel type filter
    if (req.query.fuelType) {
      filter.fuelType = req.query.fuelType;
      query.fuelType = req.query.fuelType;
    }
    
    // Location filter
    if (req.query.location) {
      filter.location = req.query.location;
      query.location = req.query.location;
    }
    
    // Sort options
    let sortOption = { createdAt: -1 }; // Default: newest first
    if (req.query.sortBy) {
      query.sortBy = req.query.sortBy;
      
      switch(req.query.sortBy) {
        case 'price-low':
          sortOption = { price: 1 };
          break;
        case 'price-high':
          sortOption = { price: -1 };
          break;
        case 'year-new':
          sortOption = { year: -1 };
          break;
        case 'year-old':
          sortOption = { year: 1 };
          break;
        // Default is already set (newest first)
      }
    }
    
    // Get total count for pagination
    const totalBikes = await Bike.countDocuments(filter);
    const totalPages = Math.ceil(totalBikes / limit);
    
    // Get bikes with pagination
    const bikes = await Bike.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('seller', 'username profileImage');
    
    // Process bikes to ensure valid images
    const processedBikes = bikes.map(bike => {
      const bikeObj = bike.toObject();
      
      // Ensure valid images
      bikeObj.images = getValidBikeImages(bikeObj);
      
      // Ensure thumbnailImage is set
      if (!bikeObj.thumbnailImage || (
        !bikeObj.thumbnailImage.startsWith('data:image/') && 
        !bikeObj.thumbnailImage.startsWith('http') && 
        !bikeObj.thumbnailImage.startsWith('/uploads/')
      )) {
        bikeObj.thumbnailImage = bikeObj.images[0];
      }
      
      return bikeObj;
    });
    
    // Get all available options for filter dropdowns
    const brands = await Bike.distinct('brand');
    const categories = await Bike.distinct('category');
    const conditions = await Bike.distinct('condition');
    const fuelTypes = await Bike.distinct('fuelType');
    const locations = await Bike.distinct('location');
    
    // Get min/max values for range filters
    const stats = {};
    const priceStats = await Bike.aggregate([
      { $match: { availability: true } },
      { 
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          minYear: { $min: "$year" },
          maxYear: { $max: "$year" }
        }
      }
    ]);
    
    if (priceStats.length > 0) {
      stats.minPrice = priceStats[0].minPrice;
      stats.maxPrice = priceStats[0].maxPrice;
      stats.minYear = priceStats[0].minYear;
      stats.maxYear = priceStats[0].maxYear;
    }
    
    res.render('bikes', {
      title: 'Motorcycles for Sale',
      page: 'bikes',
      bikes: processedBikes,
      totalBikes,
        currentPage: page,
      totalPages,
      query,
      brands,
      categories,
      conditions,
      fuelTypes,
      locations,
      stats,
      currentUser: req.session.user,
      messages: req.session.messages || {
        success: null,
        error: null
      },
      getPaginationUrl: (pageNum) => {
        const url = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
        url.searchParams.set('page', pageNum);
        return `${url.pathname}${url.search}`;
      }
    });
  } catch (err) {
    console.error('Error fetching bikes:', err);
    req.session.errorMessage = 'Failed to load motorcycle listings';
    res.redirect('/');
  }
};

/**
 * Get featured bikes
 * @route GET /bikes/featured
 */
exports.getFeaturedBikes = async (req, res) => {
  try {
    const featuredBikes = await Bike.find({ 
      isAvailable: true,
      isFeatured: true
    })
    .sort({ createdAt: -1 })
    .limit(6)
    .populate('seller', 'username firstName lastName phone email');
    
    return res.status(200).json({
      success: true,
      count: featuredBikes.length,
      data: featuredBikes
    });
  } catch (error) {
    console.error('Get featured bikes error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * Get single bike by ID
 * @route GET /bikes/:id
 */
exports.getBikeById = async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id)
      .populate('seller', 'firstName lastName username profileImage');
    
    if (!bike) {
      req.flash('error', 'Motorcycle not found');
      return res.redirect('/bikes');
    }
    
    // Convert to object and process images
    const bikeObj = bike.toObject();
    
    // Process images for proper display
    bikeObj.images = getValidBikeImages(bikeObj);
    
    // Ensure thumbnailImage is set
    if (!bikeObj.thumbnailImage || (
      !bikeObj.thumbnailImage.startsWith('data:image/') && 
      !bikeObj.thumbnailImage.startsWith('http') && 
      !bikeObj.thumbnailImage.startsWith('/uploads/')
    )) {
      bikeObj.thumbnailImage = bikeObj.images[0];
    }
    
    // Increment view count
    bike.views += 1;
    await bike.save();
    
    // Check if user has favorited this bike
    if (req.session.user) {
      bikeObj.isFavorite = req.session.user.favorites?.bikes?.includes(bike._id.toString()) || false;
    } else {
      bikeObj.isFavorite = false;
    }
    
    // Get seller's other bike listings
    const sellerOtherBikes = await Bike.find({
      seller: bike.seller._id,
      _id: { $ne: bike._id },
      availability: true
    })
    .limit(4)
    .sort({ createdAt: -1 });
    
    // Process other bikes' images
    const processedSellerBikes = sellerOtherBikes.map(otherBike => {
      const otherBikeObj = otherBike.toObject();
      otherBikeObj.images = getValidBikeImages(otherBikeObj);
      
      // Ensure thumbnailImage is set
      if (!otherBikeObj.thumbnailImage || (
        !otherBikeObj.thumbnailImage.startsWith('data:image/') && 
        !otherBikeObj.thumbnailImage.startsWith('http') && 
        !otherBikeObj.thumbnailImage.startsWith('/uploads/')
      )) {
        otherBikeObj.thumbnailImage = otherBikeObj.images[0];
      }
      
      return otherBikeObj;
    });
    
    // Get similar bikes (same category and brand, different seller)
    const similarBikes = await Bike.find({
      category: bike.category,
      brand: bike.brand,
      seller: { $ne: bike.seller._id },
      _id: { $ne: bike._id },
      availability: true
    })
    .limit(4)
    .sort({ createdAt: -1 })
    .populate('seller', 'username profileImage');
    
    // Process similar bikes' images
    const processedSimilarBikes = similarBikes.map(similarBike => {
      const similarBikeObj = similarBike.toObject();
      similarBikeObj.images = getValidBikeImages(similarBikeObj);
      
      // Ensure thumbnailImage is set
      if (!similarBikeObj.thumbnailImage || (
        !similarBikeObj.thumbnailImage.startsWith('data:image/') && 
        !similarBikeObj.thumbnailImage.startsWith('http') && 
        !similarBikeObj.thumbnailImage.startsWith('/uploads/')
      )) {
        similarBikeObj.thumbnailImage = similarBikeObj.images[0];
      }
      
      return similarBikeObj;
    });
    
    res.render('bike-detail', {
      title: bike.title,
      bike: bikeObj,
      sellerOtherBikes: processedSellerBikes,
      similarBikes: processedSimilarBikes,
      user: req.user
    });
  } catch (err) {
    console.error('Error fetching bike details:', err);
    req.flash('error', 'Failed to load motorcycle details');
    res.redirect('/bikes');
  }
};

/**
 * Get bikes for buyer's page with filtering and pagination
 * @route GET /bikes/buyer
 */
exports.getBikes = async (req, res) => {
    try {
        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = 9; // Number of bikes per page
        const skip = (page - 1) * limit;
        
        // Get filter parameters
        const {
            search,
            brand,
            minPrice,
            maxPrice,
            minYear,
            maxYear,
            condition,
            category,
            location,
            fuelType,
            sortBy
        } = req.query;
        
        // Build filter query
        const filter = { availability: 'available' };
        
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (brand) {
            filter.brand = brand;
        }
        
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseInt(minPrice);
            if (maxPrice) filter.price.$lte = parseInt(maxPrice);
        }
        
        if (minYear || maxYear) {
            filter.year = {};
            if (minYear) filter.year.$gte = parseInt(minYear);
            if (maxYear) filter.year.$lte = parseInt(maxYear);
        }
        
        if (condition) {
            filter.condition = condition;
        }
        
        if (category) {
            filter.category = category;
        }
        
        if (location) {
            filter.location = location;
        }
        
        if (fuelType) {
            filter.fuelType = fuelType;
        }
        
        // Determine sort order
        let sort = { createdAt: -1 }; // Default: newest first
        
        if (sortBy === 'price-low') {
            sort = { price: 1 };
        } else if (sortBy === 'price-high') {
            sort = { price: -1 };
        } else if (sortBy === 'year-new') {
            sort = { year: -1 };
        } else if (sortBy === 'year-old') {
            sort = { year: 1 };
        }
        
        // Get bikes with pagination
        const bikes = await Bike.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('seller', 'username profileImage location averageRating');
        
        // Get total count for pagination
        const totalBikes = await Bike.countDocuments(filter);
        const totalPages = Math.ceil(totalBikes / limit);
        
        // Get unique values for filter dropdowns
        const brands = await Bike.distinct('brand', { availability: 'available' });
        const categories = await Bike.distinct('category', { availability: 'available' });
        const locations = await Bike.distinct('location', { availability: 'available' });
        const fuelTypes = await Bike.distinct('fuelType', { availability: 'available' });
        const conditions = await Bike.distinct('condition', { availability: 'available' });
        
        // Get min/max price and year for range sliders
        const priceStats = await Bike.aggregate([
            { $match: { availability: 'available' } },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' },
                    minYear: { $min: '$year' },
                    maxYear: { $max: '$year' }
                }
            }
        ]);
        
        const stats = priceStats.length > 0 ? priceStats[0] : {
            minPrice: 0,
            maxPrice: 1000000,
            minYear: 2000,
            maxYear: new Date().getFullYear()
        };
        
        res.render('bikes', {
            title: 'Buy Motorcycles',
            page: 'bikes',
            bikes,
            currentPage: page,
            totalPages,
            totalBikes,
            brands,
            categories,
            locations,
            fuelTypes,
            conditions,
            stats,
            query: req.query, // Pass query params for maintaining filter state
            user: req.user
        });
    } catch (error) {
        console.error('Error in getBikes:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load motorcycles. Please try again later.'
        });
    }
};

// Get bike details
exports.getBikeDetails = async (req, res) => {
    try {
        const bikeId = req.params.id;
        
        // Check if valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(bikeId)) {
            return res.status(404).render('error', {
                title: 'Not Found',
                message: 'Motorcycle not found'
            });
        }
        
        // Find bike with seller details
        const bike = await Bike.findById(bikeId)
            .populate('seller', 'username profileImage location email phone averageRating followers');
        
        if (!bike) {
            return res.status(404).render('error', {
                title: 'Not Found',
                message: 'Motorcycle not found'
            });
        }
        
        // Check if current user is following the seller
        let isFollowingSeller = false;
        if (req.user && bike.seller) {
            isFollowingSeller = req.user.following && 
                req.user.following.some(id => id.toString() === bike.seller._id.toString());
        }
        
        // Get similar bikes (same category or brand)
        const similarBikes = await Bike.find({
            _id: { $ne: bike._id }, // Exclude current bike
            availability: 'available',
            $or: [
                { category: bike.category },
                { brand: bike.brand }
            ]
        })
        .limit(4)
        .populate('seller', 'username');
        
        res.render('bike-details', {
            title: bike.title,
            bike,
            similarBikes,
            isFollowingSeller,
            user: req.user
        });
    } catch (error) {
        console.error('Error in getBikeDetails:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load motorcycle details. Please try again later.'
        });
    }
};

// Get form to create a new bike listing
exports.getCreateBikeForm = async (req, res) => {
    try {
        // Check if user is authorized as a seller
        if (!req.user || req.user.role !== 'seller') {
            req.flash('error', 'You must be registered as a seller to list bikes');
            return res.redirect('/dashboard');
        }
        
        res.render('create-bike', {
            title: 'List Your Motorcycle',
            user: req.user,
            formData: {},
            errors: []
        });
    } catch (error) {
        console.error('Error in getCreateBikeForm:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load the form. Please try again later.'
        });
    }
};

// Create a new bike listing
exports.createBike = async (req, res) => {
  try {
    // Process image data URLs
    const images = processImageDataUrls(req.body.imageDataUrls);
    
    // Set thumbnail image from the first image if available
    const thumbnailImage = images.length > 0 ? images[0] : null;
    
    // Create new bike
    const bike = new Bike({
      ...req.body,
      seller: req.user._id,
      images,
      thumbnailImage
    });
    
    // Save bike
    await bike.save();
    
    // Update user's bike count and add to listings array
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { bikeCount: 1 },
      $push: { listings: bike._id }
    });
    
    req.flash('success', 'Your motorcycle has been listed successfully');
    res.redirect(`/bikes/${bike._id}`);
  } catch (error) {
    console.error('Error in createBike:', error);
    req.flash('error', 'Failed to create listing. Please try again later.');
    res.redirect('/sell');
  }
};

// Get form to edit a bike listing
exports.getEditBikeForm = async (req, res) => {
    try {
        const bikeId = req.params.id;
        
        // Check if valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(bikeId)) {
            req.flash('error', 'Invalid bike ID');
            return res.redirect('/dashboard');
        }
        
        // Find the bike
        const bike = await Bike.findById(bikeId);
        
        if (!bike) {
            req.flash('error', 'Bike not found');
            return res.redirect('/dashboard');
        }
        
        // Check if user is the owner
        if (!req.user || bike.seller.toString() !== req.user._id.toString()) {
            req.flash('error', 'You are not authorized to edit this listing');
            return res.redirect('/dashboard');
        }
        
        res.render('edit-bike', {
            title: 'Edit Motorcycle Listing',
            bike,
            user: req.user,
            errors: []
    });
  } catch (error) {
        console.error('Error in getEditBikeForm:', error);
        req.flash('error', 'Failed to load the edit form. Please try again later.');
        res.redirect('/dashboard');
    }
};

// Update a bike listing
exports.updateBike = async (req, res) => {
  try {
        const bikeId = req.params.id;
        
        // Check if valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(bikeId)) {
            req.flash('error', 'Invalid bike ID');
            return res.redirect('/dashboard');
        }
        
        // Find the bike
        const bike = await Bike.findById(bikeId);
        
        if (!bike) {
            req.flash('error', 'Bike not found');
            return res.redirect('/dashboard');
        }
        
        // Check if user is the owner
        if (!req.user || bike.seller.toString() !== req.user._id.toString()) {
            req.flash('error', 'You are not authorized to edit this listing');
            return res.redirect('/dashboard');
        }
        
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('edit-bike', {
                title: 'Edit Motorcycle Listing',
                bike: { ...bike.toObject(), ...req.body },
                user: req.user,
                errors: errors.array()
            });
        }
        
        // Process uploaded images
        const newImages = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                newImages.push(`/uploads/bikes/${file.filename}`);
            }
        }
        
        // Extract features from form data
        let features = [];
        if (req.body.features && req.body.features.length > 0) {
            if (Array.isArray(req.body.features)) {
                features = req.body.features;
            } else {
                features = req.body.features.split(',').map(feature => feature.trim());
            }
        }
        
        // Determine final images array
        let images = [...bike.images]; // Start with existing images
        
        // Remove images if specified
        if (req.body.removeImages && req.body.removeImages.length > 0) {
            const removeImages = Array.isArray(req.body.removeImages) 
                ? req.body.removeImages 
                : [req.body.removeImages];
                
            // Remove files from server if they're not default images
            for (const img of removeImages) {
                if (!img.includes('default-bike.jpg')) {
                    const imagePath = path.join(__dirname, '..', 'public', img);
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                }
            }
            
            // Filter out the removed images
            images = images.filter(img => !removeImages.includes(img));
        }
        
        // Add new images
        images = [...images, ...newImages];
        
        // Make sure there's at least one image
        if (images.length === 0) {
            images = ['/img/default-bike.jpg'];
        }
        
        // Update bike document
        const updatedBike = await Bike.findByIdAndUpdate(
            bikeId,
            {
                title: req.body.title,
                brand: req.body.brand,
                model: req.body.model,
                year: parseInt(req.body.year),
                price: parseInt(req.body.price),
                mileage: parseInt(req.body.mileage),
                engineCapacity: parseInt(req.body.engineCapacity),
                description: req.body.description,
                condition: req.body.condition,
                color: req.body.color,
                fuelType: req.body.fuelType,
                category: req.body.category,
                location: req.body.location,
                features: features,
                images: images,
                availability: req.body.availability || 'available',
                updatedAt: Date.now()
            },
            { new: true }
        );
        
        req.flash('success', 'Your motorcycle listing has been updated successfully');
        res.redirect(`/bikes/${updatedBike._id}`);
    } catch (error) {
        console.error('Error in updateBike:', error);
        req.flash('error', 'Failed to update listing. Please try again later.');
        res.redirect(`/bikes/${req.params.id}/edit`);
    }
};

// Delete a bike listing
exports.deleteBike = async (req, res) => {
    try {
        const bikeId = req.params.id;
        
        // Check if valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(bikeId)) {
            return res.status(400).json({
        success: false,
                message: 'Invalid bike ID'
      });
    }
    
        // Find the bike
        const bike = await Bike.findById(bikeId);
    
    if (!bike) {
      return res.status(404).json({
        success: false,
                message: 'Bike not found'
      });
    }
    
        // Check if user is the owner
        if (!req.user || bike.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
                message: 'You are not authorized to delete this listing'
            });
        }
        
        // Delete images from server if they're not default images
        for (const img of bike.images) {
            if (!img.includes('default-bike.jpg')) {
                const imagePath = path.join(__dirname, '..', 'public', img);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
        }
        
        // Delete the bike document
        await Bike.findByIdAndDelete(bikeId);
        
        // Update user's bike count
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { bikeCount: -1 }
        });
        
        return res.json({
      success: true,
            message: 'Motorcycle listing deleted successfully'
    });
  } catch (error) {
        console.error('Error in deleteBike:', error);
    return res.status(500).json({
      success: false,
            message: 'Failed to delete listing. Please try again later.'
    });
  }
};

// Mark a bike as sold
exports.markBikeAsSold = async (req, res) => {
    try {
        const bikeId = req.params.id;
        
        // Check if valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(bikeId)) {
            return res.status(400).json({
        success: false,
                message: 'Invalid bike ID'
      });
    }
    
        // Find the bike
        const bike = await Bike.findById(bikeId);
    
    if (!bike) {
      return res.status(404).json({
        success: false,
                message: 'Bike not found'
      });
    }
    
        // Check if user is the owner
        if (!req.user || bike.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
                message: 'You are not authorized to update this listing'
      });
    }
    
        // Update availability
        bike.availability = 'sold';
        bike.updatedAt = Date.now();
        await bike.save();
    
        return res.json({
      success: true,
            message: 'Motorcycle marked as sold successfully'
    });
  } catch (error) {
        console.error('Error in markBikeAsSold:', error);
    return res.status(500).json({
      success: false,
            message: 'Failed to update listing. Please try again later.'
    });
  }
};

/**
 * Get bikes by seller
 * @route GET /bikes/seller/:sellerId
 */
exports.getBikesBySeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    const bikes = await Bike.find({ seller: sellerId })
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: bikes.length,
      data: bikes
    });
  } catch (error) {
    console.error('Get bikes by seller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * Search bikes
 * @route GET /bikes/search
 */
exports.searchBikes = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const bikes = await Bike.find({
      $and: [
        { isAvailable: true },
        {
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { brand: { $regex: query, $options: 'i' } },
            { model: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('seller', 'username firstName lastName phone email');
    
    return res.status(200).json({
      success: true,
      count: bikes.length,
      data: bikes
    });
  } catch (error) {
    console.error('Search bikes error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during bike search'
    });
  }
}; 