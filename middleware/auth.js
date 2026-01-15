/**
 * Authentication middleware
 * Checks if a user is authenticated based on session
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  
  // If it's an API request, return JSON error
  if (req.xhr || req.path.includes('/api/')) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.' 
    });
  }
  
  // For regular requests, redirect to login page
  return res.redirect('/login.html?returnTo=' + encodeURIComponent(req.originalUrl));
};

/**
 * Service Provider middleware
 * Checks if a user is authenticated and has the service provider role
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.ensureServiceProvider = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'serviceProvider') {
    return next();
  }
  
  // If it's an API request, return JSON error
  if (req.xhr || req.path.includes('/api/')) {
    return res.status(403).json({ 
      success: false, 
      message: 'Service provider access required.' 
    });
  }
  
  // For regular requests, redirect to appropriate page
  return res.status(403).render('error.html', {
    error: 'Access denied. Service provider privileges are required.',
    currentUser: req.session.user
  });
};

// Alias for backward compatibility
module.exports = {
  ensureAuthenticated: exports.ensureAuthenticated,
  ensureServiceProvider: exports.ensureServiceProvider,
  auth: exports.ensureAuthenticated
}; 