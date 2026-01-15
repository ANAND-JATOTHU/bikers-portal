/**
 * Role-based authorization middleware
 * Checks if a user has one of the allowed roles
 * @param {Array} allowedRoles - Array of roles that are allowed to access the route
 */

module.exports = (allowedRoles) => {
  return (req, res, next) => {
    // If no user or no role, deny access
    if (!req.session.user || !req.session.user.role) {
      // If API request, return JSON error
      if (req.xhr || req.path.includes('/api/')) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. You do not have the required role.' 
        });
      }
      
      // For regular requests, render error page
      return res.status(403).render('error.html', {
        error: 'Access denied. You do not have the required role.',
        currentUser: req.session.user
      });
    }
    
    // Check if user role is in allowed roles
    if (allowedRoles.includes(req.session.user.role)) {
      return next();
    }
    
    // If API request, return JSON error
    if (req.xhr || req.path.includes('/api/')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You do not have the required role.' 
      });
    }
    
    // For regular requests, render error page
    return res.status(403).render('error.html', {
      error: 'Access denied. You do not have the required role.',
      currentUser: req.session.user
    });
  };
}; 