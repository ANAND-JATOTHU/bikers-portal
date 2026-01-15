/**
 * Profile page JavaScript for Bikers Portal
 */

document.addEventListener('DOMContentLoaded', () => {
    // Tab Navigation
    initTabNavigation();
    
    // Profile Image and Cover Upload
    initImageUploads();
    
    // Profile Forms
    initProfileForm();
    initPasswordForm();
    
    // Review Forms
    initReviewForm();
    
    // Motorcycle filter
    initMotorcycleFilter();
    
    // Follow Button
    initFollowButton();
    
    // Load More buttons
    initLoadMoreButtons();
});

/**
 * Initialize the profile page functionality
 */
function initProfilePage() {
    // Tab navigation
    initTabNavigation();
    
    // Follow/Unfollow functionality
    initFollowButton();
    
    // Message button
    initMessageButton();
    
    // Review form
    initReviewForm();
    
    // Settings form (if on settings tab)
    initSettingsForm();
    
    // Image preview for uploads
    initImagePreview();
    
    // Initialize "More" dropdown
    initMoreDropdown();
}

/**
 * Initialize tab navigation
 */
function initTabNavigation() {
    const navItems = document.querySelectorAll('.profile-nav-item');
    const tabContents = document.querySelectorAll('.profile-tab-content');
    const tabLinks = document.querySelectorAll('.tab-link');
    
    // Nav items click
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');
            
            // Update active nav item
            navItems.forEach(navItem => navItem.classList.remove('active'));
            item.classList.add('active');
            
            // Show selected tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // Tab links click (View All links)
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            
            // Find and click the corresponding nav item
            navItems.forEach(item => {
                if (item.getAttribute('data-tab') === tabId) {
                    item.click();
                }
            });
        });
    });
}

/**
 * Initialize image uploads
 */
function initImageUploads() {
    const profileImageUpload = document.getElementById('profileImageUpload');
    const coverImageUpload = document.getElementById('coverImageUpload');
    const profileImage = document.getElementById('profileImage');
    
    // Profile image upload
    if (profileImageUpload) {
        profileImageUpload.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                
                // Check file size and type
                if (file.size > 5 * 1024 * 1024) {
                    showAlert('error', 'Image size should not exceed 5MB.');
                    return;
                }
                
                if (!file.type.match('image.*')) {
                    showAlert('error', 'Please upload only image files.');
                    return;
                }
                
                // Preview image
                const reader = new FileReader();
                reader.onload = (e) => {
                    profileImage.src = e.target.result;
                };
                reader.readAsDataURL(file);
                
                // Create FormData and upload
                const formData = new FormData();
                formData.append('profileImage', file);
                
                try {
                    const response = await fetch('/auth/profile/image', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        showAlert('success', 'Profile image updated successfully');
                    } else {
                        showAlert('error', data.error || 'Failed to update profile image');
                    }
                } catch (error) {
                    console.error('Error uploading profile image:', error);
                    showAlert('error', 'An error occurred while uploading profile image');
                }
            }
        });
    }
    
    // Cover image upload
    if (coverImageUpload) {
        coverImageUpload.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                
                // Check file size and type
                if (file.size > 10 * 1024 * 1024) {
                    showAlert('error', 'Cover image size should not exceed 10MB.');
                    return;
                }
                
                if (!file.type.match('image.*')) {
                    showAlert('error', 'Please upload only image files.');
                    return;
                }
                
                // Preview image
                const coverImage = document.querySelector('.profile-cover img');
                if (coverImage) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        coverImage.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
                
                // Create FormData and upload
                const formData = new FormData();
                formData.append('coverImage', file);
                
                try {
                    const response = await fetch('/auth/profile/cover', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        showAlert('success', 'Cover image updated successfully');
                    } else {
                        showAlert('error', data.error || 'Failed to update cover image');
                    }
                } catch (error) {
                    console.error('Error uploading cover image:', error);
                    showAlert('error', 'An error occurred while uploading cover image');
                }
            }
        });
    }
}

/**
 * Initialize profile form
 */
