// MilesPe Hyderabad - Main JavaScript File
// Load auth system if not already loaded
if (typeof auth === 'undefined') {
    // Try to load from localStorage
    const savedUser = localStorage.getItem('milespe_user');
    window.currentUser = savedUser ? JSON.parse(savedUser) : null;
}

// Update UI based on login status
function updateAuthUI() {
    const userMenu = document.getElementById('userMenu');
    const loginBtn = document.querySelector('.login-btn-nav');
    const user = window.currentUser || (typeof auth !== 'undefined' ? auth.getCurrentUser() : null);
    
    if (user && userMenu) {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = user.name ? user.name.split(' ')[0] : 'User';
        }
        userMenu.style.display = 'flex';
        if (loginBtn) loginBtn.style.display = 'none';
        
        // Add logout event
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn && !logoutBtn.hasEventListener) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                localStorage.removeItem('milespe_user');
                window.currentUser = null;
                if (typeof auth !== 'undefined') auth.logout();
                window.location.reload();
            });
            logoutBtn.hasEventListener = true;
        }
    } else if (userMenu && loginBtn) {
        userMenu.style.display = 'none';
        loginBtn.style.display = 'flex';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Update auth UI
    updateAuthUI();
    
    // Check if we need to redirect from login
    if (window.location.pathname.includes('login.html') && window.currentUser) {
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 100);
    }
    
    // Only run main functions if on index page
    if (document.getElementById('map')) {
        // Setup service type selection
        setupServiceSelection();
        
        // Setup calculate button
        setupCalculateButton();
        
        // Setup booking confirmation
        setupBookingConfirmation();
        
        // Initialize default calculation
        setTimeout(initDefaultCalculation, 100);
    }
});

// Setup service type selection
function setupServiceSelection() {
    const serviceTypes = document.querySelectorAll('.service-type');
    
    serviceTypes.forEach(type => {
        type.addEventListener('click', function() {
            // Remove active class from all
            serviceTypes.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked
            this.classList.add('active');
            
            // Update UI based on selected service
            updateServiceDetails(this.id);
        });
    });
}

// Update service details when service type changes
function updateServiceDetails(serviceId) {
    const vehicleTypeElement = document.getElementById('vehicle-type');
    const rateValueElement = document.getElementById('rate-value');
    
    let serviceName, ratePerKm, minimumFare, baseFare;
    
    switch(serviceId) {
        case 'taxi-service':
            serviceName = 'Taxi';
            ratePerKm = 12;      // ₹12/km
            minimumFare = 40;    // ₹40 minimum
            baseFare = 30;       // ₹30 base
            break;
        case 'bike-service':
            serviceName = 'Bike';
            ratePerKm = 8;       // ₹8/km
            minimumFare = 25;    // ₹25 minimum
            baseFare = 20;       // ₹20 base
            break;
        case 'courier-service':
            serviceName = 'Courier';
            ratePerKm = 10;      // ₹10/km
            minimumFare = 30;    // ₹30 minimum
            baseFare = 25;       // ₹25 base
            break;
        default:
            serviceName = 'Taxi';
            ratePerKm = 12;
            minimumFare = 40;
            baseFare = 30;
    }
    
    // Update UI
    vehicleTypeElement.textContent = serviceName;
    rateValueElement.textContent = `₹${ratePerKm}/km`;
    
    // Recalculate price if distance is already calculated
    const currentDistance = parseFloat(document.getElementById('distance-value').textContent);
    if (currentDistance) {
        calculateIndianPrice(currentDistance, ratePerKm, minimumFare, baseFare);
    }
}

// Setup calculate button
function setupCalculateButton() {
    const calculateBtn = document.getElementById('calculate-btn');
    if (!calculateBtn) return;
    
    calculateBtn.addEventListener('click', function() {
        // Show loading state
        const originalText = calculateBtn.innerHTML;
        calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculating Hyderabad Route...';
        calculateBtn.disabled = true;
        
        // Get pickup and destination values
        const pickup = document.getElementById('pickup').value;
        const destination = document.getElementById('destination').value;
        
        // Validate inputs
        if (!pickup || !destination) {
            showNotification('Please enter both pickup and destination locations in Hyderabad.', 'warning');
            resetCalculateButton(calculateBtn, originalText);
            return;
        }
        
        // Check if locations contain "Hyderabad" (basic validation)
        if (!pickup.toLowerCase().includes('hyderabad') && !destination.toLowerCase().includes('hyderabad')) {
            if (!confirm('Both locations don\'t mention Hyderabad. Are you sure these are Hyderabad locations?')) {
                resetCalculateButton(calculateBtn, originalText);
                return;
            }
        }
        
        // Simulate API call delay
        setTimeout(() => {
            // For Hyderabad, typical distances: 3-15 km
            const randomDistance = (Math.random() * 12 + 3).toFixed(1);
            const activeService = document.querySelector('.service-type.active').id;
            
            // Get service details
            const serviceDetails = getServiceDetails(activeService);
            
            // Update distance and price
            document.getElementById('distance-value').textContent = randomDistance;
            calculateIndianPrice(
                parseFloat(randomDistance),
                serviceDetails.ratePerKm,
                serviceDetails.minimumFare,
                serviceDetails.baseFare
            );
            
            // Show success message
            showNotification(`Hyderabad route calculated: ${randomDistance} km. Estimated fare: ₹${(parseFloat(randomDistance) * serviceDetails.ratePerKm).toFixed(2)}`, 'success');
            
            // Reset button
            resetCalculateButton(calculateBtn, originalText);
        }, 1500);
    });
}

