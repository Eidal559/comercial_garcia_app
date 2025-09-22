/**
 * Fixed Logout Functionality
 * This replaces the existing logout.js file
 */

// Main logout function
function performLogout() {
    console.log('🚪 Logout initiated');
    
    if (confirm('Are you sure you want to logout?')) {
        console.log('User confirmed logout');
        
        try {
            // Method 1: Use auth system logout if available
            if (window.authSystem && typeof window.authSystem.logout === 'function') {
                console.log('Using auth system logout');
                window.authSystem.logout();
            }
            
            // Method 2: Clear all localStorage
            localStorage.clear();
            console.log('localStorage cleared');
            
            // Method 3: Clear session storage
            sessionStorage.clear();
            console.log('sessionStorage cleared');
            
            // Method 4: Destroy app instances
            if (window.app) {
                try {
                    window.app.destroy();
                } catch (e) {
                    console.log('App destroy error (non-critical):', e.message);
                }
                window.app = null;
            }
            
            // Clear global variables
            window.inventoryManager = null;
            window.barcodeScanner = null;
            window.uiController = null;
            window.authSystem = null;
            
            // Method 5: Reset UI immediately
            resetUIToLogin();
            
            console.log('✅ Logout completed successfully');
            
        } catch (error) {
            console.error('❌ Logout error:', error);
            // Last resort: reload page
            if (confirm('Logout failed. Reload page to reset?')) {
                window.location.reload();
            }
        }
    }
}

// Reset UI to login state
function resetUIToLogin() {
    // Hide main app
    const mainApp = document.getElementById('main-app');
    if (mainApp) {
        mainApp.style.display = 'none';
        console.log('Main app hidden');
    }
    
    // Show login overlay
    const loginOverlay = document.getElementById('login-overlay');
    if (loginOverlay) {
        loginOverlay.style.display = 'block';
        console.log('Login overlay shown');
        
        // Clear and reset login form
        const username = document.getElementById('username');
        const password = document.getElementById('password');
        const message = document.getElementById('login-message');
        
        if (username) {
            username.value = '';
            setTimeout(() => username.focus(), 100);
        }
        if (password) password.value = '';
        if (message) {
            message.textContent = '';
            message.style.color = '';
        }
    }
}

// Setup logout button event listener
function setupLogoutButton() {
    console.log('🔧 Setting up logout button...');
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        // Remove any existing event listeners
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        // Add fresh event listener
        newLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Logout button clicked');
            performLogout();
        });
        
        console.log('✅ Logout button setup complete');
        return true;
    } else {
        console.log('⚠️ Logout button not found');
        return false;
    }
}

// Initialize logout functionality
function initializeLogout() {
    // Try to setup logout button immediately
    if (!setupLogoutButton()) {
        // If not found, retry with delays
        setTimeout(() => {
            if (!setupLogoutButton()) {
                setTimeout(() => {
                    if (!setupLogoutButton()) {
                        setTimeout(setupLogoutButton, 5000); // Final attempt
                    }
                }, 2000);
            }
        }, 1000);
    }
}

// Setup when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLogout);
} else {
    initializeLogout();
}

// Also setup when main app is initialized
window.addEventListener('app-initialized', initializeLogout);

// Make logout function globally available
window.performLogout = performLogout;
window.logout = performLogout; // Alias for compatibility
window.forceLogout = performLogout; // Another alias
window.setupLogoutButton = setupLogoutButton;

console.log('✅ Fixed logout functionality loaded');