function initProfileForm() {
    const profileForm = document.getElementById('profile-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const editProfileBtn = document.getElementById('editProfileBtn');
    
    // Edit profile button (mobile view)
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            // Find and click the settings tab
            const settingsTab = document.querySelector('.profile-nav-item[data-tab="settings"]');
            if (settingsTab) {
                settingsTab.click();
            }
        });
    }
    
    // Form submission
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(profileForm);
            const userData = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                phone: formData.get('phone'),
                location: formData.get('location'),
                bio: formData.get('bio'),
                socialLinks: {
                    facebook: formData.get('socialLinks[facebook]'),
                    twitter: formData.get('socialLinks[twitter]'),
                    instagram: formData.get('socialLinks[instagram]')
                }
            };
            
            try {
                // Show loading
                const saveBtn = document.getElementById('save-btn');
                const originalBtnText = saveBtn.innerHTML;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                saveBtn.disabled = true;
                
                const response = await fetch('/auth/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
                
                const data = await response.json();
                
                // Reset button
                saveBtn.innerHTML = originalBtnText;
                saveBtn.disabled = false;
                
                if (data.success) {
                    showAlert('success', 'Profile updated successfully');
                    
                    // Update visible profile elements without reloading
                    updateProfileElements(userData);
                } else {
                    showAlert('error', data.error || 'Failed to update profile');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showAlert('error', 'An error occurred while updating profile');
                
                // Reset button
                const saveBtn = document.getElementById('save-btn');
                saveBtn.innerHTML = 'Save Changes';
                saveBtn.disabled = false;
            }
        });
    }
    
    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }
}

/**
 * Update visible profile elements after successful profile update
 */
function updateProfileElements(userData) {
    // Update name elements
    const nameElements = document.querySelectorAll('.profile-name');
    nameElements.forEach(el => {
        el.textContent = `${userData.firstName} ${userData.lastName}`;
    });
    
    // Update location
    const locationElements = document.querySelectorAll('.profile-meta-item i.fa-map-marker-alt + span');
    locationElements.forEach(el => {
        el.textContent = userData.location || 'Location not specified';
    });
    
    // Update bio
    const aboutContent = document.querySelector('.about-content p');
    if (aboutContent) {
        aboutContent.textContent = userData.bio || 'No bio provided yet.';
    }
    
    // Update contact info
    const phoneValue = document.querySelector('.contact-value');
    if (phoneValue && userData.phone) {
        phoneValue.textContent = userData.phone;
    }
}

/**
 * Initialize password form
 */
function initPasswordForm() {
    const passwordForm = document.getElementById('password-form');
    const passwordCancelBtn = document.getElementById('password-cancel-btn');
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(passwordForm);
            const currentPassword = formData.get('currentPassword');
            const newPassword = formData.get('newPassword');
            const confirmPassword = formData.get('confirmPassword');
            
            // Basic validation
            if (newPassword !== confirmPassword) {
                showAlert('error', 'New passwords do not match');
                return;
            }
            
            if (newPassword.length < 8) {
                showAlert('error', 'Password must be at least 8 characters long');
                return;
            }
            
            try {
                // Show loading
                const saveBtn = document.getElementById('password-save-btn');
                const originalBtnText = saveBtn.innerHTML;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
                saveBtn.disabled = true;
                
                const response = await fetch('/auth/password', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword
                    })
                });
                
                const data = await response.json();
                
                // Reset button
                saveBtn.innerHTML = originalBtnText;
                saveBtn.disabled = false;
                
                if (data.success) {
                    showAlert('success', 'Password updated successfully');
                    passwordForm.reset();
                } else {
                    showAlert('error', data.error || 'Failed to update password');
                }
            } catch (error) {
                console.error('Error updating password:', error);
                showAlert('error', 'An error occurred while updating password');
                
                // Reset button
                const saveBtn = document.getElementById('password-save-btn');
                saveBtn.innerHTML = 'Update Password';
                saveBtn.disabled = false;
            }
        });
    }
    
    // Cancel button
    if (passwordCancelBtn) {
        passwordCancelBtn.addEventListener('click', () => {
            if (passwordForm) {
                passwordForm.reset();
            }
        });
    }
}

/**
 * Initialize review form
 */
