const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const dotenv = require('dotenv');
const methodOverride = require('method-override');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/auth');
const bikeRoutes = require('./routes/bikes');
const dashboardRoutes = require('./routes/dashboard');
const motorcyclesRoutes = require('./routes/motorcycles');
const servicesRoutes = require('./routes/services');

// Import middleware
const { ensureAuthenticated } = require('./middleware/auth');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Create placeholder videos for login and register pages
const createPlaceholderVideos = () => {
  const videosDir = path.join(__dirname, 'public/videos');

  // Create videos directory if it doesn't exist
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
    console.log('Created videos directory');
  }

  // Create placeholder text files for videos to avoid 404 errors
  const videoFiles = ['motorcycle-riding.mp4', 'motorcycle-riding2.mp4'];

  videoFiles.forEach(videoFile => {
    const videoPath = path.join(videosDir, videoFile);

    if (!fs.existsSync(videoPath)) {
      fs.writeFileSync(
        videoPath,
        'This is a placeholder file. Please replace with an actual video file.'
      );
      console.log(`Created placeholder for ${videoFile}`);
    }
  });
};

// Create placeholder images
const createPlaceholderImages = () => {
  const imagesDir = path.join(__dirname, 'public/images');

  // Create images directory if it doesn't exist
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log('Created images directory');
  }

  // Create placeholder images
  const imageFiles = [
    'placeholder-bike.jpg',
    'placeholder.jpg',
    'motorcycle-bg.jpg',
    'default-profile.jpg',
    'default-cover.jpg'
  ];

  imageFiles.forEach(imageFile => {
    const imagePath = path.join(imagesDir, imageFile);

    if (!fs.existsSync(imagePath)) {
      fs.writeFileSync(
        imagePath,
        'This is a placeholder file. Please replace with an actual image file.'
      );
      console.log(`Created placeholder for ${imageFile}`);
    }
  });
};

// Create placeholder videos and images on startup
createPlaceholderVideos();
createPlaceholderImages();

// Set up session with appropriate store
const setupSessionStore = () => {
  // Use MemoryStore as default when MongoDB is not available
  // MongoStore will be used when MongoDB is connected
  console.log('Using MemoryStore for sessions (MongoDB not required for basic functionality)');
  return new session.MemoryStore();
};

// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'bikers-portal-secret-key',
  resave: false,
  saveUninitialized: false,
  store: setupSessionStore(),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

// Connect to MongoDB after setting up session
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bikers-portal');
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.log('Application will continue with limited functionality');
  }
};

// Call the function to connect to MongoDB
connectMongoDB();

// Set view engine and views directory
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.engine('ejs', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'views'));

// Global variables middleware
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.messages = {
    success: req.session.successMessage || null,
    error: req.session.errorMessage || null
  };

  // Clear flash messages after setting them in locals
  req.session.successMessage = null;
  req.session.errorMessage = null;

  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/bikes', bikeRoutes);
app.use('/motorcycles', motorcyclesRoutes);
app.use('/dashboard', ensureAuthenticated, dashboardRoutes);
app.use('/services', servicesRoutes);

// API routes for AJAX requests
app.use('/api/bikes', require('./routes/api/bikes'));
app.use('/api/account', require('./routes/api/account'));
app.use('/api/bookings', require('./routes/api/bookings'));
app.use('/api/services', require('./routes/api/services'));

// Bookings route
app.get('/dashboard/bookings', ensureAuthenticated, (req, res) => {
  res.render('bookings.html', {
    title: 'My Bookings',
    page: 'bookings',
    currentUser: req.session.user
  });
});

// Profile route
app.get('/profile/:username?', ensureAuthenticated, async (req, res) => {
  try {
    let username = req.params.username;
    let isSelf = false;

    // If no username is provided, show the current user's profile
    if (!username) {
      username = req.session.user.username;
      isSelf = true;
    } else if (username === req.session.user.username) {
      isSelf = true;
    }

    // Get the user data
    const User = require('./models/User');
    const user = await User.findOne({ username }).select('-password');

    if (!user) {
      return res.status(404).render('404.html', {
        message: 'User not found',
        currentUser: req.session.user
      });
    }

    // Get user's bikes
    const Bike = require('./models/Bike');
    const bikes = await Bike.find({ seller: user._id }).sort({ createdAt: -1 }).limit(6);

    // Get user's reviews
    const Review = require('./models/Review');
    const reviews = await Review.find({ seller: user._id })
      .populate('reviewer', 'username profileImage')
      .sort({ createdAt: -1 })
      .limit(5);

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
      : 0;

    // Get bikes count
    const totalBikes = await Bike.countDocuments({ seller: user._id });
    const soldBikes = await Bike.countDocuments({ seller: user._id, availability: 'sold' });
    const availableBikes = totalBikes - soldBikes;

    // Render the profile page - check if profile.ejs or profile.html exists
    res.render('profile.html', {
      title: `${user.firstName} ${user.lastName} - Profile`,
      page: 'profile',
      profileUser: user,
      isSelf,
      bikes,
      reviews,
      averageRating,
      stats: {
        totalBikes,
        soldBikes,
        availableBikes,
        reviewsCount: reviews.length
      },
      currentUser: req.session.user
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).render('error.html', {
      error: 'Error loading profile',
      currentUser: req.session.user
    });
  }
});

// Add the profile update route
app.post('/profile/update', ensureAuthenticated, async (req, res) => {
  try {
    const User = require('./models/User');
    const { firstName, lastName, email, phone, location, bio } = req.body;

    // Update user data
    const updatedUser = await User.findByIdAndUpdate(
      req.session.user._id,
      {
        firstName,
        lastName,
        email,
        phone,
        location,
        bio,
        // For file uploads, implement multer middleware to handle
      },
      { new: true }
    );

    // Update session data
    req.session.user = {
      ...req.session.user,
      firstName,
      lastName,
      email
    };

    return res.json({ success: true });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// Reviews route
app.post('/reviews/add', ensureAuthenticated, async (req, res) => {
  try {
    const Review = require('./models/Review');
    const { sellerId, rating, text } = req.body;

    if (!sellerId || !rating || !text) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create new review
    const newReview = new Review({
      seller: sellerId,
      reviewer: req.session.user._id,
      rating: parseInt(rating),
      text
    });

    await newReview.save();

    return res.json({ success: true });
  } catch (err) {
    console.error('Review submission error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error submitting review'
    });
  }
});

// Static HTML page routes
app.get('/login.html', (req, res) => {
  // Redirect to dashboard if already logged in
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('login.html');
});

app.get('/register.html', (req, res) => {
  // Redirect to dashboard if already logged in
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('register.html');
});

// Main routes
app.get('/', (req, res) => {
  // Redirect to dashboard if logged in
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('index.html');
});

app.get('/bikes', ensureAuthenticated, (req, res) => {
  // Redirect to bikes controller rather than rendering directly
  res.redirect('/bikes');
});

app.get('/sell', ensureAuthenticated, (req, res) => {
  res.render('sell.html', { page: 'sell', currentUser: req.session.user });
});

// Dashboard route
app.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('dashboard.html', {
    page: 'dashboard',
    currentUser: req.session.user
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error.html', {
    error: process.env.NODE_ENV === 'production' ? 'Server Error' : err.message,
    currentUser: req.session ? req.session.user : null
  });
});

// 404 route
app.use((req, res) => {
  res.status(404).render('404.html', {
    currentUser: req.session ? req.session.user : null
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 