const Service = require('../models/Service');
const User = require('../models/User');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

/**
 * Get all services with optional filtering
 * @param {Object} query - Query parameters for filtering
 * @returns {Promise<Object>} - Paginated services with metadata
 */
exports.getAllServices = async (query) => {
  try {
    const {
      serviceType,
      minPrice,
      maxPrice,
      rating,
      city,
      state,
      search,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10
    } = query;

    // Build filter object
    const filter = { isActive: true };

    if (serviceType) {
      filter.serviceType = serviceType;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (rating) {
      filter['rating.average'] = { $gte: Number(rating) };
    }

    if (city) {
      filter['location.city'] = { $regex: city, $options: 'i' };
    }

    if (state) {
      filter['location.state'] = { $regex: state, $options: 'i' };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { specializations: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    // Get services with pagination
    const services = await Service.find(filter)
      .populate('provider', 'username firstName lastName company profileImage')
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));

    // Get total count of services matching filter
    const total = await Service.countDocuments(filter);

    return {
      success: true,
      data: services,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit)
      }
    };
  } catch (error) {
    console.error('Error in getAllServices:', error);
    throw error;
  }
};

/**
 * Get featured services
 * @returns {Promise<Array>} - Array of featured services
 */
exports.getFeaturedServices = async () => {
  try {
    return await Service.find({ isActive: true, isFeatured: true })
      .populate('provider', 'username firstName lastName company profileImage')
      .sort({ 'rating.average': -1 })
      .limit(6);
  } catch (error) {
    console.error('Error in getFeaturedServices:', error);
    throw error;
  }
};

/**
 * Get a service by ID
 * @param {String} id - Service ID
 * @returns {Promise<Object>} - Service details
 */
exports.getServiceById = async (id) => {
  try {
    const service = await Service.findById(id)
      .populate('provider', 'username firstName lastName company profileImage bio contactInfo');
    
    if (!service) {
      return null;
    }
    
    // Increment views
    service.views += 1;
    await service.save();
    
    return service;
  } catch (error) {
    console.error('Error in getServiceById:', error);
    throw error;
  }
};

/**
 * Create a new service
 * @param {Object} serviceData - Service data
 * @param {Array} files - Uploaded files
 * @returns {Promise<Object>} - Created service
 */
exports.createService = async (serviceData, files) => {
  try {
    // Handle image uploads
    const images = [];
    if (files && files.length > 0) {
      files.forEach(file => {
        images.push(file.path.replace('public', ''));
      });
    }
    
    // Create new service
    const newService = new Service({
      ...serviceData,
      images: images.length > 0 ? images : ['/images/default-service.jpg']
    });
    
    await newService.save();
    return newService;
  } catch (error) {
    console.error('Error in createService:', error);
    throw error;
  }
};

/**
 * Update a service
 * @param {String} id - Service ID
 * @param {Object} updateData - Data to update
 * @param {Array} files - New uploaded files
 * @returns {Promise<Object>} - Updated service
 */
exports.updateService = async (id, updateData, files) => {
  try {
    const service = await Service.findById(id);
    
    if (!service) {
      throw new Error('Service not found');
    }
    
    // Handle image uploads
    if (files && files.length > 0) {
      // Remove old images if they are being replaced
      if (updateData.removeImages === 'true' && service.images && service.images.length > 0) {
        service.images.forEach(img => {
          if (img !== '/images/default-service.jpg') {
            const imagePath = path.join(__dirname, '../public', img);
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          }
        });
        
        // Add new images
        const newImages = [];
        files.forEach(file => {
          newImages.push(file.path.replace('public', ''));
        });
        
        service.images = newImages;
      } else {
        // Append new images
        files.forEach(file => {
          service.images.push(file.path.replace('public', ''));
        });
      }
    }
    
    // Update service fields
    Object.keys(updateData).forEach(key => {
      if (key !== 'removeImages' && key !== 'provider') {
        if (key === 'location' && typeof updateData[key] === 'object') {
          Object.keys(updateData[key]).forEach(locKey => {
            service.location[locKey] = updateData[key][locKey];
          });
        } else if (key === 'availability' && Array.isArray(updateData[key])) {
          service.availability = updateData[key];
        } else {
          service[key] = updateData[key];
        }
      }
    });
    
    service.updatedAt = Date.now();
    await service.save();
    
    return service;
  } catch (error) {
    console.error('Error in updateService:', error);
    throw error;
  }
};

/**
 * Delete a service
 * @param {String} id - Service ID
 * @returns {Promise<void>}
 */
exports.deleteService = async (id) => {
  try {
    const service = await Service.findById(id);
    
    if (!service) {
      throw new Error('Service not found');
    }
    
    // Delete associated images
    if (service.images && service.images.length > 0) {
      service.images.forEach(img => {
        if (img !== '/images/default-service.jpg') {
          const imagePath = path.join(__dirname, '../public', img);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
      });
    }
    
    await Service.findByIdAndDelete(id);
  } catch (error) {
    console.error('Error in deleteService:', error);
    throw error;
  }
};

/**
 * Get similar services
 * @param {String} serviceId - Current service ID
 * @param {String} serviceType - Type of service
 * @param {String} city - City location
 * @returns {Promise<Array>} - Array of similar services
 */
exports.getSimilarServices = async (serviceId, serviceType, city) => {
  try {
    return await Service.find({
      _id: { $ne: serviceId },
      serviceType,
      'location.city': city,
      isActive: true
    })
      .populate('provider', 'username firstName lastName company profileImage')
      .sort({ 'rating.average': -1 })
      .limit(4);
  } catch (error) {
    console.error('Error in getSimilarServices:', error);
    throw error;
  }
}; 