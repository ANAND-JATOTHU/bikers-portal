/**
 * Bikes (Motorcycles) page functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const filterForm = document.getElementById('filterForm');
    const resetFilterBtn = document.getElementById('resetFilter');
    const sortBySelect = document.getElementById('sortBy');
    const filterToggleBtn = document.getElementById('filterToggle');
    const filterSidebar = document.querySelector('.filter-sidebar');
    const closeFilterBtn = document.querySelector('.close-filter');
    const viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
    const bikeGrid = document.querySelector('.bike-grid');
    const favoriteBtns = document.querySelectorAll('.favorite-btn');
    const quickViewBtns = document.querySelectorAll('.quick-view-btn');
    
    // Initialize price and year range sliders
    initRangeSliders();
    
    // Set up event listeners
    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            applyFilters();
        });
    }
    
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', function() {
            resetFilters();
        });
    }
    
    if (sortBySelect) {
        sortBySelect.addEventListener('change', function() {
            applySorting();
        });
    }
    
    if (filterToggleBtn && filterSidebar) {
        filterToggleBtn.addEventListener('click', function() {
            toggleFilterSidebar();
        });
    }
    
    if (closeFilterBtn && filterSidebar) {
        closeFilterBtn.addEventListener('click', function() {
            closeFilterSidebar();
        });
    }
    
    // View toggle (grid/list)
    viewToggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            changeView(this.getAttribute('data-view'));
        });
    });
    
    // Favorite buttons
    favoriteBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(this);
        });
    });
    
    // Quick view buttons
    quickViewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            showQuickView(this.getAttribute('data-bike-id'));
        });
    });
    
    // Add overlay click event to close sidebar on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 992 && 
            filterSidebar && 
            filterSidebar.classList.contains('active') && 
            !filterSidebar.contains(e.target) && 
            e.target !== filterToggleBtn) {
            closeFilterSidebar();
        }
    });
    
    /**
     * Initialize range sliders for price and year
     */
    function initRangeSliders() {
        // Price range sliders
        const priceMinSlider = document.getElementById('priceMinSlider');
        const priceMaxSlider = document.getElementById('priceMaxSlider');
        const priceMinInput = document.getElementById('priceMin');
        const priceMaxInput = document.getElementById('priceMax');
        
        if (priceMinSlider && priceMaxSlider && priceMinInput && priceMaxInput) {
            // Update input when slider changes
            priceMinSlider.addEventListener('input', function() {
                priceMinInput.value = this.value;
                updatePriceRange();
            });
            
            priceMaxSlider.addEventListener('input', function() {
                priceMaxInput.value = this.value;
                updatePriceRange();
            });
            
            // Update slider when input changes
            priceMinInput.addEventListener('change', function() {
                priceMinSlider.value = this.value;
                updatePriceRange();
            });
            
            priceMaxInput.addEventListener('change', function() {
                priceMaxSlider.value = this.value;
                updatePriceRange();
            });
            
            // Ensure min doesn't exceed max and vice versa
            function updatePriceRange() {
                const minVal = parseInt(priceMinInput.value);
                const maxVal = parseInt(priceMaxInput.value);
                
                if (minVal > maxVal) {
                    priceMaxInput.value = minVal;
                    priceMaxSlider.value = minVal;
                }
            }
        }
        
        // Year range sliders
        const yearMinSlider = document.getElementById('yearMinSlider');
        const yearMaxSlider = document.getElementById('yearMaxSlider');
        const yearMinInput = document.getElementById('yearMin');
        const yearMaxInput = document.getElementById('yearMax');
        
        if (yearMinSlider && yearMaxSlider && yearMinInput && yearMaxInput) {
            // Update input when slider changes
            yearMinSlider.addEventListener('input', function() {
                yearMinInput.value = this.value;
                updateYearRange();
            });
            
            yearMaxSlider.addEventListener('input', function() {
                yearMaxInput.value = this.value;
                updateYearRange();
            });
            
            // Update slider when input changes
            yearMinInput.addEventListener('change', function() {
                yearMinSlider.value = this.value;
                updateYearRange();
            });
            
            yearMaxInput.addEventListener('change', function() {
                yearMaxSlider.value = this.value;
                updateYearRange();
            });
            
            // Ensure min doesn't exceed max and vice versa
            function updateYearRange() {
                const minVal = parseInt(yearMinInput.value);
                const maxVal = parseInt(yearMaxInput.value);
                
                if (minVal > maxVal) {
                    yearMaxInput.value = minVal;
                    yearMaxSlider.value = minVal;
                }
            }
        }
    }
    
    /**
     * Apply filters and submit form
     */
    function applyFilters() {
        if (filterForm) {
            filterForm.submit();
        }
    }
    
    /**
     * Reset all filters
     */
    function resetFilters() {
        if (filterForm) {
            filterForm.reset();
            
            // Reset range sliders
            const priceMinSlider = document.getElementById('priceMinSlider');
            const priceMaxSlider = document.getElementById('priceMaxSlider');
            const yearMinSlider = document.getElementById('yearMinSlider');
            const yearMaxSlider = document.getElementById('yearMaxSlider');
            
            if (priceMinSlider) priceMinSlider.value = priceMinSlider.min;
            if (priceMaxSlider) priceMaxSlider.value = priceMaxSlider.max;
            if (yearMinSlider) yearMinSlider.value = yearMinSlider.min;
            if (yearMaxSlider) yearMaxSlider.value = yearMaxSlider.max;
            
            // Submit form with reset values
            applyFilters();
        }
    }
    
    /**
     * Apply sorting
     */
    function applySorting() {
        if (sortBySelect && filterForm) {
            // Create or update hidden input for sort
            let sortInput = filterForm.querySelector('input[name="sortBy"]');
            
            if (!sortInput) {
                sortInput = document.createElement('input');
                sortInput.type = 'hidden';
                sortInput.name = 'sortBy';
                filterForm.appendChild(sortInput);
            }
            
            sortInput.value = sortBySelect.value;
            
            // Submit form with sort value
            applyFilters();
        }
    }
    
    /**
     * Toggle filter sidebar on mobile
     */
    function toggleFilterSidebar() {
        if (filterSidebar) {
            filterSidebar.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
            
            // Create overlay if it doesn't exist
            let overlay = document.querySelector('.filter-overlay');
            
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'filter-overlay';
                document.body.appendChild(overlay);
            }
            
            overlay.classList.toggle('active');
        }
    }
    
    /**
     * Close filter sidebar
     */
    function closeFilterSidebar() {
        if (filterSidebar) {
            filterSidebar.classList.remove('active');
            document.body.classList.remove('no-scroll');
            
            const overlay = document.querySelector('.filter-overlay');
            if (overlay) {
                overlay.classList.remove('active');
            }
        }
    }
    
    /**
     * Change view mode (grid/list)
     */
    function changeView(viewMode) {
        if (bikeGrid && viewToggleBtns) {
            // Update active class on buttons
            viewToggleBtns.forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-view') === viewMode) {
                    btn.classList.add('active');
                }
            });
            
            // Update grid class
            bikeGrid.classList.remove('grid-view', 'list-view');
            bikeGrid.classList.add(viewMode + '-view');
            
            // Store preference in localStorage
            localStorage.setItem('bikeViewMode', viewMode);
        }
    }
    
    /**
     * Toggle favorite status for a bike
     * @param {HTMLElement} button - The favorite button element
     */
    function toggleFavorite(button) {
        const bikeId = button.getAttribute('data-bike-id');
        
        if (!bikeId) {
            console.error('No bike ID provided for favorite');
            return;
        }
        
        // Get all favorite buttons for this bike (there could be multiple if in different views)
        const allBikeFavButtons = document.querySelectorAll(`.favorite-btn[data-bike-id="${bikeId}"]`);
        
        // Toggle active class for visual feedback immediately
        allBikeFavButtons.forEach(btn => {
            btn.classList.toggle('active');
            const icon = btn.querySelector('i');
            if (icon) {
                if (btn.classList.contains('active')) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                }
            }
        });
        
        // Check if user is logged in
        const isLoggedIn = document.body.classList.contains('logged-in');
        
        if (!isLoggedIn) {
            // Show login prompt
            showToast('Please login to save motorcycles to your favorites', 'warning');
            
            // Optional: Redirect to login
            // setTimeout(() => {
            //     window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            // }, 2000);
            
            return;
        }
        
        // API call to toggle favorite
        fetch('/api/favorites/toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ bikeId: bikeId })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to toggle favorite');
            }
            return response.json();
        })
        .then(data => {
            // Show success message
            const action = data.added ? 'added to' : 'removed from';
            showToast(`Motorcycle ${action} your favorites`, 'success');
        })
        .catch(error => {
            console.error('Error toggling favorite:', error);
            
            // Revert visual state on error
            allBikeFavButtons.forEach(btn => {
                btn.classList.toggle('active');
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.classList.toggle('far');
                    icon.classList.toggle('fas');
                }
            });
            
            showToast('Failed to update favorites. Please try again.', 'error');
        });
    }
    
    /**
     * Show quick view modal for a bike
     * @param {string} bikeId - The ID of the bike to show
     */
    function showQuickView(bikeId) {
        if (!bikeId) {
            console.error('No bike ID provided for quick view');
            return;
        }
        
        // Create modal if it doesn't exist
        let quickViewModal = document.getElementById('quickViewModal');
        
        if (!quickViewModal) {
            quickViewModal = document.createElement('div');
            quickViewModal.id = 'quickViewModal';
            quickViewModal.className = 'modal quick-view-modal';
            quickViewModal.innerHTML = `
                <div class="modal-content">
                    <span class="modal-close">&times;</span>
                    <div class="modal-body">
                        <div class="quick-view-spinner">
                            <i class="fas fa-spinner fa-spin"></i>
                        </div>
                        <div class="quick-view-content"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(quickViewModal);
            
            // Add close event
            const closeBtn = quickViewModal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    quickViewModal.style.display = 'none';
                    document.body.classList.remove('no-scroll');
                });
            }
            
            // Close when clicking outside
            window.addEventListener('click', function(e) {
                if (e.target === quickViewModal) {
                    quickViewModal.style.display = 'none';
                    document.body.classList.remove('no-scroll');
                }
            });
        }
        
        // Show modal and loading spinner
        quickViewModal.style.display = 'block';
        document.body.classList.add('no-scroll');
        
        const spinner = quickViewModal.querySelector('.quick-view-spinner');
        const content = quickViewModal.querySelector('.quick-view-content');
        
        if (spinner) spinner.style.display = 'flex';
        if (content) content.innerHTML = '';
        
        // Fetch bike data
        fetch(`/api/bikes/${bikeId}/quickview`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load quick view data');
                }
                return response.json();
            })
            .then(data => {
                if (content) {
                    content.innerHTML = `
                        <div class="quick-view-grid">
                            <div class="quick-view-images">
                                <div class="main-image">
                                    <img src="${getValidImageUrl(data.images)}" alt="${data.title}" onerror="this.src='/images/default-bike.jpg';">
                                </div>
                                ${data.images && data.images.length > 1 ? `
                                <div class="thumbnail-images">
                                    ${data.images.slice(0, 4).map(img => `
                                        <div class="thumbnail-image">
                                            <img src="${img}" alt="${data.title}" onerror="this.src='/images/default-bike.jpg';">
                                        </div>
                                    `).join('')}
                                </div>` : ''}
                            </div>
                            <div class="quick-view-details">
                                <div class="quick-view-brand">${data.brand}</div>
                                <h2 class="quick-view-title">${data.title}</h2>
                                
                                <div class="quick-view-price-section">
                                    ${data.originalPrice && data.originalPrice > data.price ? `
                                    <div class="quick-view-discount">
                                        <span class="original-price">₹${data.originalPrice.toLocaleString()}</span>
                                        <span class="discount-percent">${Math.round((data.originalPrice - data.price) / data.originalPrice * 100)}% OFF</span>
                                    </div>` : ''}
                                    <div class="quick-view-price">₹${data.price.toLocaleString()}</div>
                                </div>
                                
                                <div class="quick-view-info">
                                    <div class="info-item">
                                        <span class="info-label">Condition:</span>
                                        <span class="info-value">${data.condition}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Year:</span>
                                        <span class="info-value">${data.year}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Mileage:</span>
                                        <span class="info-value">${data.mileage.toLocaleString()} km</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Location:</span>
                                        <span class="info-value">${data.location}</span>
                                    </div>
                                </div>
                                
                                <div class="quick-view-description">${data.description}</div>
                                
                                <div class="quick-view-actions">
                                    <a href="/bikes/${data._id}" class="btn btn-primary btn-view-details">
                                        View Full Details
                                    </a>
                                    <button class="btn btn-outline btn-contact-seller" data-seller-id="${data.seller}">
                                        Contact Seller
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    // Add thumbnail click events
                    const thumbnails = content.querySelectorAll('.thumbnail-image img');
                    const mainImage = content.querySelector('.main-image img');
                    
                    if (thumbnails && mainImage) {
                        thumbnails.forEach(thumb => {
                            thumb.addEventListener('click', function() {
                                mainImage.src = this.src;
                            });
                        });
                    }
                    
                    // Add contact seller event
                    const contactBtn = content.querySelector('.btn-contact-seller');
                    if (contactBtn) {
                        contactBtn.addEventListener('click', function() {
                            const sellerId = this.getAttribute('data-seller-id');
                            if (sellerId) {
                                window.location.href = `/seller/${sellerId}?inquiry=true&bike=${bikeId}`;
                            }
                        });
                    }
                }
                
                if (spinner) spinner.style.display = 'none';
            })
            .catch(error => {
                console.error('Error loading quick view:', error);
                
                if (content) {
                    content.innerHTML = `
                        <div class="quick-view-error">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>Failed to load motorcycle details. Please try again.</p>
                        </div>
                    `;
                }
                
                if (spinner) spinner.style.display = 'none';
            });
    }
    
    /**
     * Get a valid image URL from an image array
     * @param {Array} images - Array of image URLs
     * @returns {string} - A valid image URL
     */
    function getValidImageUrl(images) {
        // Check if there are any images
        if (!images || !Array.isArray(images) || images.length === 0) {
            return '/images/default-bike.jpg';
        }
        
        // Prioritize data URLs first (they are the ones uploaded by users)
        const dataUrlImage = images.find(img => img && img.startsWith('data:image'));
        if (dataUrlImage) {
            return dataUrlImage;
        }
        
        // Otherwise return the first image
        return images[0];
    }
    
    /**
     * Show toast notification
     */
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Auto dismiss after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
        
        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                toast.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            });
        }
    }
    
    // Load view preference from localStorage
    const savedViewMode = localStorage.getItem('bikeViewMode');
    if (savedViewMode) {
        changeView(savedViewMode);
    } else {
        // Default to grid view
        changeView('grid');
    }

    // Format price with rupee symbol
    function formatPrice(price) {
        return '₹' + Number(price).toLocaleString();
    }
}); 