/**
 * Utility functions for Bikers Portal
 */

/**
 * Format a number as currency with ₹ symbol
 * @param {number|string} amount - The amount to format
 * @param {string} currency - Currency symbol (default: ₹)
 * @return {string} Formatted currency string
 */
function formatCurrency(amount, currency = '₹') {
    const num = parseFloat(amount);
    if (isNaN(num)) return `${currency}0`;
    
    return `${currency}${num.toLocaleString('en-IN')}`;
}

/**
 * Debounce function to limit how often a function is called
 * @param {Function} func - The function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @return {Function} Debounced function
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit rate of function calls
 * @param {Function} func - The function to throttle
 * @param {number} limit - Limit in milliseconds
 * @return {Function} Throttled function
 */
function throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Get URL parameters as an object
 * @return {Object} Object containing URL parameters
 */
function getUrlParams() {
    const params = {};
    const searchParams = new URLSearchParams(window.location.search);
    
    for (const [key, value] of searchParams.entries()) {
        // Handle multiple values for the same key
        if (params[key]) {
            if (!Array.isArray(params[key])) {
                params[key] = [params[key]];
            }
            params[key].push(value);
        } else {
            params[key] = value;
        }
    }
    
    return params;
}

/**
 * Shows a notification/toast message
 * @param {string} message - The message to display
 * @param {string} type - Type of notification (success, error, info, warning)
 * @param {number} duration - Duration in milliseconds
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Create notification container if it doesn't exist
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Add icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Add visible class after a small delay for animation
    setTimeout(() => {
        notification.classList.add('visible');
    }, 10);
    
    // Setup close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        removeNotification(notification);
    });
    
    // Auto remove after duration
    const timeout = setTimeout(() => {
        removeNotification(notification);
    }, duration);
    
    // Stop timer when hovering
    notification.addEventListener('mouseenter', () => {
        clearTimeout(timeout);
    });
    
    // Restart timer when mouse leaves
    notification.addEventListener('mouseleave', () => {
        setTimeout(() => {
            removeNotification(notification);
        }, duration / 2);
    });
    
    // Helper to remove notification with animation
    function removeNotification(element) {
        element.classList.remove('visible');
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            
            // Remove container if empty
            if (container.children.length === 0) {
                document.body.removeChild(container);
            }
        }, 300); // Match this with CSS transition time
    }
}

/**
 * Generate star rating HTML
 * @param {number} rating - Rating value (0-5)
 * @param {number} max - Maximum rating (default: 5)
 * @return {string} HTML for star rating
 */
function generateStarRating(rating, max = 5) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = max - fullStars - (halfStar ? 1 : 0);
    
    let html = '<div class="star-rating">';
    
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
    
    html += `<span class="rating-value">${rating.toFixed(1)}</span></div>`;
    
    return html;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncating
 * @return {string} Truncated text
 */
function truncateText(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength) + '...';
}

/**
 * Format date as a human-readable string
 * @param {string|Date} date - Date to format
 * @param {boolean} includeTime - Whether to include time
 * @return {string} Formatted date string
 */
function formatDate(date, includeTime = false) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    
    return d.toLocaleDateString('en-IN', options);
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @return {string} Relative time string
 */
function formatRelativeTime(date) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const now = new Date();
    const diffMs = now - d;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffMonth / 12);
    
    if (diffSec < 60) {
        return diffSec === 1 ? '1 second ago' : `${diffSec} seconds ago`;
    } else if (diffMin < 60) {
        return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
    } else if (diffHour < 24) {
        return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
    } else if (diffDay < 30) {
        return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
    } else if (diffMonth < 12) {
        return diffMonth === 1 ? '1 month ago' : `${diffMonth} months ago`;
    } else {
        return diffYear === 1 ? '1 year ago' : `${diffYear} years ago`;
    }
}

/**
 * Validate form fields
 * @param {HTMLFormElement} form - Form element to validate
 * @param {Object} customValidations - Custom validation functions 
 * @return {boolean} Whether the form is valid
 */
