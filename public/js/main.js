/**
 * Bikers Portal - Main JavaScript
 * Handles UI interactions, animations, and API requests
 */

document.addEventListener('DOMContentLoaded', function() {
    // Mobile navigation toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    
    if (mobileMenuToggle && navbarMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            navbarMenu.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });
    }
    
    // Dropdown functionality
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    if (dropdownToggles.length) {
        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const dropdown = this.closest('.dropdown') || this.parentElement;
                
                // Close other open dropdowns
                dropdownToggles.forEach(otherToggle => {
                    const otherDropdown = otherToggle.closest('.dropdown') || otherToggle.parentElement;
                    if (otherDropdown !== dropdown) {
                        otherDropdown.classList.remove('active');
                    }
                });
                
                // Toggle the clicked dropdown
                dropdown.classList.toggle('active');
            });
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', function(e) {
            dropdownToggles.forEach(toggle => {
                const dropdown = toggle.closest('.dropdown') || toggle.parentElement;
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove('active');
                }
            });
        });
    }
    
    // Add active class to current page menu item
    const currentLocation = window.location.pathname;
    const menuLinks = document.querySelectorAll('.menu-link');
    const dropdownItems = document.querySelectorAll('.dropdown-menu a');
    
    menuLinks.forEach(link => {
        if (link.getAttribute('href') === currentLocation) {
            link.classList.add('active');
        }
    });
    
    dropdownItems.forEach(item => {
        if (item.getAttribute('href') === currentLocation) {
            item.classList.add('active');
            const dropdown = item.closest('.dropdown');
            if (dropdown) {
                const dropdownToggle = dropdown.querySelector('.dropdown-toggle');
                if (dropdownToggle) {
                    dropdownToggle.classList.add('active');
                }
            }
        }
    });
    
    // Search functionality
    const searchForm = document.querySelector('.search-form');
    const searchInput = document.querySelector('.search-input');
    
    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', function(e) {
            if (searchInput.value.trim() === '') {
                e.preventDefault();
                searchInput.focus();
            }
        });
    }
    
    // Price range slider
    const priceRangeMin = document.getElementById('priceRangeMin');
    const priceRangeMax = document.getElementById('priceRangeMax');
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    
    if (priceRangeMin && priceRangeMax && priceMin && priceMax) {
        // Update input values when range sliders change
        priceRangeMin.addEventListener('input', function() {
            priceMin.value = this.value;
        });
        
        priceRangeMax.addEventListener('input', function() {
            priceMax.value = this.value;
        });
        
        // Update range sliders when input values change
        priceMin.addEventListener('change', function() {
            priceRangeMin.value = this.value;
        });
        
        priceMax.addEventListener('change', function() {
            priceRangeMax.value = this.value;
        });
    }
    
    // Year range slider
    const yearRangeMin = document.getElementById('yearRangeMin');
    const yearRangeMax = document.getElementById('yearRangeMax');
    const yearMin = document.getElementById('yearMin');
    const yearMax = document.getElementById('yearMax');
    
    if (yearRangeMin && yearRangeMax && yearMin && yearMax) {
        // Update input values when range sliders change
        yearRangeMin.addEventListener('input', function() {
            yearMin.value = this.value;
        });
        
        yearRangeMax.addEventListener('input', function() {
            yearMax.value = this.value;
        });
        
        // Update range sliders when input values change
        yearMin.addEventListener('change', function() {
            yearRangeMin.value = this.value;
        });
        
        yearMax.addEventListener('change', function() {
            yearRangeMax.value = this.value;
        });
    }
    
    // Filter collapse toggle
    const filterToggle = document.querySelector('.filter-toggle');
    const filterCollapse = document.querySelector('.filter-collapse');
    
    if (filterToggle && filterCollapse) {
        filterToggle.addEventListener('click', function() {
            filterCollapse.classList.toggle('show');
            filterToggle.classList.toggle('active');
        });
    }
    
    // Image gallery (for bike details page)
    const mainImage = document.querySelector('.main-image');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    if (mainImage && thumbnails.length) {
        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', function() {
                // Remove active class from all thumbnails
                thumbnails.forEach(thumb => thumb.classList.remove('active'));
                
                // Add active class to clicked thumbnail
                this.classList.add('active');
                
                // Update main image
                mainImage.src = this.getAttribute('data-image');
            });
    });
  }
  
  // Form validation
  const forms = document.querySelectorAll('.needs-validation');
  
    if (forms.length) {
    Array.from(forms).forEach(form => {
            form.addEventListener('submit', function(event) {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        
        form.classList.add('was-validated');
      }, false);
    });
  }
  
    // Password toggle (show/hide)
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    if (passwordToggles.length) {
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', function() {
                const passwordInput = this.previousElementSibling;
                
                // Toggle password visibility
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    this.innerHTML = '<i class="fas fa-eye-slash"></i>';
                } else {
                    passwordInput.type = 'password';
                    this.innerHTML = '<i class="fas fa-eye"></i>';
                }
      });
    });
  }
  
  // Scroll to top button
    const scrollToTopBtn = document.querySelector('.scroll-to-top');
  
    if (scrollToTopBtn) {
        window.addEventListener('scroll', function() {
      if (window.pageYOffset > 300) {
                scrollToTopBtn.classList.add('show');
      } else {
                scrollToTopBtn.classList.remove('show');
      }
    });
    
        scrollToTopBtn.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

    // Alert auto-dismiss
    const alerts = document.querySelectorAll('.alert');
    
    if (alerts.length) {
        alerts.forEach(alert => {
            // Add close button functionality
            const closeBtn = alert.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    alert.remove();
                });
            }
            
            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.classList.add('fade-out');
                    setTimeout(() => {
                        if (alert.parentNode) {
                            alert.remove();
                        }
                    }, 500);
                }
            }, 5000);
        });
    }
    
    // Lazy loading for images
    const lazyImages = document.querySelectorAll('img.lazy');
    
    if (lazyImages.length && 'IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const image = entry.target;
                    image.src = image.dataset.src;
                    if (image.dataset.srcset) {
                        image.srcset = image.dataset.srcset;
                    }
                    image.classList.remove('lazy');
                    imageObserver.unobserve(image);
                }
            });
        });
        
        lazyImages.forEach(image => {
            imageObserver.observe(image);
        });
    }
    
    // Contact form validation and submission
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
            if (!this.checkValidity()) {
                this.classList.add('was-validated');
                return;
            }
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            // Simulate form submission
            setTimeout(() => {
                // Reset form
                this.reset();
                this.classList.remove('was-validated');
                
                // Show success message
                const formMessage = document.getElementById('formMessage');
                formMessage.innerHTML = 'Message sent successfully! We will contact you soon.';
                formMessage.className = 'alert alert-success';
                formMessage.style.display = 'block';
                
                // Reset button
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                
                // Hide message after 5 seconds
                setTimeout(() => {
                    formMessage.style.display = 'none';
                }, 5000);
            }, 1500);
    });
  }

  // Add bikes page specific menu handling
  // Check if we're on the bikes page by looking for the bikes-nav-layout element
  const bikesNavLayout = document.querySelector('.bikes-nav-layout');
  
  if (bikesNavLayout) {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navbar = document.querySelector('.navbar');
    
    if (mobileMenuToggle && navbar) {
      mobileMenuToggle.addEventListener('click', function() {
        navbar.classList.toggle('mobile-menu-active');
        this.classList.toggle('active');
      });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
      if (navbar && navbar.classList.contains('mobile-menu-active')) {
        if (!navbar.contains(event.target) && event.target !== mobileMenuToggle) {
          navbar.classList.remove('mobile-menu-active');
          mobileMenuToggle.classList.remove('active');
        }
      }
    });
    
    // Handle bikes page specific navigation behavior
    const bikesNavLinks = document.querySelectorAll('.bikes-main-nav .nav-link');
    
    bikesNavLinks.forEach(link => {
      link.addEventListener('click', function() {
        // Add active class to clicked link
        bikesNavLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        
        // Close mobile menu when clicking on a link
        if (window.innerWidth <= 768 && navbar.classList.contains('mobile-menu-active')) {
          navbar.classList.remove('mobile-menu-active');
          mobileMenuToggle.classList.remove('active');
        }
      });
    });
  }
});

