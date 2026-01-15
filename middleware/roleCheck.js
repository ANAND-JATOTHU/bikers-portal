/**
 * Role specific authorization middleware
 * 
 * Contains middleware functions to check for specific roles
 */

/**
 * Middleware to check if a user is a service provider
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.isServiceProvider = (req, res, next) => {
  // First ensure the user is authenticated
  if (!req.session || !req.session.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  
  // Then check if they have the service provider role
  if (req.session.user.role === 'serviceProvider' || req.session.user.role === 'admin') {
    return next();
  }
  
  return res.status(403).json({ 
    success: false, 
    message: 'Service provider access required' 
  });
};

/**
 * Middleware to check if a user is an admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.isAdmin = (req, res, next) => {
  // First ensure the user is authenticated
  if (!req.session || !req.session.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  
  // Then check if they have the admin role
  if (req.session.user.role === 'admin') {
    return next();
  }
  
  return res.status(403).json({ 
    success: false, 
    message: 'Admin access required' 
  });
};

/**
 * Middleware to check if a user is the resource owner
 * This can be used as a generic owner check
 * @param {Function} getOwnerIdFromRequest - Function to extract owner ID from request
 * @returns {Function} Middleware function
 */
exports.isResourceOwner = (getOwnerIdFromRequest) => {
  return async (req, res, next) => {
    try {
      // First ensure the user is authenticated
      if (!req.session || !req.session.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }
      
      const ownerId = await getOwnerIdFromRequest(req);
      
      // If owner ID is null, resource doesn't exist
      if (ownerId === null) {
        return res.status(404).json({ 
          success: false, 
          message: 'Resource not found' 
        });
      }
      
      // Check if the current user is the owner
      if (ownerId.toString() === req.session.user._id.toString()) {
        return next();
      }
      
      // Allow admin access as well
      if (req.session.user.role === 'admin') {
        return next();
      }
      
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to access this resource' 
      });
    } catch (err) {
      console.error('Error checking resource ownership:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error checking authorization' 
      });
    }
  };
}; 