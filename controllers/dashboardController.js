const Bike = require('../models/Bike');
const Service = require('../models/Service');
const User = require('../models/User');

/**
 * Get user dashboard
 * @route GET /dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/login.html');
    }
    
    const userId = req.session.user._id;
    
    // Get user bikes
    let userBikes = await Bike.find({ seller: userId }).sort({ createdAt: -1 });
    
    // Process bikes to ensure proper image display
    userBikes = userBikes.map(bike => {
      const bikeObj = bike.toObject();
      
      // Process images
      if (bikeObj.images && bikeObj.images.length > 0) {
        // Keep valid images only
        bikeObj.images = bikeObj.images.filter(img => {
          return img && (
            img.startsWith('data:image/') || 
            img.startsWith('http') || 
            img.startsWith('/uploads/')
          );
        });
      }
      
      if (!bikeObj.images || bikeObj.images.length === 0) {
        bikeObj.images = ['/images/default-bike.jpg'];
      }
      
      // Ensure thumbnail is set
      if (!bikeObj.thumbnailImage || (
        !bikeObj.thumbnailImage.startsWith('data:image/') && 
        !bikeObj.thumbnailImage.startsWith('http') && 
        !bikeObj.thumbnailImage.startsWith('/uploads/')
      )) {
        bikeObj.thumbnailImage = bikeObj.images[0];
      }
      
      return bikeObj;
    });
    
    // Get user data
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).render('error', { error: 'User not found' });
    }
    
    // For service providers, get their services
    let userServices = [];
    if (user.role === 'serviceProvider' || user.role === 'admin') {
      userServices = await Service.find({ provider: userId }).sort({ createdAt: -1 });
    }
    
    // Featured bikes and services for all users
    let featuredBikes = await Bike.find({ 
      isAvailable: true,
      isFeatured: true,
      seller: { $ne: userId } // Exclude user's own bikes
    })
    .sort({ createdAt: -1 })
    .limit(4)
    .populate('seller', 'username firstName lastName');
    
    // Process featured bikes for image display
    featuredBikes = featuredBikes.map(bike => {
      const bikeObj = bike.toObject();
      
      // Process images
      if (bikeObj.images && bikeObj.images.length > 0) {
        bikeObj.images = bikeObj.images.filter(img => {
          return img && (
            img.startsWith('data:image/') || 
            img.startsWith('http') || 
            img.startsWith('/uploads/')
          );
        });
      }
      
      if (!bikeObj.images || bikeObj.images.length === 0) {
        bikeObj.images = ['/images/default-bike.jpg'];
      }
      
      // Ensure thumbnail is set
      if (!bikeObj.thumbnailImage || (
        !bikeObj.thumbnailImage.startsWith('data:image/') && 
        !bikeObj.thumbnailImage.startsWith('http') && 
        !bikeObj.thumbnailImage.startsWith('/uploads/')
      )) {
        bikeObj.thumbnailImage = bikeObj.images[0];
      }
      
      return bikeObj;
    });
    
    const featuredServices = await Service.find({ 
      isActive: true,
      isFeatured: true,
      provider: { $ne: userId } // Exclude user's own services
    })
    .sort({ 'rating.average': -1 })
    .limit(4)
    .populate('provider', 'username firstName lastName');
    
    // Render the dashboard view
    return res.render('dashboard', {
      currentUser: req.session.user,
      userBikes,
      userServices,
      featuredBikes,
      featuredServices,
      stats: {
        totalBikes: userBikes.length,
        totalServices: userServices.length,
        featuredBikes: userBikes.filter(bike => bike.isFeatured).length,
        featuredServices: userServices.filter(service => service.isFeatured).length
      }
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).render('error', { 
      error: process.env.NODE_ENV === 'production' ? 'Server Error' : error.message 
    });
  }
};

/**
 * Get user profile for dashboard
 * @route GET /dashboard/profile
 */
exports.getProfile = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }
    
    const user = await User.findById(req.session.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * Get user's bike listings for dashboard
 * @route GET /dashboard/bikes
 */
exports.getUserBikes = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/login.html');
    }
    
    let userBikes = await Bike.find({ seller: req.session.user._id })
      .sort({ createdAt: -1 });
    
    // Process bikes to ensure proper image URLs
    userBikes = userBikes.map(bike => {
      const bikeObj = bike.toObject();
      
      // Ensure images array contains valid data
      if (bikeObj.images && bikeObj.images.length > 0) {
        // Filter out invalid images
        bikeObj.images = bikeObj.images.filter(img => {
          return img && (
            img.startsWith('data:image/') || 
            img.startsWith('http') || 
            img.startsWith('/uploads/')
          );
        });
      }
      
      // Set default image if no valid images
      if (!bikeObj.images || bikeObj.images.length === 0) {
        bikeObj.images = ['/images/default-bike.jpg'];
      }
      
      // Ensure thumbnail is set
      if (!bikeObj.thumbnailImage || (
          !bikeObj.thumbnailImage.startsWith('data:image/') && 
          !bikeObj.thumbnailImage.startsWith('http') && 
          !bikeObj.thumbnailImage.startsWith('/uploads/')
      )) {
        bikeObj.thumbnailImage = bikeObj.images[0];
      }
      
      return bikeObj;
    });
    
    // Render the user's bikes page
    return res.render('my-listings', {
      currentUser: req.session.user,
      bikes: userBikes,
      pageTitle: 'My Motorcycles'
    });
  } catch (error) {
    console.error('Get user bikes error:', error);
    return res.status(500).render('error', { 
      error: process.env.NODE_ENV === 'production' ? 'Server Error' : error.message
    });
  }
};

/**
 * Get user's service listings for dashboard
 * @route GET /dashboard/services
 */
