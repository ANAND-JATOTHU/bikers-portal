const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Service title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    enum: ['Maintenance', 'Repair', 'Customization', 'Inspection', 'Detailing', 'Other']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  estimatedTime: {
    value: {
      type: Number,
      required: [true, 'Estimated time value is required'],
      min: [0, 'Estimated time cannot be negative']
    },
    unit: {
      type: String,
      required: [true, 'Estimated time unit is required'],
      enum: ['Hours', 'Days', 'Weeks']
    }
  },
  specializations: [String],
  bikeTypes: [{
    type: String,
    enum: ['Sport', 'Cruiser', 'Touring', 'Off-road', 'Scooter', 'Electric', 'Vintage', 'All']
  }],
  images: [{
    type: String
  }],
  location: {
    address: String,
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Service provider information is required']
  },
  availability: {
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    hours: {
      open: String,
      close: String
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  contactPhone: {
    type: String,
    required: [true, 'Contact phone is required']
  },
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required'],
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the 'updatedAt' field on save
serviceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create a text index for searching services
serviceSchema.index({
  title: 'text',
  description: 'text',
  specializations: 'text'
});

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service; 