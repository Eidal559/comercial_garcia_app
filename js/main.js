/**
 * Main Application Initialization
 * Stockpile Inventory Management System
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
        
        // Hide login overlay and show main app
        setTimeout(async () => {
            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('main-app').style.display = 'block';
            
            // Update user info
            document.getElementById('current-user').textContent = `👤 ${username}`;
            
            // Initialize the main application
            await initializeMainApp();
        }, 1000);
        
    } else {
        messageDiv.textContent = result.message;
        messageDiv.style.color = '#e74c3c';
        
        // Clear password field
        document.getElementById('password').value = '';
    }
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
        
        console.log('🎉 Main application initialized successfully');
        
    } catch (error) {
        console.error('Error initializing main app:', error);
        showError('Application initialization error: ' + error.message);
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