function initReviewForm() {
    const writeReviewBtn = document.getElementById('writeReviewBtn');
    const writeReviewBtnAlt = document.getElementById('writeReviewBtnAlt');
    const reviewForm = document.getElementById('reviewForm');
    const reviewFormAlt = document.getElementById('reviewFormAlt');
    const submitReviewForm = document.getElementById('submitReviewForm');
    const submitReviewFormAlt = document.getElementById('submitReviewFormAlt');
    
    // Initialize star ratings
    initStarRatings();
    
    // Toggle review form visibility
    if (writeReviewBtn && reviewForm) {
        writeReviewBtn.addEventListener('click', () => {
            reviewForm.style.display = 'block';
            writeReviewBtn.style.display = 'none';
        });
    }
    
    if (writeReviewBtnAlt && reviewFormAlt) {
        writeReviewBtnAlt.addEventListener('click', () => {
            reviewFormAlt.style.display = 'block';
            writeReviewBtnAlt.style.display = 'none';
        });
    }
    
    // Submit review form
    if (submitReviewForm) {
        submitReviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitReview(submitReviewForm, reviewForm, writeReviewBtn);
        });
    }
    
    if (submitReviewFormAlt) {
        submitReviewFormAlt.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitReview(submitReviewFormAlt, reviewFormAlt, writeReviewBtnAlt);
        });
    }
}

/**
 * Handle review submission
 */
async function submitReview(form, formContainer, showButton) {
    // Get form data
    const formData = new FormData(form);
    const rating = formData.get('rating');
    const text = formData.get('reviewText');
    const sellerId = form.getAttribute('data-seller-id');
    
    // Validate
    if (!rating) {
        showAlert('error', 'Please select a rating');
        return;
    }
    
    if (!text.trim()) {
        showAlert('error', 'Please write a review');
        return;
    }
    
    try {
        // Disable form
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;
        
        // Submit review
        const response = await fetch('/reviews/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sellerId,
                rating: parseInt(rating),
                text
            })
        });
        
        const data = await response.json();
        
        // Reset button
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        
        if (data.success) {
            showAlert('success', 'Review submitted successfully');
            
            // Add review to page
            addReviewToPage(rating, text);
            
            // Reset and hide form
            form.reset();
            formContainer.style.display = 'none';
            
            // Reload page after brief delay to update stats
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showAlert('error', data.message || 'Failed to submit review');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        showAlert('error', 'An error occurred while submitting review');
    }
}

/**
 * Add new review to page
 */
function addReviewToPage(rating, text) {
    // Find review list
    const reviewLists = document.querySelectorAll('.review-list');
    if (reviewLists.length === 0) return;
    
    // Get current user info
    const currentUserImg = document.querySelector('.navbar-actions .profile-image')?.src || '/images/default-profile.jpg';
    const currentUserName = document.querySelector('.navbar-actions .profile-name')?.textContent || 'You';
    
    // Create review card
    const reviewCard = document.createElement('div');
    reviewCard.className = 'review-card';
    reviewCard.innerHTML = `
        <div class="review-header">
            <img src="${currentUserImg}" alt="${currentUserName}" class="review-avatar">
            <div class="review-user">
                <h4 class="review-username">${currentUserName}</h4>
                <span class="review-date">Just now</span>
            </div>
            <div class="review-rating">
                ${generateStarRating(rating)}
            </div>
        </div>
        <p class="review-text">${text}</p>
    `;
    
    // Add to both review lists
    reviewLists.forEach(list => {
        // Clear empty state if present
        const emptyState = list.parentElement.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        
        // Add to top of list
        list.insertBefore(reviewCard.cloneNode(true), list.firstChild);
    });
}

/**
 * Initialize star ratings
 */
