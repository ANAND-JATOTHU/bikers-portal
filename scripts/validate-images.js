/**
 * Script to validate all images in bike listings
 * Run with: node scripts/validate-images.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Bike = require('../models/Bike');
const fetch = require('node-fetch');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bikers-portal')
  .then(() => console.log('MongoDB connected...'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

/**
 * Checks if an image URL is accessible
 * @param {string} url - The image URL to check
 * @returns {Promise<boolean>} - Whether the image is accessible
 */
async function isImageValid(url) {
  try {
    // Skip data URLs - they're valid by definition if in the database
    if (url.startsWith('data:image/')) {
      return true;
    }
    
    // Check if URL is valid
    if (!url || url === 'undefined' || url === 'null') {
      return false;
    }
    
    // Check local paths
    if (url.startsWith('/')) {
      return true; // Assume local paths are valid
    }
    
    // For external URLs, try to fetch
    const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch (error) {
    console.log(`Error checking image: ${url.substring(0, 50)}...`);
    return false;
  }
}

async function validateImages() {
  try {
    console.log('Starting image validation...');
    
    // Find all bikes
    const bikes = await Bike.find();
    console.log(`Found ${bikes.length} bike listings to check`);
    
    let fixedCount = 0;
    let validCount = 0;
    let totalImagesChecked = 0;
    let totalValidImages = 0;
    let totalInvalidImages = 0;
    
    // Process bikes in batches to avoid overwhelming the server
    for (let i = 0; i < bikes.length; i++) {
      const bike = bikes[i];
      console.log(`Checking bike ${i+1}/${bikes.length}: ${bike.title}`);
      
      if (!bike.images || !Array.isArray(bike.images) || bike.images.length === 0) {
        // No images, add placeholder
        bike.images = ['/images/placeholder-bike.jpg'];
        await bike.save();
        fixedCount++;
        console.log(`  Fixed: No images found, added placeholder`);
        continue;
      }
      
      const validImages = [];
      let hasInvalidImage = false;
      
      // Check each image
      for (const img of bike.images) {
        totalImagesChecked++;
        
        if (await isImageValid(img)) {
          validImages.push(img);
          totalValidImages++;
        } else {
          hasInvalidImage = true;
          totalInvalidImages++;
          console.log(`  Invalid image found: ${img.substring(0, 50)}...`);
        }
      }
      
      // If all images are valid, no need to update
      if (!hasInvalidImage) {
        validCount++;
        console.log(`  All images valid (${bike.images.length})`);
        continue;
      }
      
      // If we have at least one valid image, use those
      if (validImages.length > 0) {
        bike.images = validImages;
        await bike.save();
        fixedCount++;
        console.log(`  Fixed: Removed ${bike.images.length - validImages.length} invalid images`);
      } else {
        // No valid images, use placeholder
        bike.images = ['/images/placeholder-bike.jpg'];
        await bike.save();
        fixedCount++;
        console.log(`  Fixed: No valid images, added placeholder`);
      }
    }
    
    console.log(`
Image validation completed:
- Total bikes checked: ${bikes.length}
- Bikes with all valid images: ${validCount}
- Bikes fixed: ${fixedCount}
- Total images checked: ${totalImagesChecked}
- Valid images: ${totalValidImages}
- Invalid images: ${totalInvalidImages}
    `);
    
  } catch (error) {
    console.error('Error validating images:', error);
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the validation function
validateImages(); 