exports.getUserServices = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }
    
    // Check if user is a service provider
    const user = await User.findById(req.session.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    if (user.role !== 'serviceProvider' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access service provider data'
      });
    }
    
    const userServices = await Service.find({ provider: req.session.user._id })
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: userServices.length,
      data: userServices
    });
  } catch (error) {
    console.error('Get user services error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * Get dashboard statistics
 * @route GET /dashboard/stats
 */
exports.getDashboardStats = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }
    
    const userId = req.session.user._id;
    
    // Get user's bikes count
    const bikesCount = await Bike.countDocuments({ seller: userId });
    
    // Get user's active bikes count
    const activeBikesCount = await Bike.countDocuments({ 
      seller: userId,
      isAvailable: true 
    });
    
    // Get user's featured bikes count
    const featuredBikesCount = await Bike.countDocuments({ 
      seller: userId,
      isFeatured: true 
    });
    
    // Get total views of user's bikes
    const bikesViewsResult = await Bike.aggregate([
      { $match: { seller: userId } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);
    
    const totalBikesViews = bikesViewsResult.length > 0 ? bikesViewsResult[0].totalViews : 0;
    
    // For service providers, get service stats
    let servicesCount = 0;
    let activeServicesCount = 0;
    let featuredServicesCount = 0;
    
    const user = await User.findById(userId);
    
    if (user && (user.role === 'serviceProvider' || user.role === 'admin')) {
      servicesCount = await Service.countDocuments({ provider: userId });
      
      activeServicesCount = await Service.countDocuments({ 
        provider: userId,
        isActive: true 
      });
      
      featuredServicesCount = await Service.countDocuments({ 
        provider: userId,
        isFeatured: true 
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        bikes: {
          total: bikesCount,
          active: activeBikesCount,
          featured: featuredBikesCount,
          totalViews: totalBikesViews
        },
        services: {
          total: servicesCount,
          active: activeServicesCount,
          featured: featuredServicesCount
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * Get user's saved items for dashboard
 * @route GET /dashboard/saved
 * @access Private
 */
exports.getSavedItems = async (req, res) => {
  try {
    // Get user with favorites
    const user = await User.findById(req.session.user._id);
    
    // Get saved bikes
    let savedBikes = await Bike.find({
      _id: { $in: user.favorites?.bikes || [] }
    }).sort({ updatedAt: -1 });
    
    // Process saved bikes for proper image display
    savedBikes = savedBikes.map(bike => {
      const bikeObj = bike.toObject();
      
      // Process images
      if (bikeObj.images && bikeObj.images.length > 0) {
        // Keep valid images only
        bikeObj.images = bikeObj.images.filter(img => {
          return img && (
            img.startsWith('data:image/') || 
            img.startsWith('http') || 
            img.startsWith('/uploads/')
          );
        });
      }
      
      if (!bikeObj.images || bikeObj.images.length === 0) {
        bikeObj.images = ['/images/default-bike.jpg'];
      }
      
      // Ensure thumbnail is set
      if (!bikeObj.thumbnailImage || (
        !bikeObj.thumbnailImage.startsWith('data:image/') && 
        !bikeObj.thumbnailImage.startsWith('http') && 
        !bikeObj.thumbnailImage.startsWith('/uploads/')
      )) {
        bikeObj.thumbnailImage = bikeObj.images[0];
      }
      
      return bikeObj;
    });
    
    // Get saved services
    const savedServices = await Service.find({
      _id: { $in: user.favorites?.services || [] }
    }).sort({ updatedAt: -1 });
    
    // Format items for the frontend
    const savedItems = [
      ...savedBikes.map(bike => ({
        id: bike._id,
        title: bike.title,
        type: 'bike',
        image: bike.thumbnailImage || (bike.images && bike.images.length > 0 ? bike.images[0] : '/images/default-bike.jpg'),
        price: bike.price,
        year: bike.year,
        mileage: bike.mileage
      })),
      ...savedServices.map(service => ({
        id: service._id,
        title: service.title,
        type: 'service',
        image: service.images && service.images.length > 0 ? service.images[0] : '/images/placeholder.jpg',
        price: service.price,
        provider: service.provider.firstName + ' ' + service.provider.lastName,
        rating: service.rating.average,
        reviewCount: service.rating.count
      }))
    ];
    
    res.render('saved', {
      currentUser: req.session.user,
      savedItems,
      savedBikes: savedBikes.map(bike => ({
        id: bike._id,
        title: bike.title,
        image: bike.thumbnailImage || (bike.images && bike.images.length > 0 ? bike.images[0] : '/images/default-bike.jpg'),
        price: bike.price,
        year: bike.year,
        mileage: bike.mileage
      })),
      savedServices: savedServices.map(service => ({
        id: service._id,
        title: service.title,
        image: service.images && service.images.length > 0 ? service.images[0] : '/images/placeholder.jpg',
        price: service.price,
        provider: service.provider.firstName + ' ' + service.provider.lastName,
        rating: service.rating.average,
        reviewCount: service.rating.count
      }))
    });
  } catch (error) {
    console.error('Saved items error:', error);
    res.render('error', { 
      error: 'Failed to load your saved items. Please try again.' 
    });
  }
};

/**
 * Get account security page
 * @route GET /dashboard/security
 * @access Private
 */
exports.getSecurity = async (req, res) => {
  try {
    // Get user with sessions
    const user = await User.findById(req.session.user._id);
    
    res.render('security', {
      currentUser: req.session.user,
      sessions: user.sessions || []
    });
  } catch (error) {
    console.error('Security page error:', error);
    res.render('error', { 
      error: 'Failed to load account security page. Please try again.' 
    });
  }
}; 