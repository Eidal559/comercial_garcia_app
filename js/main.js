/**
 * Enhanced Main Application Initialization
 * This replaces your existing main.js file
 */

// Global variables
let app;
let authSystem;

// Initialize application when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🔐 Initializing Stockpile System...');
        
        // Initialize authentication system first
        authSystem = new AuthenticationSystem();
        window.authSystem = authSystem;
        
        // Setup login form handler
        setupLoginForm();
        
        // Check if user is already logged in
        if (authSystem.isUserAuthenticated()) {
            console.log('User already authenticated, showing main app');
            await showMainApplication();
        }
        
        console.log('✅ Authentication system initialized');
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showError('Application initialization error: ' + error.message);
    }
});

function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Focus username field
    setTimeout(() => {
        const usernameField = document.getElementById('username');
        if (usernameField) {
            usernameField.focus();
        }
    }, 100);
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('login-message');

    if (!username || !password) {
        messageDiv.textContent = 'Please complete all fields';
        messageDiv.style.color = '#e74c3c';
        return;
    }

    // Attempt authentication
    const result = authSystem.authenticate(username, password);
    
    if (result.success) {
        messageDiv.textContent = 'Access granted...';
        messageDiv.style.color = '#27ae60';
        
        // Hide login overlay and show main app after delay
        setTimeout(async () => {
            await showMainApplication();
        }, 1000);
        
    } else {
        messageDiv.textContent = result.message;
        messageDiv.style.color = '#e74c3c';
        
        // Clear password field
        document.getElementById('password').value = '';
    }
}

async function showMainApplication() {
    // Hide login and show main app
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    
    // Update user info
    const currentUser = authSystem.getCurrentUser();
    const userInfoElement = document.getElementById('current-user');
    if (userInfoElement) {
        userInfoElement.textContent = `👤 ${currentUser}`;
    }
    
    // Initialize the main application
    await initializeMainApp();
    
    // Setup logout functionality AFTER main app is ready
    setTimeout(() => {
        setupLogoutFunctionality();
    }, 500);
}

async function initializeMainApp() {
    try {
        // Initialize the main app
        app = new StockpileApp();
        await app.init();
        
        // Make instances globally accessible
        window.app = app;
        window.inventoryManager = app.inventoryManager;
        window.barcodeScanner = app.barcodeScanner;
        window.uiController = app.uiController;
        
        // Setup global functions
        setupGlobalFunctions();
        
        // Setup permission-based UI
        setupPermissionBasedUI();
        
        // Update session info
        updateSessionInfo();
        
        // Emit event that app is initialized
        window.dispatchEvent(new CustomEvent('app-initialized'));
        
        console.log('🎉 Main application initialized successfully');
        
    } catch (error) {
        console.error('Error initializing main app:', error);
        showError('Application initialization error: ' + error.message);
    }
}

function setupLogoutFunctionality() {
    console.log('🔧 Setting up logout functionality...');
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        // Remove any existing onclick attribute
        logoutBtn.removeAttribute('onclick');
        
        // Clone the button to remove all event listeners
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        // Add fresh event listener
        newLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Logout button clicked');
            handleLogout();
        });
        
        // Also make it work with window.performLogout if available
        if (window.performLogout) {
            newLogoutBtn.onclick = (e) => {
                e.preventDefault();
                window.performLogout();
            };
        }
        
        console.log('✅ Logout functionality setup complete');
    } else {
        console.error('❌ Logout button not found');
        // Retry after a delay
        setTimeout(setupLogoutFunctionality, 1000);
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        console.log('🚪 Performing logout...');
        
        try {
            // Use auth system logout
            if (authSystem) {
                authSystem.logout(false);
            }
            
            // Clear localStorage
            localStorage.clear();
            sessionStorage.clear();
            
            // Destroy app
            if (app) {
                try {
                    app.destroy();
                } catch (e) {
                    console.log('App destroy error (non-critical):', e.message);
                }
                app = null;
            }
            
            // Clear global variables
            window.app = null;
            window.inventoryManager = null;
            window.barcodeScanner = null;
            window.uiController = null;
            
            // Reset UI
            document.getElementById('main-app').style.display = 'none';
            document.getElementById('login-overlay').style.display = 'block';
            
            // Clear login form
            const username = document.getElementById('username');
            const password = document.getElementById('password');
            const message = document.getElementById('login-message');
            
            if (username) {
                username.value = '';
                setTimeout(() => username.focus(), 100);
            }
            if (password) password.value = '';
            if (message) {
                message.textContent = 'Logged out successfully';
                message.style.color = '#27ae60';
                setTimeout(() => {
                    message.textContent = '';
                }, 3000);
            }
            
            console.log('✅ Logout completed successfully');
            
        } catch (error) {
            console.error('❌ Logout error:', error);
            if (confirm('Logout failed. Reload page to reset?')) {
                window.location.reload();
            }
        }
    }
}

function setupGlobalFunctions() {
    // Permission check function
    window.checkPermission = (permission) => {
        const permissions = authSystem.getUserPermissions();
        return permissions[permission] || false;
    };
    
    // Inventory helper functions
    window.quickAdjust = async function(productId, action) {
        const actionText = action === 'add' ? 'add' : 'remove';
        const adjustment = prompt(`Enter quantity to ${actionText}:`);
        const quantity = parseInt(adjustment);
        
        if (isNaN(quantity) || quantity <= 0) return;

        try {
            const adjustmentValue = action === 'add' ? quantity : -quantity;
            if (window.inventoryManager) {
                await window.inventoryManager.adjustStock(productId, adjustmentValue);
            } else {
                alert('Inventory manager not ready. Please try again.');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    window.deleteProduct = async function(productId) {
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                if (window.inventoryManager) {
                    await window.inventoryManager.deleteProduct(productId);
                } else {
                    alert('Inventory manager not ready. Please try again.');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
    };
}

function setupPermissionBasedUI() {
    const permissions = authSystem.getUserPermissions();
    
    // Hide/show elements based on permissions
    document.querySelectorAll('[data-permission]').forEach(element => {
        const requiredPermission = element.getAttribute('data-permission');
        if (!permissions[requiredPermission]) {
            element.style.display = 'none';
        }
    });
}

function updateSessionInfo() {
    const sessionInfo = authSystem.getSessionInfo();
    const sessionDetails = document.getElementById('session-details');
    
    if (sessionInfo && sessionDetails) {
        sessionDetails.innerHTML = `
            <strong>User:</strong> ${sessionInfo.user}<br>
            <strong>Login time:</strong> ${sessionInfo.loginTime.toLocaleString()}<br>
            <strong>Last activity:</strong> ${sessionInfo.lastActivity.toLocaleString()}<br>
            <strong>Time remaining:</strong> ${Math.ceil(sessionInfo.timeLeft / 1000 / 60)} minutes
        `;
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
        <div style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); 
                   background: #f8d7da; color: #721c24; padding: 15px; border-radius: 10px; 
                   border: 1px solid #f5c6cb; z-index: 10000; max-width: 500px;">
            <strong>Error:</strong> ${message}
            <button style="float: right; background: none; border: none; font-size: 18px; 
                          cursor: pointer;" onclick="this.parentElement.remove()">×</button>
        </div>
    `;
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 10000);
}

// Make logout function globally available
window.handleLogout = handleLogout;
