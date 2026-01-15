document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const filterForm = document.getElementById('filter-form');
  const servicesGrid = document.getElementById('services-grid');
  const paginationContainer = document.getElementById('pagination');
  const noResultsContainer = document.getElementById('no-results');
  const searchInput = document.getElementById('search');
  const typeSelect = document.getElementById('type');
  const locationInput = document.getElementById('location');
  const minPriceInput = document.getElementById('min-price');
  const maxPriceInput = document.getElementById('max-price');
  const ratingSelect = document.getElementById('rating');
  const sortSelect = document.getElementById('sort');
  
  // Current state
  let currentPage = 1;
  let currentFilters = {};
  
  // Initialize
  loadServices();
  
  // Event listeners
  filterForm.addEventListener('submit', function(e) {
    e.preventDefault();
    currentPage = 1;
    updateFilters();
    loadServices();
  });
  
  filterForm.addEventListener('reset', function() {
    setTimeout(() => {
      currentPage = 1;
      currentFilters = {};
      loadServices();
    }, 0);
  });
  
  searchInput.addEventListener('input', debounce(function() {
    currentPage = 1;
    updateFilters();
    loadServices();
  }, 500));
  
  // Event listeners for select changes
  typeSelect.addEventListener('change', function() {
    currentPage = 1;
    updateFilters();
    loadServices();
  });
  
  sortSelect.addEventListener('change', function() {
    currentPage = 1;
    updateFilters();
    loadServices();
  });
  
  ratingSelect.addEventListener('change', function() {
    currentPage = 1;
    updateFilters();
    loadServices();
  });
  
  // Functions
  function updateFilters() {
    currentFilters = {
      search: searchInput.value.trim(),
      type: typeSelect.value,
      city: locationInput.value.trim(),
      minPrice: minPriceInput.value ? parseFloat(minPriceInput.value) : null,
      maxPrice: maxPriceInput.value ? parseFloat(maxPriceInput.value) : null,
      rating: ratingSelect.value,
      sort: sortSelect.value
    };
    
    // Remove empty filters
    Object.keys(currentFilters).forEach(key => {
      if (currentFilters[key] === null || currentFilters[key] === '' || currentFilters[key] === undefined) {
        delete currentFilters[key];
      }
    });
  }
  
  function loadServices() {
    showLoading();
    
    // Prepare URL with query parameters
    let url = '/api/services?page=' + currentPage;
    
    Object.keys(currentFilters).forEach(key => {
      url += `&${key}=${encodeURIComponent(currentFilters[key])}`;
    });
    
    // Fetch services from API
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        hideLoading();
        
        if (data.services && data.services.length > 0) {
          renderServices(data.services);
          renderPagination(data.pagination);
          noResultsContainer.style.display = 'none';
        } else {
          servicesGrid.innerHTML = '';
          paginationContainer.innerHTML = '';
          noResultsContainer.style.display = 'block';
        }
      })
      .catch(error => {
        console.error('Error fetching services:', error);
        hideLoading();
        showError('Failed to load services. Please try again later.');
      });
  }
  
  function renderServices(services) {
    servicesGrid.innerHTML = '';
    
    services.forEach(service => {
      const serviceCard = document.createElement('div');
      serviceCard.className = 'service-card';
      
      const imageUrl = service.images && service.images.length > 0 
        ? service.images[0] 
        : '/images/placeholder.jpg';
      
      const serviceType = service.serviceType.charAt(0).toUpperCase() + service.serviceType.slice(1);
      
      // Generate star rating HTML
      let starsHtml = '';
      const rating = Math.round(service.avgRating || 0);
      for (let i = 1; i <= 5; i++) {
        starsHtml += `<i class="${i <= rating ? 'fas' : 'far'} fa-star"></i>`;
      }
      
      serviceCard.innerHTML = `
        <div class="service-img-container">
          <img class="service-img" src="${imageUrl}" alt="${service.title}">
          <div class="service-type">${serviceType}</div>
        </div>
        <div class="service-content">
          <h3 class="service-title">${service.title}</h3>
          <div class="service-location">
            <i class="fas fa-map-marker-alt"></i>
            <span>${service.location.city}, ${service.location.state}</span>
          </div>
          <div class="service-description">
            ${service.description.substring(0, 100)}...
          </div>
          <div class="service-meta">
            <span><i class="fas fa-clock"></i> ${service.duration} mins</span>
            <span><i class="fas fa-users"></i> ${service.capacity} slots</span>
          </div>
          <div class="service-footer">
            <div class="service-price">₹${service.price.toFixed(2)}</div>
            <div class="service-rating">
              <div class="stars">${starsHtml}</div>
              <div class="count">(${service.reviewCount || 0})</div>
            </div>
          </div>
        </div>
      `;
      
      serviceCard.addEventListener('click', () => {
        window.location.href = `/services/${service._id}`;
      });
      
      servicesGrid.appendChild(serviceCard);
    });
  }
  
  function renderPagination(pagination) {
    if (!pagination) return;
    
    paginationContainer.innerHTML = '';
    
    if (pagination.pages <= 1) return;
    
    const ul = document.createElement('ul');
    ul.className = 'pagination-list';
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${pagination.page === 1 ? 'disabled' : ''}`;
    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevLink.href = '#';
    prevLink.addEventListener('click', function(e) {
      e.preventDefault();
      if (pagination.page > 1) {
        currentPage = pagination.page - 1;
        loadServices();
      }
    });
    prevLi.appendChild(prevLink);
    ul.appendChild(prevLi);
    
    // Page numbers
    let startPage = Math.max(1, pagination.page - 2);
    let endPage = Math.min(pagination.pages, pagination.page + 2);
    
    // Adjust range to show 5 pages when possible
    if (endPage - startPage < 4) {
      if (startPage === 1) {
        endPage = Math.min(5, pagination.pages);
      } else {
        startPage = Math.max(1, pagination.pages - 4);
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      const li = document.createElement('li');
      li.className = `page-item ${i === pagination.page ? 'active' : ''}`;
      const link = document.createElement('a');
      link.className = 'page-link';
      link.textContent = i;
      link.href = '#';
      link.addEventListener('click', function(e) {
        e.preventDefault();
        currentPage = i;
        loadServices();
      });
      li.appendChild(link);
      ul.appendChild(li);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${pagination.page === pagination.pages ? 'disabled' : ''}`;
    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextLink.href = '#';
    nextLink.addEventListener('click', function(e) {
      e.preventDefault();
      if (pagination.page < pagination.pages) {
        currentPage = pagination.page + 1;
        loadServices();
      }
    });
    nextLi.appendChild(nextLink);
    ul.appendChild(nextLi);
    
    paginationContainer.appendChild(ul);
  }
  
  function showLoading() {
    servicesGrid.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading services...</p>
      </div>
    `;
  }
  
  function hideLoading() {
    const loadingIndicator = servicesGrid.querySelector('.loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
  }
  
  function showError(message) {
    servicesGrid.innerHTML = `
      <div class="alert alert-error">
        ${message}
      </div>
    `;
  }
  
  // Utility function for debouncing
  function debounce(func, delay) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }
}); 