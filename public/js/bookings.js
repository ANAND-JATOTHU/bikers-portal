document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const bookingTabs = document.querySelectorAll('.booking-tab');
  const bookingsContainer = document.getElementById('bookings-container');
  const cancelModal = document.getElementById('cancel-modal');
  const viewModal = document.getElementById('view-booking-modal');
  const confirmCancelBtn = document.getElementById('confirm-cancel');
  
  let activeTab = 'all';
  let bookings = [];
  let selectedBookingId = null;
  
  // Initialize
  loadBookings();
  
  // Event listeners
  if (bookingTabs) {
    bookingTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const status = this.dataset.status;
        setActiveTab(status);
        filterBookings(status);
      });
    });
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      closeAllModals();
    }
  });
  
  // Close modal when clicking the close button
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });
  
  // Cancel booking confirmation
  if (confirmCancelBtn) {
    confirmCancelBtn.addEventListener('click', function() {
      if (selectedBookingId) {
        cancelBooking(selectedBookingId);
      }
    });
  }
  
  // Functions
  function loadBookings() {
    showLoading();
    
    fetch('/api/bookings')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        hideLoading();
        
        if (data.success && data.bookings) {
          bookings = data.bookings;
          filterBookings(activeTab);
        } else {
          showNoBookings();
        }
      })
      .catch(error => {
        console.error('Error fetching bookings:', error);
        hideLoading();
        showError('Failed to load bookings. Please try again later.');
      });
  }
  
  function filterBookings(status) {
    if (!bookings.length) {
      showNoBookings();
      return;
    }
    
    let filteredBookings;
    
    if (status === 'all') {
      filteredBookings = bookings;
    } else if (status === 'active') {
      filteredBookings = bookings.filter(booking => 
        ['pending', 'confirmed'].includes(booking.status));
    } else if (status === 'completed') {
      filteredBookings = bookings.filter(booking => 
        booking.status === 'completed');
    } else if (status === 'cancelled') {
      filteredBookings = bookings.filter(booking => 
        ['cancelled', 'declined'].includes(booking.status));
    } else {
      filteredBookings = bookings.filter(booking => 
        booking.status === status);
    }
    
    if (filteredBookings.length) {
      renderBookings(filteredBookings);
    } else {
      showNoFilteredBookings(status);
    }
  }
  
  function renderBookings(bookingsList) {
    bookingsContainer.innerHTML = '';
    
    const bookingCards = document.createElement('div');
    bookingCards.className = 'booking-cards';
    
    bookingsList.forEach(booking => {
      const bookingCard = document.createElement('div');
      bookingCard.className = 'booking-card';
      
      const bookingDate = new Date(booking.bookingDate);
      const formattedDate = bookingDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      
      const formattedTime = bookingDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const statusClass = `status-${booking.status.toLowerCase()}`;
      const imageUrl = booking.service.images && booking.service.images.length > 0 
        ? booking.service.images[0] 
        : '/images/placeholder.jpg';
      
      bookingCard.innerHTML = `
        <div class="booking-card-header">
          <div class="booking-service-name">${booking.service.title}</div>
          <div class="booking-status ${statusClass}">${capitalizeFirstLetter(booking.status)}</div>
        </div>
        <div class="booking-card-body">
          <div class="booking-info">
            <div class="booking-info-item">
              <div class="booking-info-label">Provider:</div>
              <div class="booking-info-value">${booking.provider.company || booking.provider.username}</div>
            </div>
            <div class="booking-info-item">
              <div class="booking-info-label">Date:</div>
              <div class="booking-info-value">${formattedDate}</div>
            </div>
            <div class="booking-info-item">
              <div class="booking-info-label">Time:</div>
              <div class="booking-info-value">${formattedTime}</div>
            </div>
            <div class="booking-info-item">
              <div class="booking-info-label">Price:</div>
              <div class="booking-info-value">₹${booking.price.toFixed(2)}</div>
            </div>
          </div>
        </div>
        <div class="booking-card-footer">
          <button class="booking-action-btn btn-secondary view-booking" data-id="${booking._id}">View Details</button>
          ${booking.status === 'pending' || booking.status === 'confirmed' ? 
            `<button class="booking-action-btn btn-danger cancel-booking" data-id="${booking._id}">Cancel</button>` 
            : 
            booking.status === 'completed' && !booking.reviewSubmitted ? 
              `<button class="booking-action-btn btn-primary leave-review" data-id="${booking._id}">Leave Review</button>` 
              : ''
          }
        </div>
      `;
      
      bookingCards.appendChild(bookingCard);
    });
    
    bookingsContainer.appendChild(bookingCards);
    
    // Add event listeners to buttons
    document.querySelectorAll('.view-booking').forEach(btn => {
      btn.addEventListener('click', function() {
        const bookingId = this.dataset.id;
        viewBookingDetails(bookingId);
      });
    });
    
    document.querySelectorAll('.cancel-booking').forEach(btn => {
      btn.addEventListener('click', function() {
        const bookingId = this.dataset.id;
        showCancelModal(bookingId);
      });
    });
    
    document.querySelectorAll('.leave-review').forEach(btn => {
      btn.addEventListener('click', function() {
        const bookingId = this.dataset.id;
        const booking = bookings.find(b => b._id === bookingId);
        window.location.href = `/services/${booking.service._id}?review=true`;
      });
    });
  }
  
  function viewBookingDetails(bookingId) {
    fetch(`/api/bookings/${bookingId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data.success && data.booking) {
          const booking = data.booking;
          
          // Format date and time
          const bookingDate = new Date(booking.bookingDate);
          const formattedDate = bookingDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
          
          const formattedTime = bookingDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          // Populate modal with booking details
          const modalBody = viewModal.querySelector('.modal-body');
          modalBody.innerHTML = `
            <div class="booking-details">
              <div class="booking-detail-header">
                <img src="${booking.service.images && booking.service.images.length > 0 ? booking.service.images[0] : '/images/placeholder.jpg'}" alt="${booking.service.title}">
                <div>
                  <h4>${booking.service.title}</h4>
                  <div class="booking-status status-${booking.status.toLowerCase()}">${capitalizeFirstLetter(booking.status)}</div>
                </div>
              </div>
              
              <div class="booking-detail-section">
                <h5>Booking Information</h5>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${formattedDate}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Time:</span>
                    <span class="detail-value">${formattedTime}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Price:</span>
                    <span class="detail-value">₹${booking.price.toFixed(2)}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">${capitalizeFirstLetter(booking.status)}</span>
                  </div>
                </div>
              </div>
              
              <div class="booking-detail-section">
                <h5>Service Provider</h5>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${booking.provider.company || booking.provider.username}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${booking.provider.email || 'N/A'}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">${booking.provider.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div class="booking-detail-section">
                <h5>Service Location</h5>
                <div class="detail-grid">
                  <div class="detail-item full-width">
                    <span class="detail-label">Address:</span>
                    <span class="detail-value">${booking.service.location.address || 'N/A'}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">City:</span>
                    <span class="detail-value">${booking.service.location.city || 'N/A'}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">State:</span>
                    <span class="detail-value">${booking.service.location.state || 'N/A'}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Zip:</span>
                    <span class="detail-value">${booking.service.location.zipCode || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              ${booking.notes ? `
                <div class="booking-detail-section">
                  <h5>Notes</h5>
                  <p>${booking.notes}</p>
                </div>
              ` : ''}
            </div>
          `;
          
          // Show modal
          viewModal.style.display = 'flex';
        } else {
          showAlert('error', 'Failed to load booking details.');
        }
      })
      .catch(error => {
        console.error('Error fetching booking details:', error);
        showAlert('error', 'Failed to load booking details. Please try again later.');
      });
  }
  
  function showCancelModal(bookingId) {
    selectedBookingId = bookingId;
    if (cancelModal) {
      cancelModal.style.display = 'flex';
    }
  }
  
  function cancelBooking(bookingId) {
    fetch(`/api/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        closeAllModals();
        
        if (data.success) {
          showAlert('success', 'Booking cancelled successfully.');
          
          // Update booking status in local array
          const bookingIndex = bookings.findIndex(b => b._id === bookingId);
          if (bookingIndex !== -1) {
            bookings[bookingIndex].status = 'cancelled';
            bookings[bookingIndex].cancelledAt = new Date();
          }
          
          // Refresh displayed bookings
          filterBookings(activeTab);
        } else {
          showAlert('error', data.message || 'Failed to cancel booking.');
        }
      })
      .catch(error => {
        closeAllModals();
        console.error('Error cancelling booking:', error);
        showAlert('error', 'Failed to cancel booking. Please try again later.');
      });
  }
  
  function setActiveTab(status) {
    activeTab = status;
    
    bookingTabs.forEach(tab => {
      if (tab.dataset.status === status) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }
  
  function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.style.display = 'none';
    });
    selectedBookingId = null;
  }
  
  function showNoBookings() {
    bookingsContainer.innerHTML = `
      <div class="no-bookings">
        <h3>You don't have any bookings yet</h3>
        <p>Book a service to get started!</p>
        <a href="/services" class="btn">Find Services</a>
      </div>
    `;
  }
  
  function showNoFilteredBookings(status) {
    let message = 'No bookings found for this filter.';
    
    if (status === 'active') {
      message = 'You have no active bookings.';
    } else if (status === 'completed') {
      message = 'You have no completed bookings.';
    } else if (status === 'cancelled') {
      message = 'You have no cancelled bookings.';
    }
    
    bookingsContainer.innerHTML = `
      <div class="no-bookings">
        <h3>${message}</h3>
        <a href="/services" class="btn">Find Services</a>
      </div>
    `;
  }
  
  function showLoading() {
    bookingsContainer.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading bookings...</p>
      </div>
    `;
  }
  
  function hideLoading() {
    const loadingIndicator = bookingsContainer.querySelector('.loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
  }
  
  function showError(message) {
    bookingsContainer.innerHTML = `
      <div class="alert alert-error">
        ${message}
      </div>
    `;
  }
  
  function showAlert(type, message) {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    alertContainer.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      alert.classList.add('alert-fade-out');
      setTimeout(() => {
        alert.remove();
      }, 300);
    }, 5000);
  }
  
  // Helper functions
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}); 