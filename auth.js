// MilesPe Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Load user from localStorage
        const savedUser = localStorage.getItem('milespe_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUI();
        }

        // Check for login status on page load
        this.checkAuthStatus();
    }

    // Login with phone/password
    login(phone, password) {
        // Demo validation
        if (!phone || phone.length !== 10) {
            return { success: false, message: 'Please enter valid 10-digit phone number' };
        }

        if (!password || password.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters' };
        }

        // Demo users (in real app, this would be API call)
        const demoUsers = [
            { phone: '9876543210', password: '123456', name: 'Rahul Sharma', email: 'rahul@example.com', city: 'Hyderabad' },
            { phone: '9123456789', password: '123456', name: 'Priya Patel', email: 'priya@example.com', city: 'Hyderabad' }
        ];

        const user = demoUsers.find(u => u.phone === phone && u.password === password);
        
        if (user) {
            this.currentUser = {
                id: Date.now(),
                phone: user.phone,
                name: user.name,
                email: user.email,
                city: user.city,
                token: 'demo_token_' + Date.now(),
                joined: new Date().toISOString(),
                wallet: 500 // Demo wallet balance
            };

            // Save to localStorage
            localStorage.setItem('milespe_user', JSON.stringify(this.currentUser));
            
            // Update UI
            this.updateUI();
            
            return { success: true, message: 'Login successful!', user: this.currentUser };
        } else {
            return { success: false, message: 'Invalid phone number or password' };
        }
    }

    // Signup new user
    signup(userData) {
        const { name, phone, email, city, password, confirmPassword } = userData;

        // Validation
        if (!name || name.length < 2) {
            return { success: false, message: 'Please enter valid name' };
        }

        if (!phone || phone.length !== 10) {
            return { success: false, message: 'Please enter valid 10-digit phone number' };
        }

        if (password !== confirmPassword) {
            return { success: false, message: 'Passwords do not match' };
        }

        if (password.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters' };
        }

        // Check if user already exists
        const existingUsers = JSON.parse(localStorage.getItem('milespe_users') || '[]');
        if (existingUsers.some(u => u.phone === phone)) {
            return { success: false, message: 'Phone number already registered' };
        }

        // Create new user
        const newUser = {
            id: Date.now(),
            phone,
            name,
            email: email || '',
            city: city || 'Hyderabad',
            password, // In real app, this would be hashed
            token: 'demo_token_' + Date.now(),
            joined: new Date().toISOString(),
            wallet: 0,
            rides: []
        };

        // Save to localStorage
        existingUsers.push(newUser);
        localStorage.setItem('milespe_users', JSON.stringify(existingUsers));
        
        // Auto login
        this.currentUser = { ...newUser };
        delete this.currentUser.password; // Don't store password in current user
        localStorage.setItem('milespe_user', JSON.stringify(this.currentUser));
        
        // Update UI
        this.updateUI();
        
        return { success: true, message: 'Account created successfully!', user: this.currentUser };
    }

    // Logout
    logout() {
        this.currentUser = null;
        localStorage.removeItem('milespe_user');
        this.updateUI();
        
        // Redirect to home page if not already there
        if (!window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/')) {
            window.location.href = 'index.html';
        }
        
        return { success: true, message: 'Logged out successfully' };
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Update UI based on auth status
    updateUI() {
        const userMenu = document.getElementById('userMenu');
        const loginBtn = document.querySelector('.login-btn-nav');
        const userNameElement = document.getElementById('userName');
        
        if (this.isLoggedIn() && userMenu) {
            // Update user name
            if (userNameElement) {
                userNameElement.textContent = this.currentUser.name.split(' ')[0]; // First name only
            }
            
            // Show user menu, hide login button
            userMenu.style.display = 'flex';
            if (loginBtn) loginBtn.style.display = 'none';
            
            // Add logout event listener
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.onclick = (e) => {
                    e.preventDefault();
                    this.logout();
                    window.location.reload();
                };
            }
        } else if (userMenu && loginBtn) {
            // Show login button, hide user menu
            userMenu.style.display = 'none';
            loginBtn.style.display = 'flex';
        }
    }

    // Check auth status on page load
    checkAuthStatus() {
        const path = window.location.pathname;
        
        // If on login page and already logged in, redirect to home
        if (path.includes('login.html') && this.isLoggedIn()) {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 100);
        }
    }
}

// Initialize auth system
const auth = new AuthSystem();