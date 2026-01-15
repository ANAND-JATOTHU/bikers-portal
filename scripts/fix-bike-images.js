/**
 * Script to check and fix bike images in the database
 * Run with: node scripts/fix-bike-images.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Bike = require('../models/Bike');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bikers-portal')
  .then(() => console.log('MongoDB connected...'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function fixBikeImages() {
  try {
    console.log('Checking bike listings for image issues...');
    
    // Find all bikes
    const bikes = await Bike.find();
    console.log(`Found ${bikes.length} bike listings to check`);
    
    let fixedCount = 0;
    let validCount = 0;
    
    // Check each bike
    for (const bike of bikes) {
      let needsUpdate = false;
      
      // Check if images array exists and is valid
      if (!bike.images || !Array.isArray(bike.images)) {
        bike.images = ['/images/placeholder-bike.jpg'];
        needsUpdate = true;
      } else if (bike.images.length === 0) {
        // Empty images array
        bike.images = ['/images/placeholder-bike.jpg'];
        needsUpdate = true;
      } else {
        // Check each image in the array
        const validImages = [];
        let hasValidImage = false;
        
        for (const img of bike.images) {
          if (typeof img === 'string' && img.trim() !== '') {
            validImages.push(img);
            hasValidImage = true;
          }
        }
        
        if (!hasValidImage) {
          // No valid images found
          bike.images = ['/images/placeholder-bike.jpg'];
          needsUpdate = true;
        } else if (validImages.length !== bike.images.length) {
          // Some invalid images were filtered out
          bike.images = validImages;
          needsUpdate = true;
        }
      }
      
      // Update the bike if needed
      if (needsUpdate) {
        await bike.save();
        fixedCount++;
        console.log(`Fixed bike: ${bike._id} - ${bike.title}`);
      } else {
        validCount++;
      }
    }
    
    console.log(`
Image check completed:
- Total bikes checked: ${bikes.length}
- Bikes with valid images: ${validCount}
- Bikes fixed: ${fixedCount}
    `);
    
  } catch (error) {
    console.error('Error fixing bike images:', error);
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the fix function
fixBikeImages(); 