// Get service details for Indian pricing
function getServiceDetails(serviceId) {
    switch(serviceId) {
        case 'taxi-service':
            return { ratePerKm: 12, minimumFare: 40, baseFare: 30, name: 'Taxi' };
        case 'bike-service':
            return { ratePerKm: 8, minimumFare: 25, baseFare: 20, name: 'Bike' };
        case 'courier-service':
            return { ratePerKm: 10, minimumFare: 30, baseFare: 25, name: 'Courier' };
        default:
            return { ratePerKm: 12, minimumFare: 40, baseFare: 30, name: 'Taxi' };
    }
}

// Calculate Indian price with minimum fare and GST
function calculateIndianPrice(distance, ratePerKm, minimumFare, baseFare) {
    let basePrice;
    
    // Apply minimum fare logic (first 2 km included in minimum)
    if (distance <= 2) {
        basePrice = minimumFare;
    } else {
        // Base fare for first 2 km, then per km rate for additional distance
        basePrice = minimumFare + ((distance - 2) * ratePerKm);
    }
    
    // Calculate GST (5%)
    const gst = basePrice * 0.05;
    const totalPrice = basePrice + gst;
    
    // Update UI
    document.getElementById('price-value').textContent = basePrice.toFixed(2);
    document.getElementById('total-price').textContent = totalPrice.toFixed(2);
}

// Reset calculate button state
function resetCalculateButton(button, originalText) {
    setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
    }, 500);
}

// Setup booking confirmation
function setupBookingConfirmation() {
    const confirmButtons = document.querySelectorAll('.confirm-booking');
    
    confirmButtons.forEach(button => {
        button.addEventListener('click', function() {
            const pickup = document.getElementById('pickup').value;
            const destination = document.getElementById('destination').value;
            const serviceType = document.querySelector('.service-type.active').id.replace('-service', '');
            const price = document.getElementById('price-value').textContent;
            const totalPrice = document.getElementById('total-price').textContent;
            const distance = document.getElementById('distance-value').textContent;
            
            if (!pickup || !destination) {
                showNotification('Please calculate distance first before booking.', 'warning');
                return;
            }
            
            // Show booking confirmation modal
            showBookingConfirmationModal({
                pickup,
                destination,
                serviceType,
                price,
                totalPrice,
                distance,
                city: 'Hyderabad'
            });
        });
    });
}

// Show booking confirmation modal
function showBookingConfirmationModal(bookingDetails) {
    const modalHtml = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2>Confirm Your Booking in Hyderabad</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="booking-details">
                        <div class="detail-row">
                            <span class="detail-label">Service:</span>
                            <span class="detail-value">${bookingDetails.serviceType}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">From:</span>
                            <span class="detail-value">${bookingDetails.pickup}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">To:</span>
                            <span class="detail-value">${bookingDetails.destination}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Distance:</span>
                            <span class="detail-value">${bookingDetails.distance} km</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Base Fare:</span>
                            <span class="detail-value">₹${bookingDetails.price}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">GST (5%):</span>
                            <span class="detail-value">₹${(bookingDetails.totalPrice - bookingDetails.price).toFixed(2)}</span>
                        </div>
                        <div class="detail-row total">
                            <span class="detail-label">Total Amount:</span>
                            <span class="detail-value">₹${bookingDetails.totalPrice}</span>
                        </div>
                    </div>
                    <div class="indian-payment-options">
                        <p><i class="fas fa-rupee-sign"></i> Select Payment Method:</p>
                        <div class="payment-methods">
                            <label>
                                <input type="radio" name="payment" value="upi" checked>
                                <span>UPI (PhonePe, GPay, Paytm)</span>
                            </label>
                            <label>
                                <input type="radio" name="payment" value="cash">
                                <span>Cash (Pay to driver)</span>
                            </label>
                            <label>
                                <input type="radio" name="payment" value="card">
                                <span>Credit/Debit Card</span>
                            </label>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="modal-button cancel">Cancel</button>
                        <button class="modal-button confirm">Confirm & Book</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add event listeners to modal
    const modalOverlay = document.querySelector('.modal-overlay');
    const closeBtn = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.modal-button.cancel');
    const confirmBtn = document.querySelector('.modal-button.confirm');
    
    function closeModal() {
        document.body.removeChild(modalOverlay);
    }
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    confirmBtn.addEventListener('click', function() {
        const selectedPayment = document.querySelector('input[name="payment"]:checked').value;
        showNotification(`Booking confirmed for Hyderabad! Your ${selectedPayment.toUpperCase()} payment of ₹${bookingDetails.totalPrice} is processed. Driver will arrive shortly.`, 'success');
        closeModal();
    });
    
    // Close modal when clicking outside
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
        <button class="close-notification">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Add close button event
    notification.querySelector('.close-notification').addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Initialize default calculation for Hyderabad
function initDefaultCalculation() {
    const defaultDistance = 8.5;  // Typical Hyderabad distance
    const defaultRate = 12;       // ₹12/km for taxi
    const minimumFare = 40;       // ₹40 minimum
    const baseFare = 30;          // ₹30 base
    calculateIndianPrice(defaultDistance, defaultRate, minimumFare, baseFare);
}

// Make functions globally available for map.js
window.getServiceDetails = getServiceDetails;
window.calculateIndianPrice = calculateIndianPrice;
window.showNotification = showNotification;