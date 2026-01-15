/**
 * Script to remove dummy bike listings that aren't associated with real users
 * Run with: node scripts/remove-dummy-listings.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Bike = require('../models/Bike');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bikers-portal')
  .then(() => console.log('MongoDB connected...'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function removeDummyListings() {
  try {
    console.log('Starting to check for dummy bike listings...');
    
    // Find all bikes
    const bikes = await Bike.find();
    console.log(`Found ${bikes.length} total bike listings`);
    
    // Track statistics
    let removedCount = 0;
    let validCount = 0;
    let invalidSellerCount = 0;
    
    // Check each bike
    for (const bike of bikes) {
      let needsRemoval = false;
      
      // Check for valid seller
      if (!bike.seller) {
        console.log(`Bike ${bike._id} has no seller reference`);
        needsRemoval = true;
        invalidSellerCount++;
      } else {
        // Verify seller exists
        const seller = await User.findById(bike.seller);
        if (!seller) {
          console.log(`Bike ${bike._id} has invalid seller: ${bike.seller}`);
          needsRemoval = true;
          invalidSellerCount++;
        }
      }
      
      // Check for empty or placeholder data 
      if (bike.title === 'Untitled Bike' || 
          bike.description === 'No description provided' ||
          (bike.images.length === 1 && bike.images[0] === '/images/placeholder-bike.jpg')) {
        console.log(`Bike ${bike._id} appears to be a placeholder listing`);
        needsRemoval = true;
      }
      
      // Remove the bike if needed
      if (needsRemoval) {
        await Bike.findByIdAndDelete(bike._id);
        removedCount++;
        console.log(`Removed bike: ${bike._id} - ${bike.title}`);
      } else {
        validCount++;
      }
    }
    
    console.log(`
Cleanup completed:
- Total bikes checked: ${bikes.length}
- Valid bikes: ${validCount}
- Removed bikes: ${removedCount}
- Invalid seller references: ${invalidSellerCount}
    `);
    
  } catch (error) {
    console.error('Error removing dummy listings:', error);
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the cleanup function
removeDummyListings(); 