function initStarRatings() {
    const ratingContainers = document.querySelectorAll('.rating-input');
    
    ratingContainers.forEach(container => {
        const labels = container.querySelectorAll('label');
        const inputs = container.querySelectorAll('input');
        
        // Set up hover effects
        labels.forEach((label, index) => {
            const starIcon = label.querySelector('i');
            
            // Hover effects
            label.addEventListener('mouseenter', () => {
                // Fill in stars up to this one
                for (let i = 0; i <= index; i++) {
                    const icon = labels[i].querySelector('i');
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                }
                
                // Empty stars after this one
                for (let i = index + 1; i < labels.length; i++) {
                    const icon = labels[i].querySelector('i');
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                }
            });
            
            // Click event
            label.addEventListener('click', () => {
                inputs[index].checked = true;
                
                // Update visual state
                for (let i = 0; i <= index; i++) {
                    const icon = labels[i].querySelector('i');
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                }
                
                for (let i = index + 1; i < labels.length; i++) {
                    const icon = labels[i].querySelector('i');
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                }
            });
        });
        
        // Reset to current selection on mouse leave
        container.addEventListener('mouseleave', () => {
            // Find checked input
            let checkedIndex = -1;
            inputs.forEach((input, i) => {
                if (input.checked) {
                    checkedIndex = i;
                }
            });
            
            // Update visual state
            labels.forEach((label, index) => {
                const icon = label.querySelector('i');
                if (index <= checkedIndex) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                }
            });
        });
    });
}

/**
 * Initialize motorcycle filter
 */
