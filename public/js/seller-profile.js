document.addEventListener('DOMContentLoaded', function() {
    // Tab handling on page load (check URL params)
    const urlSearchParams = new URLSearchParams(window.location.search);
    if (urlSearchParams.has('tab')) {
        const tabName = urlSearchParams.get('tab');
        const tabEl = document.querySelector(`#${tabName}-tab`);
        if (tabEl) {
            const tab = new bootstrap.Tab(tabEl);
            tab.show();
        }
    }

    // Handle follow/unfollow functionality
    const followButton = document.getElementById('followButton');
    if (followButton) {
        followButton.addEventListener('click', function() {
            const sellerId = this.getAttribute('data-seller-id');
            
            fetch(`/api/sellers/${sellerId}/follow`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Update button state
                const followText = document.getElementById('followText');
                if (data.isFollowing) {
                    this.classList.remove('btn-outline-primary');
                    this.classList.add('btn-secondary');
                    this.querySelector('i').classList.remove('far');
                    this.querySelector('i').classList.add('fas');
                    followText.textContent = 'Following';
                } else {
                    this.classList.remove('btn-secondary');
                    this.classList.add('btn-outline-primary');
                    this.querySelector('i').classList.remove('fas');
                    this.querySelector('i').classList.add('far');
                    followText.textContent = 'Follow';
                }
                
                // Update follower count
                updateFollowerCount(data.followerCount);
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('Failed to update follow status', 'error');
            });
        });
    }

    function updateFollowerCount(count) {
        const followerCountElement = document.querySelector('.profile-stats .stat-item:nth-child(2) .stat-value');
        if (followerCountElement) {
            followerCountElement.textContent = count;
        }
    }

    // Star rating functionality
    initStarRating();

    // Review submission
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Reset validation errors
            this.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
            document.getElementById('reviewSubmitError').classList.add('d-none');
            document.getElementById('reviewSubmitSuccess').classList.add('d-none');
            
            const sellerId = this.getAttribute('data-seller-id');
            const rating = document.querySelector('input[name="rating"]:checked')?.value;
            const text = document.getElementById('reviewText').value;
            
            // Validate inputs
            let isValid = true;
            
            if (!rating) {
                document.getElementById('ratingError').textContent = 'Please select a rating';
                document.querySelector('.rating-input').classList.add('is-invalid');
                isValid = false;
            }
            
            if (!text.trim()) {
                document.getElementById('textError').textContent = 'Please enter your review';
                document.getElementById('reviewText').classList.add('is-invalid');
                isValid = false;
            }
            
            if (!isValid) return;
            
            // Send the review data
            fetch(`/api/sellers/${sellerId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ rating, text }),
                credentials: 'same-origin'
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw err; });
                }
                return response.json();
            })
            .then(data => {
                // Show success message
                document.getElementById('reviewSubmitSuccess').classList.remove('d-none');
                
                // Clear form
                reviewForm.reset();
                resetStarRating();
                
                // Reload reviews after a short delay
                setTimeout(() => {
                    loadReviews(1);
                    
                    // Switch to reviews tab
                    const reviewsTab = document.getElementById('reviews-tab');
                    if (reviewsTab) {
                        const tab = new bootstrap.Tab(reviewsTab);
                        tab.show();
                    }
                }, 1500);
            })
            .catch(error => {
                console.error('Error:', error);
                const errorMessage = error.message || 'Failed to submit review. Please try again.';
                document.getElementById('reviewSubmitError').textContent = errorMessage;
                document.getElementById('reviewSubmitError').classList.remove('d-none');
            });
        });
    }

    // Messaging functionality
    const messageForm = document.getElementById('messageForm');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    
    if (messageForm && sendMessageBtn) {
        sendMessageBtn.addEventListener('click', function() {
            // Reset validation errors
            messageForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
            document.getElementById('messageError').classList.add('d-none');
            document.getElementById('messageSuccess').classList.add('d-none');
            
            const recipientId = messageForm.getAttribute('data-recipient-id');
            const subject = document.getElementById('messageSubject').value;
            const content = document.getElementById('messageContent').value;
            
            // Validate inputs
            let isValid = true;
            
            if (!subject.trim()) {
                document.getElementById('subjectError').textContent = 'Please enter a subject';
                document.getElementById('messageSubject').classList.add('is-invalid');
                isValid = false;
            }
            
            if (!content.trim()) {
                document.getElementById('contentError').textContent = 'Please enter a message';
                document.getElementById('messageContent').classList.add('is-invalid');
                isValid = false;
            }
            
            if (!isValid) return;
            
            // Send the message
            fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    recipient: recipientId,
                    subject,
                    content
                }),
                credentials: 'same-origin'
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw err; });
                }
                return response.json();
            })
            .then(data => {
                // Show success message
                document.getElementById('messageSuccess').textContent = 'Message sent successfully!';
                document.getElementById('messageSuccess').classList.remove('d-none');
                
                // Clear form
                messageForm.reset();
                
                // Close modal after a delay
                setTimeout(() => {
                    const messageModal = bootstrap.Modal.getInstance(document.getElementById('messageModal'));
                    if (messageModal) {
                        messageModal.hide();
                    }
                }, 2000);
            })
            .catch(error => {
                console.error('Error:', error);
                const errorMessage = error.message || 'Failed to send message. Please try again.';
                document.getElementById('messageError').textContent = errorMessage;
                document.getElementById('messageError').classList.remove('d-none');
            });
        });
    }

    // Pagination for bikes
    setupPagination('bikesPagination', loadBikes);
    
    // Pagination for reviews
    setupPagination('reviewsPagination', loadReviews);

    // Functions
    function setupPagination(paginationId, loadFunction) {
        const paginationElement = document.getElementById(paginationId);
        if (paginationElement) {
            paginationElement.addEventListener('click', function(e) {
                if (e.target.tagName === 'A' || e.target.parentElement.tagName === 'A') {
                    e.preventDefault();
                    const pageLink = e.target.closest('a');
                    if (pageLink) {
                        const page = pageLink.getAttribute('data-page');
                        if (page) {
                            loadFunction(parseInt(page));
                        }
                    }
                }
            });
        }
    }

    function loadBikes(page) {
        const sellerId = document.querySelector('[data-seller-id]').getAttribute('data-seller-id');
        const bikesContainer = document.getElementById('bikesContainer');
        const pagination = document.getElementById('bikesPagination');
        
        if (!bikesContainer || !pagination) return;
        
        // Show loading state
        bikesContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        
        fetch(`/api/sellers/${sellerId}/bikes?page=${page}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Update URL without reload
                const url = new URL(window.location);
                url.searchParams.set('tab', 'bikes');
                url.searchParams.set('page', page);
                window.history.pushState({}, '', url);
                
                // Render bikes
                renderBikes(data.bikes, bikesContainer);
                
                // Update pagination
                updatePagination(pagination, page, data.totalPages);
            })
            .catch(error => {
                console.error('Error loading bikes:', error);
                bikesContainer.innerHTML = '<div class="alert alert-danger">Failed to load bikes. Please try again.</div>';
            });
    }

    function loadReviews(page) {
        const sellerId = document.querySelector('[data-seller-id]').getAttribute('data-seller-id');
        const reviewsContainer = document.getElementById('reviewsContainer');
        const pagination = document.getElementById('reviewsPagination');
        const reviewForm = document.getElementById('reviewForm');
        
        if (!reviewsContainer || !pagination) return;
        
        // Keep review form if present
        const reviewFormHtml = reviewForm ? reviewForm.parentElement.outerHTML : '';
        
        // Show loading state
        reviewsContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        
        fetch(`/api/sellers/${sellerId}/reviews?page=${page}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Update URL without reload
                const url = new URL(window.location);
                url.searchParams.set('tab', 'reviews');
                url.searchParams.set('page', page);
                window.history.pushState({}, '', url);
                
                // Render reviews
                renderReviews(data.reviews, reviewsContainer);
                
                // Update pagination
                updatePagination(pagination, page, data.totalPages);
                
                // Reattach review form
                if (reviewFormHtml && !document.querySelector('.review-form-card')) {
                    reviewsContainer.insertAdjacentHTML('afterbegin', reviewFormHtml);
                    initStarRating(); // Reinitialize star rating
                    setupReviewForm(); // Reattach event listeners
                }
                
                // Update average rating in profile
                if (data.averageRating !== undefined) {
                    updateAverageRating(data.averageRating, data.reviews.length);
                }
            })
            .catch(error => {
                console.error('Error loading reviews:', error);
                reviewsContainer.innerHTML = '<div class="alert alert-danger">Failed to load reviews. Please try again.</div>';
            });
    }

    function renderBikes(bikes, container) {
        if (!bikes || bikes.length === 0) {
            container.innerHTML = '<div class="alert alert-info w-100">This seller hasn\'t listed any bikes yet.</div>';
            return;
        }
        
        let html = '';
        bikes.forEach(bike => {
            html += `
                <div class="bike-card">
                    <div class="bike-image">
                        <img src="${bike.images && bike.images.length > 0 ? bike.images[0] : '/img/default-bike.jpg'}" alt="${bike.title}">
                        <div class="bike-badge ${bike.availability === 'available' ? 'available' : 'sold'}">
                            ${bike.availability === 'available' ? 'Available' : 'Sold'}
                        </div>
                    </div>
                    <div class="bike-content">
                        <h5 class="bike-title">${bike.title}</h5>
                        <p class="bike-subtitle">${bike.brand} ${bike.model} ${bike.year}</p>
                        <p class="bike-price">₹${bike.price.toLocaleString()}</p>
                        <div class="bike-meta">
                            <span class="bike-meta-item"><i class="fas fa-tachometer-alt me-1"></i>${bike.mileage} km</span>
                            <span class="bike-meta-item"><i class="fas fa-cog me-1"></i>${bike.engineCapacity} cc</span>
                            <span class="bike-meta-item"><i class="fas fa-gas-pump me-1"></i>${bike.fuelType}</span>
                        </div>
                        <a href="/bikes/${bike._id}" class="btn btn-sm btn-primary w-100">View Details</a>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    function renderReviews(reviews, container) {
        if (!reviews || reviews.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No reviews yet. Be the first to leave a review!</div>';
            return;
        }
        
        let html = '';
        reviews.forEach(review => {
            let starsHtml = '';
            for(let i = 1; i <= 5; i++) {
                starsHtml += `<i class="${i <= review.rating ? 'fas' : 'far'} fa-star ${i <= review.rating ? '' : 'text-muted'}"></i>`;
            }
            
            html += `
                <div class="review-card p-3">
                    <div class="review-header">
                        <div class="reviewer">
                            <img src="${review.reviewer.profileImage || '/img/default-profile.jpg'}" alt="${review.reviewer.username}" class="reviewer-image">
                            <div>
                                <h6 class="reviewer-name">${review.reviewer.username}</h6>
                                <div class="stars mb-1">
                                    ${starsHtml}
                                </div>
                            </div>
                        </div>
                        <span class="review-date">${new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p class="review-content">${review.text}</p>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    function updatePagination(paginationElement, currentPage, totalPages) {
        if (!paginationElement) return;
        
        let html = '';
        
        // Previous button
        html += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="javascript:void(0)" data-page="${currentPage - 1}" aria-label="Previous">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>
        `;
        
        // Page numbers
        for(let i = 1; i <= totalPages; i++) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="javascript:void(0)" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        // Next button
        html += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="javascript:void(0)" data-page="${currentPage + 1}" aria-label="Next">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            </li>
        `;
        
        paginationElement.innerHTML = html;
    }

    function updateAverageRating(averageRating, reviewCount) {
        const ratingStarsEl = document.querySelector('.profile-card .rating-display .stars');
        const ratingValueEl = document.querySelector('.profile-card .rating-display .rating-value');
        const ratingCountEl = document.querySelector('.profile-card .rating-display .rating-count');
        
        if (ratingStarsEl && ratingValueEl && ratingCountEl) {
            // Update stars
            let starsHtml = '';
            for(let i = 1; i <= 5; i++) {
                if (i <= Math.floor(averageRating)) {
                    starsHtml += '<i class="fas fa-star"></i>';
                } else if (i === Math.ceil(averageRating) && !Number.isInteger(averageRating)) {
                    starsHtml += '<i class="fas fa-star-half-alt"></i>';
                } else {
                    starsHtml += '<i class="far fa-star text-muted"></i>';
                }
            }
            ratingStarsEl.innerHTML = starsHtml;
            
            // Update rating value
            ratingValueEl.textContent = averageRating.toFixed(1);
            
            // Update review count
            ratingCountEl.textContent = `(${reviewCount} reviews)`;
        }
    }

    function initStarRating() {
        const ratingLabels = document.querySelectorAll('.rating-input label');
        const ratingInputs = document.querySelectorAll('.rating-input input');
        
        if (!ratingLabels.length) return;
        
        // Handle hover states
        ratingLabels.forEach(label => {
            label.addEventListener('mouseover', function() {
                const starValue = parseInt(this.getAttribute('for').replace('star', ''));
                
                ratingLabels.forEach((l, i) => {
                    const starIndex = 5 - i; // Reverse index (for RTL display)
                    const icon = l.querySelector('i');
                    
                    if (starIndex <= starValue) {
                        icon.classList.remove('far');
                        icon.classList.add('fas');
                    } else {
                        icon.classList.remove('fas');
                        icon.classList.add('far');
                    }
                });
            });
        });
        
        // Handle mouseout
        const ratingContainer = document.querySelector('.rating-input');
        if (ratingContainer) {
            ratingContainer.addEventListener('mouseout', function() {
                resetStarRatingDisplay();
            });
        }
        
        // Handle click
        ratingInputs.forEach(input => {
            input.addEventListener('change', function() {
                resetStarRatingDisplay();
            });
        });
    }

    function resetStarRatingDisplay() {
        const ratingLabels = document.querySelectorAll('.rating-input label');
        const checkedInput = document.querySelector('.rating-input input:checked');
        const checkedValue = checkedInput ? parseInt(checkedInput.value) : 0;
        
        ratingLabels.forEach((l, i) => {
            const starIndex = 5 - i; // Reverse index (for RTL display)
            const icon = l.querySelector('i');
            
            if (starIndex <= checkedValue) {
                icon.classList.remove('far');
                icon.classList.add('fas');
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
            }
        });
    }

    function resetStarRating() {
        const ratingInputs = document.querySelectorAll('.rating-input input');
        ratingInputs.forEach(input => {
            input.checked = false;
        });
        resetStarRatingDisplay();
    }

    function showToast(message, type = 'info') {
        // Create toast if not exists
        if (!document.getElementById('toast-container')) {
            const toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
            toastContainer.style.zIndex = '5';
            document.body.appendChild(toastContainer);
        }
        
        const toastId = 'toast-' + Date.now();
        const toastHTML = `
            <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header ${type === 'error' ? 'bg-danger text-white' : 'bg-primary text-white'}">
                    <strong class="me-auto">${type === 'error' ? 'Error' : 'Message'}</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">${message}</div>
            </div>
        `;
        
        document.getElementById('toast-container').insertAdjacentHTML('beforeend', toastHTML);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 5000 });
        toast.show();
        
        // Remove toast from DOM after it's hidden
        toastElement.addEventListener('hidden.bs.toast', function() {
            this.remove();
        });
    }
}); 