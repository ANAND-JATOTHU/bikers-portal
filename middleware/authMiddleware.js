// Check if user is authenticated
exports.isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    
    if (req.xhr || req.headers.accept.indexOf('json') !== -1) {
        return res.status(401).json({
            success: false,
            message: 'Please log in to access this feature'
        });
    }
    
    // Store the original URL in the session
    req.session.returnTo = req.originalUrl;
    req.flash('error', 'Please log in to access this feature');
    res.redirect('/login');
};

// Check if user has seller role
exports.isSellerRole = (req, res, next) => {
    if (req.user && req.user.role === 'seller') {
        return next();
    }
    
    if (req.xhr || req.headers.accept.indexOf('json') !== -1) {
        return res.status(403).json({
            success: false,
            message: 'You must be registered as a seller to access this feature'
        });
    }
    
    req.flash('error', 'You must be registered as a seller to access this feature');
    res.redirect('/dashboard');
};

// Check if user has admin role
exports.isAdminRole = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    
    if (req.xhr || req.headers.accept.indexOf('json') !== -1) {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    
    req.flash('error', 'Admin access required');
    res.redirect('/dashboard');
};

// Check if user is the owner of the resource
exports.isResourceOwner = (model) => {
    return async (req, res, next) => {
        try {
            const resource = await model.findById(req.params.id);
            
            if (!resource) {
                if (req.xhr || req.headers.accept.indexOf('json') !== -1) {
                    return res.status(404).json({
                        success: false,
                        message: 'Resource not found'
                    });
                }
                
                req.flash('error', 'Resource not found');
                return res.redirect('/dashboard');
            }
            
            // Check if the user is the owner
            const ownerId = resource.seller || resource.user || resource.owner;
            
            if (req.user && ownerId && ownerId.toString() === req.user._id.toString()) {
                req.resource = resource; // Attach resource to request object
                return next();
            }
            
            if (req.xhr || req.headers.accept.indexOf('json') !== -1) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to perform this action'
                });
            }
            
            req.flash('error', 'You are not authorized to perform this action');
            res.redirect('/dashboard');
        } catch (error) {
            if (req.xhr || req.headers.accept.indexOf('json') !== -1) {
                return res.status(500).json({
                    success: false,
                    message: 'Server error. Please try again.'
                });
            }
            
            req.flash('error', 'Server error. Please try again.');
            res.redirect('/dashboard');
        }
    };
}; 