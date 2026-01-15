/**
 * Script to fix image references in the database
 * Run with: node scripts/fix-image-references.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Bike = require('../models/Bike');
const fs = require('fs');
const path = require('path');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bikers-portal')
  .then(() => console.log('MongoDB connected...'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function fixImageReferences() {
  try {
    console.log('Starting to fix image references...');
    
    // Find all bikes
    const bikes = await Bike.find();
    console.log(`Found ${bikes.length} bike listings to check`);
    
    // Track statistics
    let fixedCount = 0;
    let dataUrlCount = 0;
    let placeholderCount = 0;
    
    // Check each bike
    for (const bike of bikes) {
      let needsUpdate = false;
      
      // Check if images array exists and contains data
      if (!bike.images || !Array.isArray(bike.images) || bike.images.length === 0) {
        console.log(`Bike ${bike._id} has no images, looking for data URLs in description...`);
        
        // Sometimes images are embedded in the description
        if (bike.description && bike.description.includes('data:image')) {
          // Extract data URLs from description if present
          const matches = bike.description.match(/data:image\/[^;]+;base64,[^"'\\s]+/g);
          if (matches && matches.length > 0) {
            bike.images = matches;
            console.log(`  Found ${matches.length} data URLs in description`);
            needsUpdate = true;
            dataUrlCount++;
          }
        }
      } else {
        // Filter out placeholder or invalid references
        const validImages = bike.images.filter(img => {
          return img && 
                 typeof img === 'string' && 
                 img.trim() !== '' && 
                 !img.includes('placeholder') && 
                 img !== '/images/placeholder-bike.jpg' && 
                 img !== '/images/placeholder.jpg';
        });
        
        // Check if we have valid images
        if (validImages.length !== bike.images.length) {
          if (validImages.length > 0) {
            bike.images = validImages;
            needsUpdate = true;
            console.log(`  Removed ${bike.images.length - validImages.length} invalid references`);
          } else {
            // If we have no valid images, look for data URLs in other fields
            let foundDataUrl = false;
            
            // Check description for embedded data URLs
            if (bike.description && bike.description.includes('data:image')) {
              const matches = bike.description.match(/data:image\/[^;]+;base64,[^"'\\s]+/g);
              if (matches && matches.length > 0) {
                bike.images = matches;
                console.log(`  Found ${matches.length} data URLs in description`);
                needsUpdate = true;
                dataUrlCount++;
                foundDataUrl = true;
              }
            }
            
            if (!foundDataUrl) {
              // If we still have no images, set as empty array (will use default in UI)
              bike.images = [];
              needsUpdate = true;
              placeholderCount++;
              console.log(`  No valid images found, cleared image array`);
            }
          }
        }
      }
      
      // Update bike if needed
      if (needsUpdate) {
        await bike.save();
        fixedCount++;
        console.log(`Updated bike: ${bike._id} - ${bike.title}`);
      }
    }
    
    console.log(`
Image references fix completed:
- Total bikes checked: ${bikes.length}
- Bikes updated: ${fixedCount}
- Data URLs recovered: ${dataUrlCount}
- Bikes with no valid images: ${placeholderCount}
    `);
    
  } catch (error) {
    console.error('Error fixing image references:', error);
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the fix function
fixImageReferences(); 