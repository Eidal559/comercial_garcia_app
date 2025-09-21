/**
 * Logout Functionality
 * Handles user logout and session cleanup
 */

// Main logout function
function forceLogout() {
    console.log('🚪 Force logout called');
    
    if (confirm('Are you sure you want to logout?')) {
        console.log('User confirmed logout');
        
        try {
            // Method 1: Clear authentication through auth system
            if (window.authSystem && typeof window.authSystem.logout === 'function') {
                console.log('Using auth system logout');
                window.authSystem.logout();
            }
            
            // Method 2: Clear all localStorage
            localStorage.clear();
            console.log('localStorage cleared');
            
            // Method 3: Clear global variables
            window.app = null;
            window.inventoryManager = null;
            window.barcodeScanner = null;
            window.uiController = null;
            
            // Method 4: Reset UI
            const mainApp = document.getElementById('main-app');
            const loginOverlay = document.getElementById('login-overlay');
            
            if (mainApp) {
                mainApp.style.display = 'none';
                console.log('Main app hidden');
            }
            
            if (loginOverlay) {
                loginOverlay.style.display = 'block';
                console.log('Login shown');
                
                // Clear and focus login form
                const username = document.getElementById('username');
                const password = document.getElementById('password');
                const message = document.getElementById('login-message');
                
                if (username) username.value = '';
                if (password) password.value = '';
                if (message) message.textContent = '';
                
                // Focus username field
                setTimeout(() => {
                    if (username) username.focus();
                }, 100);
            }
            
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

// Setup logout button when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    function setupLogoutButton() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            // Remove any existing event listeners
            logoutBtn.removeAttribute('onclick');
            
            // Add click event listener
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Logout button clicked');
                forceLogout();
            });
            
            console.log('✅ Logout button setup complete');
        } else {
            console.log('⚠️ Logout button not found, retrying...');
            setTimeout(setupLogoutButton, 1000);
        }
    }
    
    // Setup logout button with multiple attempts
    setupLogoutButton();
    setTimeout(setupLogoutButton, 2000);
    setTimeout(setupLogoutButton, 5000);
});

// Make logout function globally available
window.forceLogout = forceLogout;
window.logout = forceLogout; // Alias for compatibility

console.log('✅ Logout functionality loaded');
