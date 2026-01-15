const mongoose = require('mongoose');

const bikeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Bike title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Model is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [1900, 'Year must be after 1900'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  mileage: {
    type: Number,
    required: [true, 'Mileage is required'],
    min: [0, 'Mileage cannot be negative']
  },
  engineCapacity: {
    type: Number,
    required: [true, 'Engine capacity is required'],
    min: [0, 'Engine capacity cannot be negative']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  condition: {
    type: String,
    required: [true, 'Condition is required'],
    enum: ['New', 'Like New', 'Excellent', 'Good', 'Fair', 'Poor']
  },
  color: {
    type: String,
    trim: true,
    default: 'Unspecified'
  },
  fuelType: {
    type: String,
    enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Other'],
    default: 'Petrol'
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Sport', 'Cruiser', 'Touring', 'Off-road', 'Scooter', 'Electric', 'Vintage', 'Other']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  features: [String],
  images: [String],
  thumbnailImage: {
    type: String,
    required: [false, 'Thumbnail image is required for bike card']
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller information is required']
  },
  status: {
    type: String,
    enum: ['Active', 'Sold', 'Draft', 'Inactive'],
    default: 'Active'
  },
  isNew: {
    type: Boolean,
    default: true
  },
  isHotDeal: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  views: {
    type: Number,
    default: 0
  }
});

// Before saving, ensure thumbnailImage is set
bikeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // If thumbnailImage is not set but there are images, set the first image as thumbnail
  if (!this.thumbnailImage && this.images && this.images.length > 0) {
    this.thumbnailImage = this.images[0];
  }
  
  next();
});

// Create a text index for searching bikes
bikeSchema.index({
  title: 'text',
  brand: 'text',
  model: 'text',
  description: 'text'
});

const Bike = mongoose.model('Bike', bikeSchema);

module.exports = Bike; 