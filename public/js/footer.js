document.addEventListener('DOMContentLoaded', function() {
    // Back to Top Button
    const backToTopButton = document.getElementById('back-to-top');
    
    if (backToTopButton) {
        // Show/hide button based on scroll position
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        });
        
        // Scroll to top when clicked
        backToTopButton.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Newsletter Form
    const newsletterForm = document.querySelector('.newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            
            if (!email) {
                showAlert('Please enter your email address', 'warning');
                return;
            }
            
            if (!isValidEmail(email)) {
                showAlert('Please enter a valid email address', 'warning');
                return;
            }
            
            // AJAX request to subscribe
            fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert('Thank you for subscribing to our newsletter!', 'success');
                    emailInput.value = '';
                } else {
                    showAlert(data.message || 'Something went wrong. Please try again.', 'danger');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('Failed to subscribe. Please try again later.', 'danger');
            });
        });
    }
    
    // Validate email format
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Alert function
    function showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alert-container');
        
        if (!alertContainer) {
            console.error('Alert container not found');
            return;
        }
        
        const alertId = 'alert-' + Date.now();
        const alertHTML = `
            <div id="${alertId}" class="alert alert-${type}">
                <span>${message}</span>
                <button type="button" class="close-btn">&times;</button>
            </div>
        `;
        
        alertContainer.insertAdjacentHTML('beforeend', alertHTML);
        
        // Add event listener to close button
        const alertElement = document.getElementById(alertId);
        const closeButton = alertElement.querySelector('.close-btn');
        
        closeButton.addEventListener('click', function() {
            alertElement.remove();
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertElement && alertElement.parentNode) {
                alertElement.remove();
            }
        }, 5000);
    }
    
    // Social media sharing
    const socialLinks = document.querySelectorAll('.social-link[data-share]');
    
    socialLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const type = this.getAttribute('data-share');
            const url = encodeURIComponent(window.location.href);
            const title = encodeURIComponent(document.title);
            
            let shareUrl = '';
            
            switch(type) {
                case 'facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                    break;
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
                    break;
                case 'linkedin':
                    shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                    break;
                case 'pinterest':
                    const img = encodeURIComponent(document.querySelector('meta[property="og:image"]')?.content || '');
                    shareUrl = `https://pinterest.com/pin/create/button/?url=${url}&media=${img}&description=${title}`;
                    break;
                case 'whatsapp':
                    shareUrl = `https://api.whatsapp.com/send?text=${title} ${url}`;
                    break;
                default:
                    return;
            }
            
            window.open(shareUrl, '_blank', 'width=600,height=400');
        });
    });
}); 