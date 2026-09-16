// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger) {
        const toggleMenu = function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            const isOpen = hamburger.classList.contains('active');
            hamburger.setAttribute('aria-expanded', isOpen);
            hamburger.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
        };

        hamburger.addEventListener('click', toggleMenu);
        hamburger.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleMenu();
            }
        });
    }
    
    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.setAttribute('aria-label', 'Open navigation menu');
        });
    });
    
    // Scroll Animations
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    
    animateElements.forEach(element => {
        observer.observe(element);
    });

    // Back to top button
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            backToTop.classList.toggle('visible', window.scrollY > 500);
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Scroll progress bar
    const scrollProgress = document.getElementById('scrollProgress');
    if (scrollProgress) {
        const updateScrollProgress = () => {
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
            scrollProgress.style.width = pct + '%';
        };
        window.addEventListener('scroll', throttle(updateScrollProgress, 16), { passive: true });
        updateScrollProgress();
    }

    // Auto-hide flash messages
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                alert.remove();
            }, 300);
        }, 5000);
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href.length < 2) return;

            const target = document.querySelector(href);
            if (!target) return;

            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            // Scrolling alone leaves focus behind, so keyboard users land back
            // at the top of the tab order instead of at the target.
            target.focus({ preventScroll: true });
        });
    });
    
    // Form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
            }
        });
    });
    
});

// Form Validation
function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            showError(input, 'This field is required');
            isValid = false;
        } else if (input.type === 'email' && !isValidEmail(input.value)) {
            showError(input, 'Please enter a valid email address');
            isValid = false;
        } else if (input.type === 'password' && input.value.length < 6) {
            showError(input, 'Password must be at least 6 characters');
            isValid = false;
        } else {
            removeError(input);
        }
    });
    
    return isValid;
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showError(input, message) {
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;
    let error = formGroup.querySelector('.error-message');

    if (!error) {
        error = document.createElement('span');
        error.classList.add('error-message');
        formGroup.appendChild(error);
    }

    error.textContent = message;
    input.classList.add('error');
}

function removeError(input) {
    const formGroup = input.closest('.form-group');
    if (formGroup) {
        const error = formGroup.querySelector('.error-message');
        if (error) {
            error.remove();
        }
    }
    input.classList.remove('error');
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy', 'error');
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
        <button class="alert-close">&times;</button>
        <div class="alert-progress" style="--dismiss-duration: 3s;"></div>
    `;
    
    const container = document.querySelector('.flash-messages');
    if (container) {
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
        
        notification.querySelector('.alert-close').addEventListener('click', () => {
            notification.remove();
        });
    }
}

// Throttle function for performance
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}


