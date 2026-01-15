/**
 * Sell page functionality
 * Handles form validation, image uploads, and form submission
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const sellForm = document.getElementById('sell-form') || document.querySelector('.sell-form');
    const imageUploadInput = document.getElementById('images');
    const imagePreviewContainer = document.getElementById('image-preview');
    const addFeatureBtn = document.getElementById('add-feature');
    const featuresList = document.getElementById('features-list');
    const detectLocationBtn = document.getElementById('detect-location');
    const categorySelect = document.getElementById('category');
    const specificFieldsContainer = document.getElementById('category-specific-fields');
    const alertContainer = document.getElementById('alert-container');
    const saveAsDraftBtn = document.getElementById('save-draft');
    const brandSelect = document.getElementById('brand');
    const submitBtn = document.querySelector('button[type="submit"]');
    const formTitle = document.querySelector('.form-title');
    
    // Set max number of images
    const MAX_IMAGES = 8;
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    
    // Initialize the page
    init();
    
    function init() {
        // Setup image upload handling
        if (imageUploadInput) {
            setupImageUpload();
        }
        
        // Setup feature list functionality
        if (addFeatureBtn && featuresList) {
            setupFeaturesList();
        }
        
        // Setup location detection
        if (detectLocationBtn) {
            setupLocationDetection();
        }
        
        // Setup category-specific fields
        if (categorySelect && specificFieldsContainer) {
            setupCategoryFields();
        }
        
        // Setup form validation and submission
        if (sellForm) {
            setupFormValidation();
        }
        
        // Setup brand "Other" option
        if (brandSelect) {
            setupBrandOther();
        }
        
        // Setup draft saving
        if (saveAsDraftBtn) {
            setupDraftSaving();
        }
        
        // Setup drag and drop for images
        setupDragAndDrop();
    }
    
    /**
     * Setup image upload and preview functionality
     */
    function setupImageUpload() {
        imageUploadInput.addEventListener('change', handleImageSelection);
        
        // Setup initial previews if there are existing images
        if (imagePreviewContainer && imagePreviewContainer.dataset.images) {
            try {
                const existingImages = JSON.parse(imagePreviewContainer.dataset.images);
                if (Array.isArray(existingImages) && existingImages.length > 0) {
                    existingImages.forEach(imagePath => {
                        addImagePreview(imagePath);
                    });
                }
            } catch (e) {
                console.error('Error parsing existing images:', e);
            }
        }
    }
    
    /**
     * Handle image file selection
     */
    function handleImageSelection(e) {
        const files = e.target.files;
        
        if (!files || files.length === 0) return;
        
        // Check if max images would be exceeded
        const currentImageCount = imagePreviewContainer.querySelectorAll('.image-preview-item').length;
        if (currentImageCount + files.length > MAX_IMAGES) {
            showAlert('error', `You can upload a maximum of ${MAX_IMAGES} images. Please select fewer images.`);
            e.target.value = '';
            return;
        }
        
        // Preview each selected image
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Validate file type
            if (!file.type.match('image.*')) {
                showAlert('error', 'Please select only image files.');
                continue;
            }
            
            // Validate file size
            if (file.size > MAX_FILE_SIZE) {
                showAlert('error', `File ${file.name} is too large. Maximum file size is 5MB.`);
                continue;
            }
            
            processImageFile(file);
        }
        
        // Clear input to allow selecting the same file again
        e.target.value = '';
    }
    
    /**
     * Process image file and add it to preview
     */
    function processImageFile(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            console.log(`Successfully processed image: ${file.name} (${formatFileSize(file.size)})`);
            addImagePreview(dataUrl, file.name);
        };
        
        reader.onerror = function() {
            console.error(`Error reading file: ${file.name}`);
            showAlert('error', `Failed to process image: ${file.name}`);
        };
        
        reader.readAsDataURL(file);
    }
    
    /**
     * Format file size to human-readable format
     */
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    }
    
    /**
     * Add image preview to container
     */
    function addImagePreview(src, fileName = '') {
        const previewItem = document.createElement('div');
        previewItem.className = 'image-preview-item';
        
        const img = document.createElement('img');
        img.src = src;
        img.alt = fileName || 'Motorcycle image';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-image';
        removeBtn.type = 'button';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.addEventListener('click', function() {
            previewItem.remove();
            updateImageCount();
        });
        
        // Set as primary image button
        const setPrimaryBtn = document.createElement('button');
        setPrimaryBtn.className = 'set-primary-image';
        setPrimaryBtn.type = 'button';
        setPrimaryBtn.innerHTML = '<i class="fas fa-star"></i>';
        setPrimaryBtn.title = 'Set as primary image';
        setPrimaryBtn.addEventListener('click', function() {
            // Remove primary class from all items
            document.querySelectorAll('.image-preview-item').forEach(item => {
                item.classList.remove('primary');
            });
            
            // Add primary class to this item
            previewItem.classList.add('primary');
            
            // Move this item to the first position
            imagePreviewContainer.prepend(previewItem);
        });
        
        previewItem.appendChild(img);
        previewItem.appendChild(removeBtn);
        previewItem.appendChild(setPrimaryBtn);
        
        // Set first image as primary by default
        if (imagePreviewContainer.querySelectorAll('.image-preview-item').length === 0) {
            previewItem.classList.add('primary');
        }
        
        imagePreviewContainer.appendChild(previewItem);
        updateImageCount();
    }
    
    /**
     * Update image count display
     */
    function updateImageCount() {
        const count = imagePreviewContainer.querySelectorAll('.image-preview-item').length;
        const countText = document.getElementById('image-count');
        
        if (countText) {
            countText.textContent = `${count}/${MAX_IMAGES}`;
        }
    }
    
    /**
     * Setup features list functionality
     */
    function setupFeaturesList() {
        addFeatureBtn.addEventListener('click', function() {
            const featureCount = featuresList.querySelectorAll('.input-group').length;
            
            if (featureCount < 10) {
                const featureGroup = document.createElement('div');
                featureGroup.className = 'input-group mb-2';
                
                const featureInput = document.createElement('input');
                featureInput.type = 'text';
                featureInput.className = 'form-control';
                featureInput.name = 'features[]';
                featureInput.placeholder = 'Enter feature';
                
                const btnContainer = document.createElement('div');
                btnContainer.className = 'input-group-append';
                
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn btn-danger';
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.addEventListener('click', function() {
                    featureGroup.remove();
                });
                
                btnContainer.appendChild(removeBtn);
                featureGroup.appendChild(featureInput);
                featureGroup.appendChild(btnContainer);
                featuresList.appendChild(featureGroup);
                
                // Focus the new input
                featureInput.focus();
            } else {
                showAlert('warning', 'You can add a maximum of 10 features.');
            }
        });
    }
    
    /**
     * Setup location detection
     */
    function setupLocationDetection() {
        detectLocationBtn.addEventListener('click', function() {
            if (navigator.geolocation) {
                detectLocationBtn.disabled = true;
                detectLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting...';
                
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        // Use reverse geocoding to get address from coordinates
                        const latitude = position.coords.latitude;
                        const longitude = position.coords.longitude;
                        
                        // You'd typically use a service like Google Maps or Mapbox for reverse geocoding
                        // This is a simplified example using a free API
                        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
                            .then(response => response.json())
                            .then(data => {
                                const address = data.address;
                                
                                // Fill location fields
                                const cityInput = document.getElementById('city');
                                const stateInput = document.getElementById('state');
                                const countryInput = document.getElementById('country');
                                const addressInput = document.getElementById('address');
                                
                                if (cityInput && address.city) cityInput.value = address.city;
                                if (cityInput && address.town) cityInput.value = address.town;
                                if (stateInput && address.state) stateInput.value = address.state;
                                if (countryInput && address.country) countryInput.value = address.country;
                                if (addressInput) {
                                    const addressParts = [];
                                    if (address.road) addressParts.push(address.road);
                                    if (address.suburb) addressParts.push(address.suburb);
                                    addressInput.value = addressParts.join(', ');
                                }
                                
                                // Store coordinates in hidden fields
                                const latInput = document.getElementById('latitude');
                                const lngInput = document.getElementById('longitude');
                                
                                if (latInput) latInput.value = latitude;
                                if (lngInput) lngInput.value = longitude;
                                
                                showAlert('success', 'Location detected successfully!');
                            })
                            .catch(error => {
                                console.error('Error getting location:', error);
                                showAlert('error', 'Failed to get location details. Please enter manually.');
                            })
                            .finally(() => {
                                detectLocationBtn.disabled = false;
                                detectLocationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Detect My Location';
                            });
                    },
                    function(error) {
                        console.error('Geolocation error:', error);
                        let errorMessage = 'Failed to detect location.';
                        
                        switch(error.code) {
                            case error.PERMISSION_DENIED:
                                errorMessage = 'Location permission denied. Please enable location access.';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMessage = 'Location information is unavailable.';
                                break;
                            case error.TIMEOUT:
                                errorMessage = 'Location request timed out.';
                                break;
                        }
                        
                        showAlert('error', errorMessage);
                        detectLocationBtn.disabled = false;
                        detectLocationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Detect My Location';
                    }
                );
            } else {
                showAlert('error', 'Geolocation is not supported by your browser.');
            }
        });
    }
    
    /**
     * Setup category-specific fields
     */
    function setupCategoryFields() {
        categorySelect.addEventListener('change', function() {
            updateCategoryFields(this.value);
        });
        
        // Initialize with current value
        if (categorySelect.value) {
            updateCategoryFields(categorySelect.value);
        }
    }
    
    /**
     * Update fields based on selected category
     */
    function updateCategoryFields(category) {
        // Clear existing fields
        specificFieldsContainer.innerHTML = '';
        
        // Add category-specific fields
        switch(category) {
            case 'Sport':
                addCategoryField('topSpeed', 'Top Speed (km/h)', 'number');
                addCategoryField('acceleration', '0-100 km/h (seconds)', 'number', 'step="0.1"');
                break;
                
            case 'Cruiser':
                addCategoryField('seatHeight', 'Seat Height (mm)', 'number');
                addCategoryField('groundClearance', 'Ground Clearance (mm)', 'number');
                break;
                
            case 'Touring':
                addCategoryField('fuelCapacity', 'Fuel Capacity (L)', 'number', 'step="0.1"');
                addCategoryField('range', 'Range (km)', 'number');
                break;
                
            case 'Off-road':
                addCategoryField('suspensionTravel', 'Suspension Travel (mm)', 'number');
                addCategoryField('groundClearance', 'Ground Clearance (mm)', 'number');
                break;
                
            case 'Electric':
                addCategoryField('batteryCapacity', 'Battery Capacity (kWh)', 'number', 'step="0.1"');
                addCategoryField('range', 'Range (km)', 'number');
                addCategoryField('chargingTime', 'Charging Time (hours)', 'number', 'step="0.5"');
                break;
        }
    }
    
    /**
     * Add a category-specific field
     */
    function addCategoryField(name, label, type = 'text', attributes = '') {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'form-group';
        
        const fieldLabel = document.createElement('label');
        fieldLabel.className = 'form-label';
        fieldLabel.setAttribute('for', name);
        fieldLabel.textContent = label;
        
        const fieldInput = document.createElement('input');
        fieldInput.type = type;
        fieldInput.className = 'form-control';
        fieldInput.id = name;
        fieldInput.name = name;
        
        // Add any additional attributes
        if (attributes) {
            const attrPairs = attributes.split(' ');
            attrPairs.forEach(pair => {
                if (pair) {
                    const [attrName, attrValue] = pair.split('=');
                    fieldInput.setAttribute(attrName, attrValue ? attrValue.replace(/"/g, '') : '');
                }
            });
        }
        
        fieldDiv.appendChild(fieldLabel);
        fieldDiv.appendChild(fieldInput);
        specificFieldsContainer.appendChild(fieldDiv);
    }
    
    /**
     * Setup form validation and submission
     */
    function setupFormValidation() {
        sellForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Check if form is valid
            if (!this.checkValidity()) {
                e.stopPropagation();
                this.classList.add('was-validated');
                
                // Scroll to first invalid field
                const firstInvalid = this.querySelector(':invalid');
                if (firstInvalid) {
                    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstInvalid.focus();
                }
                
                return;
            }
            
            // Check if there are images
            if (imagePreviewContainer && imagePreviewContainer.querySelectorAll('.image-preview-item').length === 0) {
                showAlert('error', 'Please upload at least one image of your motorcycle.');
                imageUploadInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
            
            // Disable submit button during submission
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            }
            
            // Create FormData object to handle file uploads
            const formData = new FormData(this);
            
            // Process images - collect all image data URLs
            const imageItems = document.querySelectorAll('.image-preview-item img');
            const imageDataUrls = [];
            
            if (imageItems.length > 0) {
                console.log(`Found ${imageItems.length} images to process`);
                
                imageItems.forEach((img, index) => {
                    const src = img.src;
                    
                    // Only add the image if it's a valid source and not a placeholder
                    if (src && src.trim() !== '' && 
                        !src.includes('placeholder') && 
                        !src.includes('/images/placeholder-bike.jpg') && 
                        !src.includes('/images/placeholder.jpg')) {
                        
                        const isPrimary = img.parentElement.classList.contains('primary');
                        
                        // Compress image data URL if it's too large
                        if (src.length > 1024 * 1024) { // If larger than 1MB
                            console.log(`Image ${index + 1} is large (${(src.length/1024/1024).toFixed(2)}MB), compressing...`);
                            const img = new Image();
                            img.src = src;
                            
                            // Create canvas for compression
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            
                            // Set canvas dimensions to reduce size
                            const maxWidth = 1200;
                            const maxHeight = 900;
                            let width = img.width;
                            let height = img.height;
                            
                            // Calculate new dimensions while maintaining aspect ratio
                            if (width > height) {
                                if (width > maxWidth) {
                                  height *= maxWidth / width;
                                  width = maxWidth;
                                }
                            } else {
                                if (height > maxHeight) {
                                  width *= maxHeight / height;
                                  height = maxHeight;
                                }
                            }
                            
                            canvas.width = width;
                            canvas.height = height;
                            
                            // Draw image to canvas with new dimensions
                            ctx.drawImage(img, 0, 0, width, height);
                            
                            // Get compressed data URL
                            const compressedSrc = canvas.toDataURL('image/jpeg', 0.7);
                            console.log(`Compressed image ${index + 1} from ${(src.length/1024/1024).toFixed(2)}MB to ${(compressedSrc.length/1024/1024).toFixed(2)}MB`);
                            
                            imageDataUrls.push({
                                dataUrl: compressedSrc,
                                isPrimary: isPrimary
                            });
                        } else {
                            imageDataUrls.push({
                                dataUrl: src,
                                isPrimary: isPrimary
                            });
                        }
                        
                        console.log(`Processed image ${index + 1}: ${src.substring(0, 30)}... (Valid)`);
                    } else {
                        console.log(`Skipped invalid image ${index + 1}`);
                    }
                });
                
                console.log(`Total valid images processed: ${imageDataUrls.length}/${imageItems.length}`);
                
                // Show warning if no valid images were found
                if (imageDataUrls.length === 0) {
                    showAlert('error', 'No valid images were found. Please upload at least one image of your motorcycle.');
                    
                    // Re-enable submit button
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = 'Submit Listing';
                    }
                    
                    return;
                }
            } else {
                console.log('No images found in the preview container');
                showAlert('error', 'Please upload at least one image of your motorcycle.');
                
                // Re-enable submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Submit Listing';
                }
                
                return;
            }
            
            // Add image data URLs to form data
            formData.delete('imageDataUrls'); // Ensure we don't have duplicate entries
            formData.append('imageDataUrls', JSON.stringify(imageDataUrls));
            
            // Process features
            const featureInputs = document.querySelectorAll('input[name="features[]"]');
            const features = [];
            
            featureInputs.forEach(input => {
                if (input.value.trim()) {
                    features.push(input.value.trim());
                }
            });
            
            // Replace features[] with JSON array
            formData.delete('features[]');
            formData.append('features', JSON.stringify(features));
            
            // Submit the form with AJAX
            fetch('/api/bikes', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin' // Include cookies for authentication
            })
            .then(response => {
                if (!response.ok) {
                    // Try to parse the error message from the response
                    return response.json().then(data => {
                        throw new Error(data.error || 'Server error');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    showAlert('success', 'Your motorcycle has been listed successfully!');
                    
                    // Redirect to the bike page after a brief delay
                    setTimeout(() => {
                        window.location.href = data.redirectUrl || `/bikes/${data.bike._id}`;
                    }, 1500);
                } else {
                    throw new Error(data.error || 'Failed to create listing');
                }
            })
            .catch(error => {
                console.error('Error submitting form:', error);
                showAlert('error', error.message || 'There was an error submitting your listing. Please try again.');
                
                // Re-enable submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Submit Listing';
                }
            });
        });
    }
    
    /**
     * Setup brand "Other" option
     */
    function setupBrandOther() {
        brandSelect.addEventListener('change', function() {
            const otherBrandContainer = document.getElementById('other-brand-container');
            
            if (this.value === 'Other') {
                // Create "Other" input if it doesn't exist
                if (!otherBrandContainer) {
                    const container = document.createElement('div');
                    container.id = 'other-brand-container';
                    container.className = 'form-group mt-2';
                    
                    const label = document.createElement('label');
                    label.className = 'form-label';
                    label.setAttribute('for', 'otherBrand');
                    label.textContent = 'Specify Brand';
                    
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.id = 'otherBrand';
                    input.name = 'otherBrand';
                    input.className = 'form-control';
                    input.required = true;
                    
                    container.appendChild(label);
                    container.appendChild(input);
                    
                    // Insert after brand select
                    this.parentNode.after(container);
                    
                    // Focus the new input
                    input.focus();
                }
            } else {
                // Remove "Other" input if it exists
                if (otherBrandContainer) {
                    otherBrandContainer.remove();
                }
            }
        });
    }
    
    /**
     * Setup draft saving
     */
    function setupDraftSaving() {
        saveAsDraftBtn.addEventListener('click', function() {
            // Basic validation - at least require title
            const titleInput = document.getElementById('title');
            
            if (!titleInput || !titleInput.value.trim()) {
                showAlert('error', 'Please provide a title for your listing before saving as draft.');
                if (titleInput) {
                    titleInput.focus();
                }
                return;
            }
            
            // Disable button during submission
            saveAsDraftBtn.disabled = true;
            saveAsDraftBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            // Create FormData
            const formData = new FormData(sellForm);
            formData.append('isDraft', 'true');
            
            // Submit the form
            fetch('/sell/draft', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert('success', 'Your draft has been saved successfully!');
                    
                    // Redirect to drafts page after a brief delay
                    setTimeout(() => {
                        window.location.href = data.redirectUrl || '/dashboard/drafts';
                    }, 1500);
                } else {
                    showAlert('error', data.message || 'There was an error saving your draft. Please try again.');
                    
                    // Re-enable button
                    saveAsDraftBtn.disabled = false;
                    saveAsDraftBtn.innerHTML = 'Save as Draft';
                }
            })
            .catch(error => {
                console.error('Error saving draft:', error);
                showAlert('error', 'There was an error saving your draft. Please try again.');
                
                // Re-enable button
                saveAsDraftBtn.disabled = false;
                saveAsDraftBtn.innerHTML = 'Save as Draft';
            });
        });
    }
    
    /**
     * Setup drag and drop for image uploads
     */
    function setupDragAndDrop() {
        const dropArea = document.getElementById('image-drop-area') || imagePreviewContainer;
        
        if (!dropArea) return;
        
        // Prevent default behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Highlight drop area when dragging over it
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener('dragleave', unhighlight, false);
        });
        
        function highlight() {
            dropArea.classList.add('highlight');
        }
        
        function unhighlight() {
            dropArea.classList.remove('highlight');
        }
        
        // Handle dropped files
        dropArea.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                // Check if max images would be exceeded
                const currentImageCount = imagePreviewContainer.querySelectorAll('.image-preview-item').length;
                if (currentImageCount + files.length > MAX_IMAGES) {
                    showAlert('error', `You can upload a maximum of ${MAX_IMAGES} images. Please select fewer images.`);
                    return;
                }
                
                // Process each file
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    
                    // Validate file type
                    if (!file.type.match('image.*')) {
                        showAlert('error', 'Please drop only image files.');
                        continue;
                    }
                    
                    // Validate file size
                    if (file.size > MAX_FILE_SIZE) {
                        showAlert('error', `File ${file.name} is too large. Maximum file size is 5MB.`);
                        continue;
                    }
                    
                    // Read and preview file
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        addImagePreview(e.target.result, file.name);
                    };
                    reader.readAsDataURL(file);
                }
            }
        }
    }
    
    /**
     * Show alert message
     */
    function showAlert(type, message) {
        if (!alertContainer) return;
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        `;
        
        alertContainer.appendChild(alertDiv);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => {
                alertDiv.remove();
            }, 300);
        }, 5000);
        
        // Add click handler for close button
        const closeBtn = alertDiv.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                alertDiv.classList.remove('show');
                setTimeout(() => {
                    alertDiv.remove();
                }, 300);
            });
        }
    }
}); 