function initMotorcycleFilter() {
    const motorcycleFilter = document.getElementById('motorcycleFilter');
    const motorcyclesGrid = document.getElementById('motorcyclesGrid');
    
    if (motorcycleFilter && motorcyclesGrid) {
        motorcycleFilter.addEventListener('change', () => {
            const filterValue = motorcycleFilter.value;
            const motorcycleCards = motorcyclesGrid.querySelectorAll('.motorcycle-card');
            
            motorcycleCards.forEach(card => {
                const status = card.getAttribute('data-status');
                
                if (filterValue === 'all' || 
                    (filterValue === 'available' && status === 'available') ||
                    (filterValue === 'sold' && status === 'sold')) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
}

/**
 * Initialize follow button functionality
 */
function initFollowButton() {
    const followButton = document.getElementById('followButton');
    
    if (followButton) {
        followButton.addEventListener('click', async () => {
            const userId = followButton.getAttribute('data-userid');
            
            if (!userId) return;
            
            try {
                // Show loading
                const originalBtnText = followButton.innerHTML;
                followButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                followButton.disabled = true;
                
                const response = await fetch(`/api/account/follow/${userId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                // Reset button
                followButton.disabled = false;
                
                if (data.success) {
                    // Update button text and icon based on follow status
                    if (data.action === 'followed') {
                        followButton.innerHTML = '<i class="fas fa-user-minus"></i> Unfollow';
                        showAlert('success', 'User followed successfully');
                    } else {
                        followButton.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
                        showAlert('success', 'User unfollowed successfully');
                    }
                } else {
                    followButton.innerHTML = originalBtnText;
                    showAlert('error', data.message || 'Failed to update follow status');
                }
            } catch (error) {
                console.error('Error updating follow status:', error);
                showAlert('error', 'An error occurred while updating follow status');
                followButton.disabled = false;
            }
        });
    }
}

/**
 * Initialize load more buttons
 */
function initLoadMoreButtons() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadMoreReviewsBtn = document.getElementById('loadMoreReviewsBtn');
    
    // Load more motorcycles
    if (loadMoreBtn) {
        let page = 1;
        
        loadMoreBtn.addEventListener('click', async () => {
            page++;
            
            try {
                // Show loading
                const originalBtnText = loadMoreBtn.innerHTML;
                loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                loadMoreBtn.disabled = true;
                
                // Get user ID from URL
                const userId = window.location.pathname.split('/').pop();
                
                const response = await fetch(`/api/account/bikes?userId=${userId}&page=${page}`);
                const data = await response.json();
                
                // Reset button
                loadMoreBtn.innerHTML = originalBtnText;
                loadMoreBtn.disabled = false;
                
                if (data.success && data.bikes.length > 0) {
                    // Add bikes to grid
                    appendBikesToGrid(data.bikes);
                    
                    // Hide button if no more bikes
                    if (data.bikes.length < 6) {
                        loadMoreBtn.style.display = 'none';
                    }
                } else {
                    // No more bikes
                    loadMoreBtn.style.display = 'none';
                }
            } catch (error) {
                console.error('Error loading more bikes:', error);
                loadMoreBtn.innerHTML = 'Load More';
                loadMoreBtn.disabled = false;
            }
        });
    }
    
    // Load more reviews
    if (loadMoreReviewsBtn) {
        let page = 1;
        
        loadMoreReviewsBtn.addEventListener('click', async () => {
            page++;
            
            try {
                // Show loading
                const originalBtnText = loadMoreReviewsBtn.innerHTML;
                loadMoreReviewsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                loadMoreReviewsBtn.disabled = true;
                
                // Get user ID from URL
                const userId = window.location.pathname.split('/').pop();
                
                const response = await fetch(`/api/account/reviews?userId=${userId}&page=${page}`);
                const data = await response.json();
                
                // Reset button
                loadMoreReviewsBtn.innerHTML = originalBtnText;
                loadMoreReviewsBtn.disabled = false;
                
                if (data.success && data.reviews.length > 0) {
                    // Add reviews to list
                    appendReviewsToList(data.reviews);
                    
                    // Hide button if no more reviews
                    if (data.reviews.length < 5) {
                        loadMoreReviewsBtn.style.display = 'none';
                    }
                } else {
                    // No more reviews
                    loadMoreReviewsBtn.style.display = 'none';
                }
            } catch (error) {
                console.error('Error loading more reviews:', error);
                loadMoreReviewsBtn.innerHTML = 'Load More Reviews';
                loadMoreReviewsBtn.disabled = false;
            }
        });
    }
}

/**
 * Append bikes to grid
 */
function appendBikesToGrid(bikes) {
    const motorcyclesGrid = document.getElementById('motorcyclesGrid');
    
    if (!motorcyclesGrid) return;
    
    bikes.forEach(bike => {
        const bikeCard = document.createElement('div');
        bikeCard.className = 'motorcycle-card';
        bikeCard.setAttribute('data-status', bike.availability);
        
        bikeCard.innerHTML = `
            <div class="motorcycle-image">
                <img src="${bike.images[0] || '/images/placeholder-bike.jpg'}" alt="${bike.title}">
                <div class="motorcycle-price">₹${bike.price.toLocaleString()}</div>
            </div>
            <div class="motorcycle-content">
                <h3 class="motorcycle-title">${bike.title}</h3>
                <div class="motorcycle-meta">
                    <span><i class="fas fa-calendar"></i> ${bike.year}</span>
                    <span><i class="fas fa-tachometer-alt"></i> ${bike.mileage} km</span>
                    <span><i class="fas fa-gas-pump"></i> ${bike.fuelType}</span>
                </div>
                <div class="motorcycle-action">
                    <span class="motorcycle-status ${bike.availability === 'sold' ? 'sold' : 'available'}">
                        ${bike.availability === 'sold' ? 'Sold' : 'Available'}
                    </span>
                    <a href="/bikes/${bike._id}" class="btn-view">View Details</a>
                </div>
            </div>
        `;
        
        motorcyclesGrid.appendChild(bikeCard);
    });
}

/**
 * Append reviews to list
 */
function appendReviewsToList(reviews) {
    const reviewsList = document.getElementById('reviewsList');
    
    if (!reviewsList) return;
    
    reviews.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        
        reviewCard.innerHTML = `
            <div class="review-header">
                <img src="${review.reviewer.profileImage || '/images/default-profile.jpg'}" alt="${review.reviewer.username}" class="review-avatar">
                <div class="review-user">
                    <h4 class="review-username">${review.reviewer.username}</h4>
                    <span class="review-date">${new Date(review.createdAt).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}</span>
                </div>
                <div class="review-rating">
                    ${generateStarRating(review.rating)}
                </div>
            </div>
            <p class="review-text">${review.text}</p>
        `;
        
        reviewsList.appendChild(reviewCard);
    });
}

/**
 * Generate star rating HTML
 */
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let html = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        html += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (halfStar) {
        html += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        html += '<i class="far fa-star"></i>';
    }
    
    return html;
}

/**
 * Show alert notification
 */
function showAlert(type, message) {
    const alertContainer = document.getElementById('alert-container');
    
    if (!alertContainer) return;
    
    // Create alert element
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type === 'error' ? 'danger' : type}`;
    alertElement.innerHTML = `
        <div class="alert-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="alert-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to container
    alertContainer.appendChild(alertElement);
    
    // Close button click
    const closeButton = alertElement.querySelector('.alert-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            alertContainer.removeChild(alertElement);
        });
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertElement.parentNode === alertContainer) {
            alertContainer.removeChild(alertElement);
        }
    }, 5000);
}

/**
 * Initialize message button functionality
 */
function initMessageButton() {
    const messageBtn = document.querySelector('.btn-message:not([href])');
    if (!messageBtn) return;
    
    messageBtn.addEventListener('click', function() {
        const userId = document.querySelector('.btn-follow')?.getAttribute('data-user-id');
        if (!userId) return;
        
        // Redirect to messages page with user ID
        window.location.href = `/messages?user=${userId}`;
    });
}

/**
 * Initialize settings form
 */
function initSettingsForm() {
    const settingsForm = document.querySelector('form[action="/profile/update"]');
    if (!settingsForm) return;
    
    settingsForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        
        try {
            const response = await fetch('/profile/update', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Show success message
                showAlert('success', 'Profile updated successfully');
                
                // Reload page after a short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                // Show error message
                showAlert('error', data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showAlert('error', 'An error occurred while updating your profile');
        }
    });
    
    // Preview uploaded images
    const profileImageInput = document.getElementById('profileImage');
    const coverImageInput = document.getElementById('coverImage');
    
    if (profileImageInput) {
        profileImageInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const profileAvatar = document.querySelector('.profile-avatar');
                    if (profileAvatar) {
                        profileAvatar.src = e.target.result;
                    }
                };
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
    
    if (coverImageInput) {
        coverImageInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const coverImage = document.querySelector('.profile-cover img');
                    if (coverImage) {
                        coverImage.src = e.target.result;
                    }
                };
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
}

/**
 * Initialize image preview for file uploads
 */
function initImagePreview() {
    // Profile image preview
    const profileImageInput = document.getElementById('profileImage');
    if (profileImageInput) {
        profileImageInput.addEventListener('change', function() {
            const file = this.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const profileAvatar = document.querySelector('.profile-avatar');
                if (profileAvatar) {
                    profileAvatar.src = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        });
    }
    
    // Cover image preview
    const coverImageInput = document.getElementById('coverImage');
    if (coverImageInput) {
        coverImageInput.addEventListener('change', function() {
            const file = this.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const coverImage = document.querySelector('.profile-cover img');
                if (coverImage) {
                    coverImage.src = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        });
    }
}

/**
 * Initialize more dropdown menu
 */
function initMoreDropdown() {
    const moreBtn = document.querySelector('.btn-more');
    if (!moreBtn) return;
    
    moreBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Check if dropdown already exists
        let dropdown = document.querySelector('.profile-more-dropdown');
        
        if (dropdown) {
            // Toggle dropdown visibility
            dropdown.classList.toggle('show');
        } else {
            // Create dropdown
            dropdown = document.createElement('div');
            dropdown.className = 'profile-more-dropdown show';
            
            // Add dropdown items
            const dropdownItems = [];
            
            // Add options based on whether it's the user's own profile
            const isSelf = !document.querySelector('.btn-follow');
            
            if (isSelf) {
                dropdownItems.push(
                    { text: 'Edit Profile', icon: 'edit', action: 'edit' },
                    { text: 'Account Settings', icon: 'cog', action: 'settings' }
                );
            } else {
                dropdownItems.push(
                    { text: 'Report User', icon: 'flag', action: 'report' },
                    { text: 'Block User', icon: 'ban', action: 'block' }
                );
            }
            
            // Create dropdown HTML
            const dropdownHTML = `
                ${dropdownItems.map(item => `
                    <div class="dropdown-item" data-action="${item.action}">
                        <i class="fas fa-${item.icon}"></i>
                        <span>${item.text}</span>
                    </div>
                `).join('')}
            `;
            
            dropdown.innerHTML = dropdownHTML;
            
            // Position dropdown
            const rect = this.getBoundingClientRect();
            dropdown.style.top = `${rect.bottom + window.scrollY + 5}px`;
            dropdown.style.right = `${window.innerWidth - rect.right}px`;
            
            // Add styles if not present
            if (!document.getElementById('dropdown-styles')) {
                const styles = document.createElement('style');
                styles.id = 'dropdown-styles';
                styles.textContent = `
                    .profile-more-dropdown {
                        position: absolute;
                        background-color: white;
                        min-width: 180px;
                        border-radius: 8px;
                        box-shadow: 0 3px 12px rgba(0,0,0,0.15);
                        z-index: 100;
                        opacity: 0;
                        transform: translateY(-10px);
                        pointer-events: none;
                        transition: all 0.2s ease;
                    }
                    .profile-more-dropdown.show {
                        opacity: 1;
                        transform: translateY(0);
                        pointer-events: auto;
                    }
                    .dropdown-item {
                        padding: 12px 15px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    }
                    .dropdown-item:hover {
                        background-color: #f5f5f5;
                    }
                    .dropdown-item i {
                        width: 20px;
                        text-align: center;
                        color: #666;
                    }
                `;
                document.head.appendChild(styles);
            }
            
            // Add to DOM
            document.body.appendChild(dropdown);
            
            // Add event listeners for dropdown items
            dropdown.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', function() {
                    const action = this.getAttribute('data-action');
                    
                    // Close dropdown
                    dropdown.classList.remove('show');
                    setTimeout(() => {
                        dropdown.remove();
                    }, 200);
                    
                    // Handle action
                    handleDropdownAction(action);
                });
            });
        }
        
        // Close dropdown when clicking outside
        function handleClickOutside(e) {
            if (dropdown && !dropdown.contains(e.target) && e.target !== moreBtn) {
                dropdown.classList.remove('show');
                setTimeout(() => {
                    if (dropdown.parentElement) {
                        dropdown.parentElement.removeChild(dropdown);
                    }
                }, 200);
                document.removeEventListener('click', handleClickOutside);
            }
        }
        
        document.addEventListener('click', handleClickOutside);
    });
    
    /**
     * Handle dropdown action
     * @param {string} action - The action to handle
     */
    function handleDropdownAction(action) {
        const profileUsername = document.querySelector('.profile-username').textContent.substring(1);
        
        switch (action) {
            case 'edit':
                // Activate settings tab
                document.querySelector('[data-tab="settings"]').click();
                break;
                
            case 'settings':
                window.location.href = '/account/settings';
                break;
                
            case 'report':
                showReportModal(profileUsername);
                break;
                
            case 'block':
                showBlockModal(profileUsername);
                break;
                
            default:
                break;
        }
    }
    
    /**
     * Show report user modal
     * @param {string} username - Username of the user to report
     */
    function showReportModal(username) {
        const userId = document.querySelector('.btn-follow').getAttribute('data-user-id');
        
        // Create modal HTML
        const modalHtml = `
            <div class="report-modal">
                <div class="modal-header">
                    <h3>Report @${username}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Please select a reason for reporting this user:</p>
                    <div class="report-reasons">
                        <div class="report-reason">
                            <input type="radio" name="reportReason" id="reason1" value="spam">
                            <label for="reason1">Spam or scam</label>
                        </div>
                        <div class="report-reason">
                            <input type="radio" name="reportReason" id="reason2" value="inappropriate">
                            <label for="reason2">Inappropriate content</label>
                        </div>
                        <div class="report-reason">
                            <input type="radio" name="reportReason" id="reason3" value="harassment">
                            <label for="reason3">Harassment</label>
                        </div>
                        <div class="report-reason">
                            <input type="radio" name="reportReason" id="reason4" value="fake">
                            <label for="reason4">Fake account</label>
                        </div>
                        <div class="report-reason">
                            <input type="radio" name="reportReason" id="reason5" value="other">
                            <label for="reason5">Other</label>
                        </div>
                    </div>
                    <div class="report-details" style="display: none;">
                        <label for="reportDetails">Additional details (optional):</label>
                        <textarea id="reportDetails" rows="4" placeholder="Please provide any additional details that might help us understand the issue."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-submit" disabled>Submit Report</button>
                </div>
            </div>
            <div class="modal-overlay"></div>
        `;
        
        // Add modal to DOM
        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal-container';
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        // Show the textarea when "Other" is selected
        const reasonInputs = modalContainer.querySelectorAll('input[name="reportReason"]');
        const detailsSection = modalContainer.querySelector('.report-details');
        const submitBtn = modalContainer.querySelector('.btn-submit');
        
        reasonInputs.forEach(input => {
            input.addEventListener('change', function() {
                submitBtn.disabled = false;
                
                if (this.value === 'other') {
                    detailsSection.style.display = 'block';
                } else {
                    detailsSection.style.display = 'none';
                }
            });
        });
        
        // Modal events
        modalContainer.querySelector('.close-modal').addEventListener('click', closeModal);
        modalContainer.querySelector('.btn-cancel').addEventListener('click', closeModal);
        modalContainer.querySelector('.modal-overlay').addEventListener('click', closeModal);
        
        // Submit report
        modalContainer.querySelector('.btn-submit').addEventListener('click', function() {
            const reason = modalContainer.querySelector('input[name="reportReason"]:checked').value;
            const details = modalContainer.querySelector('#reportDetails').value.trim();
            
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            
            // Send report to server
            fetch('/api/users/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    reason,
                    details
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Report submitted successfully', 'success');
                    closeModal();
                } else {
                    showNotification(data.message || 'Failed to submit report', 'error');
                }
            })
            .catch(error => {
                console.error('Error submitting report:', error);
                showNotification('An error occurred', 'error');
            })
            .finally(() => {
                this.disabled = false;
                this.innerHTML = 'Submit Report';
            });
        });
        
        function closeModal() {
            modalContainer.querySelector('.report-modal').style.opacity = '0';
            modalContainer.querySelector('.modal-overlay').style.opacity = '0';
            
            setTimeout(() => {
                modalContainer.remove();
            }, 300);
        }
    }
    
    /**
     * Show block user confirmation modal
     * @param {string} username - Username of the user to block
     */
    function showBlockModal(username) {
        const userId = document.querySelector('.btn-follow').getAttribute('data-user-id');
        
        // Create and show a confirmation modal
        const modalHtml = `
            <div class="block-modal">
                <div class="modal-header">
                    <h3>Block @${username}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to block this user? They will no longer be able to:</p>
                    <ul>
                        <li>Send you messages</li>
                        <li>Follow your account</li>
                        <li>See your listings</li>
                    </ul>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-block">Block User</button>
                </div>
            </div>
            <div class="modal-overlay"></div>
        `;
        
        // Add modal to DOM
        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal-container';
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        // Modal events
        modalContainer.querySelector('.close-modal').addEventListener('click', closeModal);
        modalContainer.querySelector('.btn-cancel').addEventListener('click', closeModal);
        modalContainer.querySelector('.modal-overlay').addEventListener('click', closeModal);
        
        // Block user
        modalContainer.querySelector('.btn-block').addEventListener('click', function() {
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            
            // Send block request to server
            fetch('/api/users/block', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('User blocked successfully', 'success');
                    closeModal();
                    
                    // Redirect back to home page after blocking
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1500);
                } else {
                    showNotification(data.message || 'Failed to block user', 'error');
                }
            })
            .catch(error => {
                console.error('Error blocking user:', error);
                showNotification('An error occurred', 'error');
            })
            .finally(() => {
                this.disabled = false;
                this.innerHTML = 'Block User';
            });
        });
        
        function closeModal() {
            modalContainer.querySelector('.block-modal').style.opacity = '0';
            modalContainer.querySelector('.modal-overlay').style.opacity = '0';
            
            setTimeout(() => {
                modalContainer.remove();
            }, 300);
        }
    }
}

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    // Use the utils.js function if available
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }
    
    // Fallback implementation
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = message;
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

/**
 * Show alert
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success, error, warning, info)
 */
function showAlert(message, type = 'info') {
    // Use the utils.js function if available
    if (typeof window.showAlert === 'function') {
        window.showAlert(message, type);
        return;
    }
    
    // Fallback implementation
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = message;
    document.body.appendChild(alert);
    
    // Show with animation
    setTimeout(() => {
        alert.classList.add('show');
    }, 10);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 300);
    }, 3000);
} 