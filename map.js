// MilesPe Advanced Map System with Real-Time Point Selection
document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('map')) return;
    
    let map = null;
    let pickupMarker = null;
    let destinationMarker = null;
    let routeLine = null;
    let pickupCircle = null;
    let destinationCircle = null;
    let mapClickMode = 'pickup';
    let isSelecting = false;

    // Initialize Hyderabad map
    function initMap() {
        // Hyderabad coordinates
        map = L.map('map').setView([17.3850, 78.4867], 13);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18,
        }).addTo(map);
        
        // Add scale
        L.control.scale().addTo(map);
        
        // Create initial markers
        createInitialMarkers();
        
        // Add custom controls
        addCustomControls();
        
        // Setup event listeners
        setupEventListeners();
    }

    function createInitialMarkers() {
        // Initial pickup (Hitech City)
        const pickupCoords = [17.4482, 78.3915];
        pickupMarker = L.marker(pickupCoords, {
            draggable: true,
            icon: createCustomIcon('pickup')
        }).addTo(map)
        .bindPopup('<b>Pickup Location</b><br>Hitech City, Hyderabad')
        .openPopup();
        
        // Initial destination (Secunderabad)
        const destCoords = [17.4399, 78.4983];
        destinationMarker = L.marker(destCoords, {
            draggable: true,
            icon: createCustomIcon('destination')
        }).addTo(map)
        .bindPopup('<b>Destination</b><br>Secunderabad Railway Station');
        
        // Create route line
        updateRouteLine();
        
        // Create selection circles
        pickupCircle = L.circle(pickupCoords, {
            color: '#3a86ff',
            fillColor: '#3a86ff',
            fillOpacity: 0.1,
            radius: 100
        }).addTo(map);
        
        destinationCircle = L.circle(destCoords, {
            color: '#8338ec',
            fillColor: '#8338ec',
            fillOpacity: 0.1,
            radius: 100
        }).addTo(map);
        
        // Setup marker drag events
        setupMarkerEvents();
    }

    function createCustomIcon(type) {
        const iconColor = type === 'pickup' ? '#3a86ff' : '#8338ec';
        const iconHtml = `
            <div style="
                background: ${iconColor};
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 18px;
                border: 3px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            ">
                <i class="fas fa-${type === 'pickup' ? 'map-marker-alt' : 'flag-checkered'}"></i>
            </div>
        `;
        
        return L.divIcon({
            html: iconHtml,
            className: 'custom-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
        });
    }

    function addCustomControls() {
        // Create control container
        const controlDiv = document.createElement('div');
        controlDiv.className = 'map-control';
        controlDiv.style.position = 'absolute';
        controlDiv.style.top = '10px';
        controlDiv.style.right = '10px';
        controlDiv.style.zIndex = '1000';
        controlDiv.style.background = 'white';
        controlDiv.style.padding = '15px';
        controlDiv.style.borderRadius = '10px';
        controlDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        controlDiv.style.minWidth = '250px';
        
        controlDiv.innerHTML = `
            <div class="selection-controls">
                <h4><i class="fas fa-mouse-pointer"></i> Select Points</h4>
                <div class="selection-buttons">
                    <button class="selection-btn active" data-mode="pickup">
                        <i class="fas fa-map-marker-alt"></i> Pickup
                    </button>
                    <button class="selection-btn" data-mode="destination">
                        <i class="fas fa-flag-checkered"></i> Destination
                    </button>
                </div>
                <div class="selection-info">
                    <p id="selectionModeInfo">Click on map to set pickup point</p>
                    <div class="coordinates">
                        <div>Pickup: <span id="pickupCoords">17.4482, 78.3915</span></div>
                        <div>Destination: <span id="destCoords">17.4399, 78.4983</span></div>
                    </div>
                </div>
            </div>
        `;
        
        document.querySelector('.map-container').appendChild(controlDiv);
        
        // Add button event listeners
        controlDiv.querySelectorAll('.selection-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const mode = this.dataset.mode;
                
                // Update active button
                controlDiv.querySelectorAll('.selection-btn').forEach(b => {
                    b.classList.remove('active');
                });
                this.classList.add('active');
                
                // Update selection mode
                setSelectionMode(mode);
            });
        });
    }

    function setSelectionMode(mode) {
        mapClickMode = mode;
        isSelecting = true;
        
        // Update info text
        const infoElement = document.getElementById('selectionModeInfo');
        if (infoElement) {
            infoElement.textContent = `Click on map to set ${mode} point`;
        }
        
        // Visual feedback
        map.getContainer().style.cursor = 'crosshair';
        
        // Reset after 30 seconds
        setTimeout(() => {
            if (isSelecting) {
                resetSelectionMode();
            }
        }, 30000);
    }

    function resetSelectionMode() {
        isSelecting = false;
        map.getContainer().style.cursor = '';
        
        const infoElement = document.getElementById('selectionModeInfo');
        if (infoElement) {
            infoElement.textContent = 'Click buttons above to select points';
        }
    }

    function setupEventListeners() {
        // Map click event for point selection
        map.on('click', function(e) {
            if (!isSelecting) return;
            
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            setPointOnMap(lat, lng, mapClickMode);
            
            // Update input fields
            reverseGeocode(lat, lng, mapClickMode);
            
            // Reset selection mode
            resetSelectionMode();
        });
        
        // Listen for input field changes to update map
        document.getElementById('pickup')?.addEventListener('input', function(e) {
            clearTimeout(window.geocodeTimeout);
            window.geocodeTimeout = setTimeout(() => {
                geocodeAddress(this.value, 'pickup');
            }, 1000);
        });
        
        document.getElementById('destination')?.addEventListener('input', function(e) {
            clearTimeout(window.geocodeTimeout);
            window.geocodeTimeout = setTimeout(() => {
                geocodeAddress(this.value, 'destination');
            }, 1000);
        });
    }

    function setupMarkerEvents() {
        // Pickup marker drag
        pickupMarker.on('dragend', function(e) {
            const coords = pickupMarker.getLatLng();
            updateCoordinates('pickup', coords.lat, coords.lng);
            updateRouteLine();
            updateCircle(pickupCircle, coords);
            reverseGeocode(coords.lat, coords.lng, 'pickup');
        });
        
        // Destination marker drag
        destinationMarker.on('dragend', function(e) {
            const coords = destinationMarker.getLatLng();
            updateCoordinates('destination', coords.lat, coords.lng);
            updateRouteLine();
            updateCircle(destinationCircle, coords);
            reverseGeocode(coords.lat, coords.lng, 'destination');
        });
    }

    function setPointOnMap(lat, lng, type) {
        if (type === 'pickup') {
            pickupMarker.setLatLng([lat, lng]);
            updateCircle(pickupCircle, [lat, lng]);
        } else {
            destinationMarker.setLatLng([lat, lng]);
            updateCircle(destinationCircle, [lat, lng]);
        }
        
        updateCoordinates(type, lat, lng);
        updateRouteLine();
    }

    function updateCoordinates(type, lat, lng) {
        const coordsElement = document.getElementById(`${type}Coords`);
        if (coordsElement) {
            coordsElement.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
    }

    function updateRouteLine() {
        if (routeLine) {
            map.removeLayer(routeLine);
        }
        
        const pickupCoords = pickupMarker.getLatLng();
        const destCoords = destinationMarker.getLatLng();
        
        // Calculate distance
        const distance = calculateDistance(pickupCoords, destCoords);
        document.getElementById('distance-value').textContent = distance.toFixed(1);
        
        // Update price
        triggerPriceCalculation(distance);
        
        // Create new route line
        routeLine = L.polyline([pickupCoords, destCoords], {
            color: '#FF6B35',
            weight: 5,
            opacity: 0.7,
            dashArray: '10, 10'
        }).addTo(map);
        
        // Fit bounds to show both markers
        map.fitBounds([pickupCoords, destCoords], {
            padding: [50, 50]
        });
    }

    function calculateDistance(point1, point2) {
        // Haversine formula for distance calculation
        const R = 6371; // Earth's radius in km
        const dLat = toRad(point2.lat - point1.lat);
        const dLon = toRad(point2.lng - point1.lng);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance;
    }

    function toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    function updateCircle(circle, coords) {
        circle.setLatLng(coords);
    }

    function triggerPriceCalculation(distance) {
        // Trigger price calculation
        const activeService = document.querySelector('.service-type.active')?.id;
        if (activeService && window.getServiceDetails) {
            const serviceDetails = window.getServiceDetails(activeService);
            if (window.calculateIndianPrice) {
                window.calculateIndianPrice(
                    distance,
                    serviceDetails.ratePerKm,
                    serviceDetails.minimumFare,
                    serviceDetails.baseFare
                );
            }
        }
    }

    // Geocode address to coordinates (simulated)
    async function geocodeAddress(address, fieldId) {
        if (!address || address.length < 3) return;
        
        // Simulated coordinates for Hyderabad landmarks
        const hyderabadLandmarks = {
            'hitech city': [17.4482, 78.3915],
            'secunderabad': [17.4399, 78.4983],
            'banjara hills': [17.4229, 78.4456],
            'jubilee hills': [17.4250, 78.4081],
            'gachibowli': [17.4400, 78.3498],
            'kukatpally': [17.4845, 78.4136],
            'miyapur': [17.4961, 78.3581],
            'begumpet': [17.4430, 78.4610],
            'ameerpet': [17.4370, 78.4480],
            'punjagutta': [17.4420, 78.4530],
            'himayatnagar': [17.4050, 78.4980],
            'malakpet': [17.3750, 78.5250],
            'dilsukhnagar': [17.3680, 78.5250],
            'lb nagar': [17.3500, 78.5580]
        };
        
        const addressLower = address.toLowerCase();
        let foundCoords = null;
        
        for (const [landmark, coords] of Object.entries(hyderabadLandmarks)) {
            if (addressLower.includes(landmark)) {
                foundCoords = coords;
                break;
            }
        }
        
        if (foundCoords) {
            const type = fieldId === 'pickup' ? 'pickup' : 'destination';
            setPointOnMap(foundCoords[0], foundCoords[1], type);
            
            // Show notification
            showNotification(`Location found: ${address}`, 'success');
        } else {
            showNotification('Location not found. Please click on map to select.', 'warning');
        }
    }

    // Reverse geocode coordinates to address (simulated)
    function reverseGeocode(lat, lng, type) {
        // Simulate reverse geocoding
        const hyderabadAreas = [
            { lat: 17.4482, lng: 78.3915, name: 'Hitech City' },
            { lat: 17.4399, lng: 78.4983, name: 'Secunderabad' },
            { lat: 17.4229, lng: 78.4456, name: 'Banjara Hills' },
            { lat: 17.4250, lng: 78.4081, name: 'Jubilee Hills' },
            { lat: 17.4400, lng: 78.3498, name: 'Gachibowli' }
        ];
        
        // Find nearest area
        let nearestArea = hyderabadAreas[0];
        let minDistance = Infinity;
        
        hyderabadAreas.forEach(area => {
            const distance = Math.sqrt(
                Math.pow(area.lat - lat, 2) + Math.pow(area.lng - lng, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                nearestArea = area;
            }
        });
        
        const address = `${nearestArea.name}, Hyderabad`;
        
        // Update input field
        const inputId = type === 'pickup' ? 'pickup' : 'destination';
        const inputField = document.getElementById(inputId);
        if (inputField) {
            inputField.value = address;
        }
    }

    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 1001;
            animation: slideIn 0.3s ease;
            border-left: 4px solid #FF6B35;
            max-width: 400px;
        `;
        
        if (type === 'success') {
            notification.style.borderLeftColor = '#38b000';
        } else if (type === 'warning') {
            notification.style.borderLeftColor = '#ffbe0b';
        }
        
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}" 
               style="color: ${type === 'success' ? '#38b000' : type === 'warning' ? '#ffbe0b' : '#FF6B35'}"></i>
            <span>${message}</span>
            <button class="close-notification" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;">&times;</button>
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

    // Initialize the map
    initMap();
    
    // Make functions available globally
    window.calculateDistance = calculateDistance;
    window.showNotification = showNotification;
});