/**
 * Fetch featured bikes from API
 */
async function fetchFeaturedBikes() {
  const featuredBikesContainer = document.getElementById('featured-bikes');
  
  try {
    const response = await fetch('/bikes/featured');
    const data = await response.json();
    
    if (data.success && data.data.length > 0) {
      // Clear loading placeholder
      featuredBikesContainer.innerHTML = '';
      
      // Add bikes to container
      data.data.forEach(bike => {
        featuredBikesContainer.appendChild(createBikeCard(bike));
      });
    } else {
      featuredBikesContainer.innerHTML = '<p class="text-center">No featured bikes available.</p>';
    }
  } catch (error) {
    console.error('Fetch featured bikes error:', error);
    featuredBikesContainer.innerHTML = '<p class="text-center text-danger">Error loading bikes. Please try again later.</p>';
  }
}

/**
 * Create a bike card element
 * @param {Object} bike - Bike data
 * @returns {HTMLElement} - Bike card element
 */
function createBikeCard(bike) {
  const card = document.createElement('div');
  card.className = 'bike-card';
  
  card.innerHTML = `
    <div class="bike-card-image">
      <img src="${bike.images[0] || '/images/placeholder-bike.jpg'}" alt="${bike.title}">
    </div>
    <div class="bike-card-content">
      <h3>${bike.title}</h3>
      <div class="bike-price">₹${bike.price.toLocaleString()}</div>
      <div class="bike-meta">
        <div class="bike-location"><i class="fas fa-map-marker-alt"></i> ${bike.location.city}, ${bike.location.state}</div>
        <div class="bike-year">${bike.year}</div>
      </div>
      <div class="bike-details">
        <div class="bike-detail">
          <span>${bike.mileage} km</span>
          <small>Mileage</small>
        </div>
        <div class="bike-detail">
          <span>${bike.engineCapacity} cc</span>
          <small>Engine</small>
        </div>
        <div class="bike-detail">
          <span>${bike.condition}</span>
          <small>Condition</small>
        </div>
      </div>
      <div class="bike-actions">
        <a href="/bikes/${bike._id}" class="btn btn-primary btn-sm">View Details</a>
        <button class="btn btn-outline btn-sm add-to-favorites" data-id="${bike._id}">
          <i class="far fa-heart"></i>
        </button>
      </div>
    </div>
  `;
  
  return card;
}

/**
 * Create HTML for rating stars
 * @param {number} rating - Rating value (0-5)
 * @returns {string} - HTML for rating stars
 */
function createRatingStars(rating) {
  let starsHtml = '';
  
  // Full stars
  for (let i = 1; i <= Math.floor(rating); i++) {
    starsHtml += '<i class="fas fa-star"></i>';
  }
  
  // Half star
  if (rating % 1 >= 0.5) {
    starsHtml += '<i class="fas fa-star-half-alt"></i>';
  }
  
  // Empty stars
  for (let i = 1; i <= 5 - Math.ceil(rating); i++) {
    starsHtml += '<i class="far fa-star"></i>';
  }
  
  return starsHtml;
} 