function validateForm(form, customValidations = {}) {
    let isValid = true;
    const errors = {};
    
    // Get all form elements
    const elements = form.elements;
    
    // Reset previous errors
    form.querySelectorAll('.error-message').forEach(el => el.remove());
    form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    
    // Check each field
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        
        // Skip buttons and fieldsets
        if (element.type === 'submit' || element.type === 'button' || element.tagName === 'FIELDSET') {
            continue;
        }
        
        // Skip if no name attribute
        if (!element.name) {
            continue;
        }
        
        // Check for required fields
        if (element.required && !element.value.trim()) {
            errors[element.name] = 'This field is required';
            isValid = false;
        }
        
        // Check for custom validations
        if (customValidations[element.name] && element.value.trim()) {
            const validate = customValidations[element.name];
            const result = validate(element.value.trim());
            
            if (result !== true) {
                errors[element.name] = result;
                isValid = false;
            }
        }
        
        // Check HTML5 validation
        if (element.validity && !element.validity.valid) {
            // Get validation message
            let message = element.validationMessage;
            
            // Override with custom message if available
            if (element.validity.valueMissing) {
                message = 'This field is required';
            } else if (element.validity.typeMismatch) {
                if (element.type === 'email') {
                    message = 'Please enter a valid email address';
                } else if (element.type === 'url') {
                    message = 'Please enter a valid URL';
                }
            } else if (element.validity.tooShort) {
                message = `Minimum length is ${element.minLength} characters`;
            } else if (element.validity.tooLong) {
                message = `Maximum length is ${element.maxLength} characters`;
            } else if (element.validity.rangeUnderflow) {
                message = `Minimum value is ${element.min}`;
            } else if (element.validity.rangeOverflow) {
                message = `Maximum value is ${element.max}`;
            } else if (element.validity.patternMismatch) {
                message = element.title || 'Please match the requested format';
            }
            
            errors[element.name] = message;
            isValid = false;
        }
    }
    
    // Show error messages
    for (const field in errors) {
        const element = form.querySelector(`[name="${field}"]`);
        if (!element) continue;
        
        // Find the form group
        const formGroup = element.closest('.form-group') || element.parentNode;
        formGroup.classList.add('error');
        
        // Create error message
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = errors[field];
        
        // Add after the field or after the label
        const label = formGroup.querySelector('label');
        if (label && label.nextSibling) {
            formGroup.insertBefore(errorEl, label.nextSibling.nextSibling);
        } else {
            formGroup.appendChild(errorEl);
        }
    }
    
    return isValid;
}

/**
 * Setup lazy loading for images
 */
function setupLazyLoading() {
    // Use Intersection Observer if available
    if ('IntersectionObserver' in window) {
        const lazyImageObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const lazyImage = entry.target;
                    lazyImage.src = lazyImage.dataset.src;
                    lazyImage.classList.remove('lazy-image');
                    lazyImageObserver.unobserve(lazyImage);
                }
            });
        });
        
        document.querySelectorAll('img.lazy-image').forEach((img) => {
            lazyImageObserver.observe(img);
        });
    } else {
        // Fallback for browsers that don't support Intersection Observer
        // Load all images immediately
        document.querySelectorAll('img.lazy-image').forEach((img) => {
            img.src = img.dataset.src;
            img.classList.remove('lazy-image');
        });
    }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @return {Promise} Promise that resolves when copy is complete
 */
function copyToClipboard(text) {
    // Use Clipboard API if available
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text).then(() => {
            return true;
        }).catch(() => {
            return false;
        });
    } else {
        // Fallback for older browsers
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return Promise.resolve(true);
        } catch (err) {
            return Promise.resolve(false);
        }
    }
}

/**
 * Generate a random ID
 * @param {number} length - Length of the ID
 * @return {string} Random ID
 */
function generateId(length = 10) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
}

/**
 * Setup tooltips
 * @param {string} selector - CSS selector for tooltip elements
 */
function setupTooltips(selector = '[data-tooltip]') {
    document.querySelectorAll(selector).forEach(el => {
        el.addEventListener('mouseenter', showTooltip);
        el.addEventListener('mouseleave', hideTooltip);
        el.addEventListener('focus', showTooltip);
        el.addEventListener('blur', hideTooltip);
    });

    function showTooltip() {
        // Remove any existing tooltips
        hideAllTooltips();
        
        const text = this.dataset.tooltip;
        if (!text) return;
        
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const rect = this.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top = rect.top - tooltipRect.height - 10;
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        
        // Make sure tooltip stays within viewport
        if (top < 10) {
            top = rect.bottom + 10;
            tooltip.classList.add('tooltip-bottom');
        }
        
        if (left < 10) {
            left = 10;
        }
        
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        
        tooltip.style.top = `${top + window.scrollY}px`;
        tooltip.style.left = `${left}px`;
        
        // Show tooltip
        setTimeout(() => {
            tooltip.classList.add('visible');
        }, 10);
    }

    function hideTooltip() {
        document.querySelectorAll('.tooltip.visible').forEach(tooltip => {
            tooltip.classList.remove('visible');
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            }, 300);
        });
    }

    function hideAllTooltips() {
        document.querySelectorAll('.tooltip').forEach(tooltip => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        });
    }
}

/**
 * Add functionality to toggle password visibility
 */
function setupPasswordToggles() {
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.previousElementSibling;
            if (!input || input.type !== 'password' && input.type !== 'text') return;
            
            if (input.type === 'password') {
                input.type = 'text';
                this.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                input.type = 'password';
                this.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    });
}

/**
 * Initialize when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    setupLazyLoading();
    setupTooltips();
    setupPasswordToggles();
    
    // Initialize any compare buttons based on localStorage
    const compareList = JSON.parse(localStorage.getItem('compareList') || '[]');
    const compareButton = document.getElementById('compare-bikes-btn');
    
    if (compareButton && compareList.length >= 2) {
        compareButton.style.display = 'flex';
        compareButton.querySelector('.count').textContent = compareList.length;
    }
    
    // Check compare checkboxes
    if (compareList.length > 0) {
        compareList.forEach(bikeId => {
            const checkbox = document.getElementById(`compare-${bikeId}`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }
}); 