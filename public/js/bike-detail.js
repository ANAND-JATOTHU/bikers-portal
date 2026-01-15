document.addEventListener('DOMContentLoaded', function() {
    // Image Gallery Functionality
    setupImageGallery();
    
    // Mark as sold/available functionality
    setupAvailabilityToggle();

    // Contact seller form validation
    setupContactForm();

    // Delete bike confirmation
    setupDeleteConfirmation();
});

/**
 * Sets up image gallery with thumbnail switching
 */
function setupImageGallery() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    const mainImage = document.querySelector('.main-image');
    
    if (!thumbnails.length || !mainImage) return;
    
    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            // Update active class
            thumbnails.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Change main image src
            mainImage.src = this.getAttribute('data-src') || this.src;
        });
    });
}

/**
 * Sets up the availability toggle (Mark as Sold/Available)
 */
function setupAvailabilityToggle() {
    const availabilityToggle = document.getElementById('availabilityToggle');
    
    if (!availabilityToggle) return;
    
    availabilityToggle.addEventListener('click', function(e) {
        e.preventDefault();
        
        const bikeId = this.getAttribute('data-bike-id');
        const currentStatus = this.getAttribute('data-current-status');
        const newStatus = currentStatus === 'available' ? 'sold' : 'available';
        
        if (!bikeId) {
            console.error('Bike ID is missing');
            return;
        }
        
        // Show confirmation
        if (confirm(`Are you sure you want to mark this bike as ${newStatus}?`)) {
            // Send AJAX request to update availability
            fetch(`/bikes/${bikeId}/availability`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ availability: newStatus })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Update UI based on new status
                if (data.success) {
                    // Update button text and data attribute
                    this.textContent = newStatus === 'available' ? 'Mark as Sold' : 'Mark as Available';
                    this.setAttribute('data-current-status', newStatus);
                    
                    // Update availability badge
                    const availabilityBadge = document.querySelector('.availability-badge');
                    if (availabilityBadge) {
                        availabilityBadge.textContent = newStatus === 'available' ? 'Available' : 'Sold';
                        availabilityBadge.className = 'badge ' + 
                            (newStatus === 'available' ? 'bg-success' : 'bg-danger') + 
                            ' availability-badge';
                    }
                    
                    // Show success message
                    showAlert('success', `Bike marked as ${newStatus} successfully!`);
                } else {
                    showAlert('danger', data.message || 'Failed to update availability');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('danger', 'An error occurred while updating availability');
            });
        }
    });
}

/**
 * Sets up contact seller form validation and submission
 */
function setupContactForm() {
    const contactForm = document.getElementById('contactSellerForm');
    
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Basic validation
        const messageInput = document.getElementById('message');
        const emailInput = document.getElementById('email');
        
        if (!messageInput.value.trim()) {
            showFormError(messageInput, 'Please enter a message');
            return;
        }
        
        if (emailInput && !validateEmail(emailInput.value)) {
            showFormError(emailInput, 'Please enter a valid email address');
            return;
        }
        
        // Get form data
        const formData = new FormData(this);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });
        
        // Disable submit button while processing
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';
        
        // Send message via AJAX
        fetch('/messages/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Handle success
            if (data.success) {
                // Clear form
                contactForm.reset();
                
                // Show success message
                showAlert('success', 'Your message has been sent to the seller!');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('contactSellerModal'));
                if (modal) {
                    modal.hide();
                }
            } else {
                showAlert('danger', data.message || 'Failed to send message');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('danger', 'An error occurred while sending your message');
        })
        .finally(() => {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
        });
    });
}

/**
 * Sets up delete bike confirmation
 */
function setupDeleteConfirmation() {
    const deleteButton = document.getElementById('deleteBikeBtn');
    
    if (!deleteButton) return;
    
    deleteButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        const bikeId = this.getAttribute('data-bike-id');
        
        if (!bikeId) {
            console.error('Bike ID is missing');
            return;
        }
        
        if (confirm('Are you sure you want to delete this bike listing? This action cannot be undone.')) {
            // Submit delete form
            document.getElementById('deleteBikeForm').submit();
        }
    });
}

/**
 * Display form validation error
 */
function showFormError(inputElement, message) {
    // Remove any existing feedback
    const oldFeedback = inputElement.parentNode.querySelector('.invalid-feedback');
    if (oldFeedback) {
        oldFeedback.remove();
    }
    
    // Add invalid class
    inputElement.classList.add('is-invalid');
    
    // Create error message element
    const feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    feedback.textContent = message;
    
    // Add to DOM
    inputElement.parentNode.appendChild(feedback);
    
    // Focus input
    inputElement.focus();
}

/**
 * Display alert message
 */
function showAlert(type, message) {
    // Create alert container if it doesn't exist
    let alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alertContainer';
        alertContainer.style.position = 'fixed';
        alertContainer.style.top = '20px';
        alertContainer.style.right = '20px';
        alertContainer.style.zIndex = '9999';
        document.body.appendChild(alertContainer);
    }
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to container
    alertContainer.appendChild(alert);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (alert.parentNode === alertContainer) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 5000);
}

/**
 * Validate email format
 */
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
} 