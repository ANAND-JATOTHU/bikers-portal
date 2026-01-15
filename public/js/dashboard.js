document.addEventListener('DOMContentLoaded', function() {
    // Tab navigation functionality
    const tabButtons = document.querySelectorAll('.dashboard-nav-item');
    const tabContents = document.querySelectorAll('.dashboard-tab-content');
    
    if (tabButtons.length && tabContents.length) {
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons and content tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Show corresponding tab content
                const tabId = this.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
                
                // Update URL hash without page reload
                history.pushState(null, null, `#${tabId}`);
            });
        });
        
        // Activate tab based on URL hash or default to first tab
        const hash = window.location.hash.substring(1);
        if (hash && document.getElementById(hash)) {
            document.querySelector(`[data-tab="${hash}"]`).click();
        } else {
            // Default to first tab
            tabButtons[0].click();
        }
    }
    
    // Handle delete bike functionality
    const deleteBikeBtns = document.querySelectorAll('.delete-bike-btn');
    
    if (deleteBikeBtns.length) {
        deleteBikeBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                
                const bikeId = this.getAttribute('data-bike-id');
                const bikeTitle = this.getAttribute('data-bike-title');
                
                if (confirm(`Are you sure you want to delete "${bikeTitle}"? This action cannot be undone.`)) {
                    fetch(`/bikes/${bikeId}/delete`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // Remove the bike card from the UI
                            const bikeCard = document.querySelector(`.bike-card[data-bike-id="${bikeId}"]`);
                            if (bikeCard) {
                                bikeCard.remove();
                                
                                // Show success message
                                showAlert('success', 'Motorcycle listing deleted successfully');
                                
                                // Update counts
                                updateBikeCounts();
                            }
                        } else {
                            showAlert('error', data.message || 'Failed to delete listing');
                        }
                    })
                    .catch(error => {
                        console.error('Error deleting bike:', error);
                        showAlert('error', 'An error occurred. Please try again.');
                    });
                }
            });
        });
    }
    
    // Handle mark as sold functionality
    const markSoldBtns = document.querySelectorAll('.mark-sold-btn');
    
    if (markSoldBtns.length) {
        markSoldBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                
                const bikeId = this.getAttribute('data-bike-id');
                const bikeTitle = this.getAttribute('data-bike-title');
                
                if (confirm(`Mark "${bikeTitle}" as sold? This will remove it from search results.`)) {
                    fetch(`/bikes/${bikeId}/sold`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // Update the bike card status
                            const bikeCard = document.querySelector(`.bike-card[data-bike-id="${bikeId}"]`);
                            if (bikeCard) {
                                bikeCard.querySelector('.bike-status').textContent = 'Sold';
                                bikeCard.classList.add('bike-sold');
                                
                                // Hide the mark as sold button
                                this.style.display = 'none';
                                
                                // Show success message
                                showAlert('success', 'Motorcycle marked as sold successfully');
                                
                                // Update counts
                                updateBikeCounts();
                            }
                        } else {
                            showAlert('error', data.message || 'Failed to update listing');
                        }
                    })
                    .catch(error => {
                        console.error('Error marking bike as sold:', error);
                        showAlert('error', 'An error occurred. Please try again.');
                    });
                }
            });
        });
    }
    
    // Handle service booking cancellation
    const cancelServiceBtns = document.querySelectorAll('.cancel-service-btn');
    
    if (cancelServiceBtns.length) {
        cancelServiceBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                
                const serviceId = this.getAttribute('data-service-id');
                const serviceType = this.getAttribute('data-service-type');
                
                if (confirm(`Cancel this ${serviceType} service booking? This action cannot be undone.`)) {
                    fetch(`/services/${serviceId}/cancel`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // Update the service card status
                            const serviceCard = document.querySelector(`.service-card[data-service-id="${serviceId}"]`);
                            if (serviceCard) {
                                serviceCard.querySelector('.service-status').textContent = 'Cancelled';
                                serviceCard.classList.add('service-cancelled');
                                
                                // Hide the cancel button
                                this.style.display = 'none';
                                
                                // Show success message
                                showAlert('success', 'Service booking cancelled successfully');
                            }
                        } else {
                            showAlert('error', data.message || 'Failed to cancel service booking');
                        }
                    })
                    .catch(error => {
                        console.error('Error cancelling service:', error);
                        showAlert('error', 'An error occurred. Please try again.');
                    });
                }
            });
        });
    }
    
    // Handle service booking status updates (for service providers)
    const updateServiceStatusBtns = document.querySelectorAll('.update-service-status');
    
    if (updateServiceStatusBtns.length) {
        updateServiceStatusBtns.forEach(btn => {
            btn.addEventListener('change', function() {
                const serviceId = this.getAttribute('data-service-id');
                const newStatus = this.value;
                
                fetch(`/services/${serviceId}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: newStatus })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Show success message
                        showAlert('success', `Service status updated to: ${newStatus}`);
                    } else {
                        // Reset select to previous value if update failed
                        this.value = this.getAttribute('data-current-status');
                        showAlert('error', data.message || 'Failed to update service status');
                    }
                })
                .catch(error => {
                    console.error('Error updating service status:', error);
                    // Reset select to previous value
                    this.value = this.getAttribute('data-current-status');
                    showAlert('error', 'An error occurred. Please try again.');
                });
            });
        });
    }
    
    // Follow/Unfollow seller functionality
    const followButtons = document.querySelectorAll('.follow-seller-btn');
    
    if (followButtons.length) {
        followButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const sellerId = this.getAttribute('data-seller-id');
                const isFollowing = this.classList.contains('following');
                const action = isFollowing ? 'unfollow' : 'follow';
                
                fetch(`/users/${sellerId}/${action}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Toggle button appearance
                        this.classList.toggle('following');
                        
                        if (isFollowing) {
                            this.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
                            showAlert('success', 'Unfollowed seller successfully');
                        } else {
                            this.innerHTML = '<i class="fas fa-user-check"></i> Following';
                            showAlert('success', 'Now following seller');
                        }
                    } else {
                        showAlert('error', data.message || 'Action failed');
                    }
                })
                .catch(error => {
                    console.error(`Error ${action}ing seller:`, error);
                    showAlert('error', 'An error occurred. Please try again.');
                });
            });
        });
    }
    
    // Update bike counts in dashboard
    function updateBikeCounts() {
        const availableCount = document.querySelectorAll('.bike-card:not(.bike-sold)').length;
        const soldCount = document.querySelectorAll('.bike-card.bike-sold').length;
        
        const availableCountEl = document.querySelector('.available-bikes-count');
        const soldCountEl = document.querySelector('.sold-bikes-count');
        
        if (availableCountEl) availableCountEl.textContent = availableCount;
        if (soldCountEl) soldCountEl.textContent = soldCount;
    }
    
    // Alert helper function
    function showAlert(type, message) {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <span>${message}</span>
            <button type="button" class="close-alert">&times;</button>
        `;
        
        alertContainer.appendChild(alert);
        
        // Auto-remove alert after 5 seconds
        setTimeout(() => {
            alert.classList.add('fade-out');
            setTimeout(() => {
                alertContainer.removeChild(alert);
            }, 500);
        }, 5000);
        
        // Close button functionality
        alert.querySelector('.close-alert').addEventListener('click', function() {
            alert.classList.add('fade-out');
            setTimeout(() => {
                alertContainer.removeChild(alert);
            }, 500);
        });
    }
}); 