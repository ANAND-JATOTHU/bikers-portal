/**
 * Buy page functionality for the Bikers Portal
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const filterForm = document.getElementById('filter-form');
    const sortSelect = document.getElementById('sort-select');
    const searchForm = document.getElementById('search-form');
    const bikeListings = document.getElementById('bike-listings');
    const loadMoreBtn = document.getElementById('load-more');
    const noResultsMsg = document.getElementById('no-results');
    
    // Pagination state
    let currentPage = 1;
    let totalPages = 1;
    let currentFilters = {};
    let currentSort = 'newest';
    let currentSearch = '';
    
    // Range slider setup for price and year
    const setupRangeSliders = () => {
        const priceRange = document.getElementById('price-range');
        const yearRange = document.getElementById('year-range');
        
        if (priceRange) {
            noUiSlider.create(priceRange, {
                start: [0, 100000],
                connect: true,
                step: 1000,
                range: {
                    'min': 0,
                    'max': 100000
                },
                format: {
                    to: value => Math.round(value),
                    from: value => Number(value)
                }
            });
            
            const priceMin = document.getElementById('price-min');
            const priceMax = document.getElementById('price-max');
            
            priceRange.noUiSlider.on('update', function(values, handle) {
                if (handle === 0) {
                    priceMin.value = values[handle];
                } else {
                    priceMax.value = values[handle];
                }
            });
            
            // Update slider if inputs change
            priceMin.addEventListener('change', function() {
                priceRange.noUiSlider.set([this.value, null]);
            });
            
            priceMax.addEventListener('change', function() {
                priceRange.noUiSlider.set([null, this.value]);
            });
        }
        
        if (yearRange) {
            const currentYear = new Date().getFullYear();
            noUiSlider.create(yearRange, {
                start: [currentYear - 10, currentYear],
                connect: true,
                step: 1,
                range: {
                    'min': currentYear - 30,
                    'max': currentYear
                },
                format: {
                    to: value => Math.round(value),
                    from: value => Number(value)
                }
            });
            
            const yearMin = document.getElementById('year-min');
            const yearMax = document.getElementById('year-max');
            
            yearRange.noUiSlider.on('update', function(values, handle) {
                if (handle === 0) {
                    yearMin.value = values[handle];
                } else {
                    yearMax.value = values[handle];
                }
            });
            
            // Update slider if inputs change
            yearMin.addEventListener('change', function() {
                yearRange.noUiSlider.set([this.value, null]);
            });
            
            yearMax.addEventListener('change', function() {
                yearRange.noUiSlider.set([null, this.value]);
            });
        }
    };
    
    // Initialize range sliders
    setupRangeSliders();
    
    // Apply filters from the form
    const applyFilters = (form) => {
        const formData = new FormData(form);
        const filters = {};
        
        // Process regular form fields
        for (const [key, value] of formData.entries()) {
            if (value && value !== '') {
                filters[key] = value;
            }
        }
        
        // Get range slider values
        if (document.getElementById('price-range')) {
            const priceValues = document.getElementById('price-range').noUiSlider.get();
            filters.priceMin = priceValues[0];
            filters.priceMax = priceValues[1];
        }
        
        if (document.getElementById('year-range')) {
            const yearValues = document.getElementById('year-range').noUiSlider.get();
            filters.yearMin = yearValues[0];
            filters.yearMax = yearValues[1];
        }
        
        return filters;
    };
    
    // Load bikes from API
    const loadBikes = async (page = 1, filters = {}, sort = 'newest', search = '') => {
        // Show loading state
        if (page === 1) {
            bikeListings.innerHTML = '<div class="loading-spinner"><div></div><div></div><div></div></div>';
        }
        
        try {
            // Build query string
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('sort', sort);
            
            if (search) {
                params.append('search', search);
            }
            
            // Add filters to query string
            Object.keys(filters).forEach(key => {
                params.append(key, filters[key]);
            });
            
            // Fetch bikes
            const response = await fetch(`/api/bikes?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error('Failed to load bikes');
            }
            
            const data = await response.json();
            
            // Update pagination state
            currentPage = page;
            totalPages = data.totalPages || 1;
            
            // Hide/show load more button
            if (currentPage >= totalPages) {
                loadMoreBtn.classList.add('hidden');
            } else {
                loadMoreBtn.classList.remove('hidden');
            }
            
            // Render bikes
            if (page === 1) {
                bikeListings.innerHTML = '';
                
                if (data.bikes.length === 0) {
                    noResultsMsg.classList.remove('hidden');
                } else {
                    noResultsMsg.classList.add('hidden');
                }
            }
            
            renderBikes(data.bikes);
            
        } catch (error) {
            console.error('Error loading bikes:', error);
            if (page === 1) {
                bikeListings.innerHTML = `<div class="error-message">Error loading bikes. Please try again.</div>`;
            }
        }
    };
    
    // Render bike listings
    const renderBikes = (bikes) => {
        bikes.forEach(bike => {
            const bikeCard = document.createElement('div');
            bikeCard.className = 'bike-card';
            bikeCard.setAttribute('data-bike-id', bike._id);
            
            const imageSrc = bike.images && bike.images.length > 0 
                ? `/uploads/bikes/${bike.images[0]}` 
                : '/images/placeholder-bike.jpg';
            
            bikeCard.innerHTML = `
                <div class="bike-card-image">
                    <img src="${imageSrc}" alt="${bike.title}" loading="lazy">
                    ${bike.featured ? '<span class="badge featured">Featured</span>' : ''}
                    ${bike.availability === 'sold' ? '<span class="badge sold">Sold</span>' : ''}
                </div>
                <div class="bike-card-content">
                    <h3 class="bike-title">${bike.title}</h3>
                    <div class="bike-meta">
                        <span class="bike-price">₹${bike.price.toLocaleString()}</span>
                        <span class="bike-year">${bike.year}</span>
                    </div>
                    <div class="bike-specs">
                        <span class="bike-spec"><i class="fas fa-tachometer-alt"></i> ${bike.mileage} km</span>
                        <span class="bike-spec"><i class="fas fa-gas-pump"></i> ${bike.fuelType}</span>
                        <span class="bike-spec"><i class="fas fa-map-marker-alt"></i> ${bike.location.city}</span>
                    </div>
                    <div class="bike-actions">
                        <button class="btn btn-sm btn-outline wishlist-btn" data-bike-id="${bike._id}">
                            <i class="far fa-heart"></i> Wishlist
                        </button>
                        <button class="btn btn-sm btn-outline compare-btn" data-bike-id="${bike._id}">
                            <i class="fas fa-exchange-alt"></i> Compare
                        </button>
                        <a href="/bikes/${bike._id}" class="btn btn-sm btn-primary">View Details</a>
                    </div>
                </div>
            `;
            
            bikeListings.appendChild(bikeCard);
        });
        
        // Add event listeners to wishlist and compare buttons
        document.querySelectorAll('.wishlist-btn').forEach(btn => {
            btn.addEventListener('click', toggleWishlist);
        });
        
        document.querySelectorAll('.compare-btn').forEach(btn => {
            btn.addEventListener('click', toggleCompare);
        });
    };
    
    // Toggle wishlist
    const toggleWishlist = async (event) => {
        const bikeId = event.currentTarget.getAttribute('data-bike-id');
        const button = event.currentTarget;
        
        try {
            const response = await fetch('/api/account/wishlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ bikeId })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update wishlist');
            }
            
            const data = await response.json();
            
            // Update button UI
            if (data.added) {
                button.innerHTML = '<i class="fas fa-heart"></i> Wishlisted';
                button.classList.add('active');
                
                // Show toast notification
                showToast('Bike added to wishlist', 'success');
            } else {
                button.innerHTML = '<i class="far fa-heart"></i> Wishlist';
                button.classList.remove('active');
                
                // Show toast notification
                showToast('Bike removed from wishlist', 'info');
            }
            
        } catch (error) {
            console.error('Error updating wishlist:', error);
            showToast('Failed to update wishlist', 'error');
        }
    };
    
    // Toggle compare
    const toggleCompare = async (event) => {
        const bikeId = event.currentTarget.getAttribute('data-bike-id');
        const button = event.currentTarget;
        
        try {
            const response = await fetch('/api/account/compare', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ bikeId })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update comparison list');
            }
            
            const data = await response.json();
            
            // Update button UI
            if (data.added) {
                button.innerHTML = '<i class="fas fa-check"></i> Comparing';
                button.classList.add('active');
                
                // Show toast notification
                showToast('Bike added to comparison', 'success');
                
                // Update compare counter
                updateCompareCounter(data.count);
            } else {
                button.innerHTML = '<i class="fas fa-exchange-alt"></i> Compare';
                button.classList.remove('active');
                
                // Show toast notification
                showToast('Bike removed from comparison', 'info');
                
                // Update compare counter
                updateCompareCounter(data.count);
            }
            
        } catch (error) {
            console.error('Error updating comparison list:', error);
            showToast('Failed to update comparison list', 'error');
        }
    };
    
    // Update compare counter
    const updateCompareCounter = (count) => {
        const counter = document.getElementById('compare-counter');
        if (counter) {
            counter.textContent = count;
            
            if (count > 0) {
                counter.classList.remove('hidden');
                document.getElementById('compare-bikes-btn').classList.remove('hidden');
            } else {
                counter.classList.add('hidden');
                document.getElementById('compare-bikes-btn').classList.add('hidden');
            }
        }
    };
    
    // Show toast notification
    const showToast = (message, type = 'info') => {
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
                toast.remove();
            }, 300);
        }, 3000);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        });
    };
    
    // Event Listeners
    
    // Filter form submission
    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            currentFilters = applyFilters(this);
            loadBikes(1, currentFilters, currentSort, currentSearch);
        });
        
        // Reset filters
        const resetBtn = document.getElementById('reset-filters');
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                filterForm.reset();
                
                // Reset range sliders
                if (document.getElementById('price-range')) {
                    document.getElementById('price-range').noUiSlider.reset();
                }
                
                if (document.getElementById('year-range')) {
                    document.getElementById('year-range').noUiSlider.reset();
                }
                
                currentFilters = {};
                loadBikes(1, currentFilters, currentSort, currentSearch);
            });
        }
    }
    
    // Sort select change
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentSort = this.value;
            loadBikes(1, currentFilters, currentSort, currentSearch);
        });
    }
    
    // Search form submission
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            currentSearch = document.getElementById('search-input').value.trim();
            loadBikes(1, currentFilters, currentSort, currentSearch);
        });
    }
    
    // Load more button
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            if (currentPage < totalPages) {
                loadBikes(currentPage + 1, currentFilters, currentSort, currentSearch);
            }
        });
    }
    
    // Mobile filter toggle
    const mobileFilterToggle = document.getElementById('mobile-filter-toggle');
    const filterContainer = document.getElementById('filter-container');
    
    if (mobileFilterToggle && filterContainer) {
        mobileFilterToggle.addEventListener('click', function() {
            filterContainer.classList.toggle('active');
            document.body.classList.toggle('filter-open');
        });
        
        // Close filters when clicking outside
        document.addEventListener('click', function(e) {
            if (filterContainer.classList.contains('active') && 
                !filterContainer.contains(e.target) && 
                e.target !== mobileFilterToggle) {
                filterContainer.classList.remove('active');
                document.body.classList.remove('filter-open');
            }
        });
    }
    
    // Initialize - load bikes on page load
    loadBikes();
}); 