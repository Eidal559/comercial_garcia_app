/**
 * Authentication and Security System
 * Handles login, session management, and security features
 */
class AuthenticationSystem {
    constructor() {
        this.isAuthenticated = false;
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.maxAttempts = 3;
        this.lockoutTime = 15 * 60 * 1000; // 15 minutes
        this.sessionKey = 'stockpile_session';
        this.attemptsKey = 'stockpile_attempts';
        this.lockoutKey = 'stockpile_lockout';
        
        // Default credentials (in production, these should be hashed)
        this.credentials = {
            // Default: admin / STOCK2024
            admin: this.hashPassword('STOCK2024'),
            // Additional users can be added here
            manager: this.hashPassword('MANAGE2024'),
            clerk: this.hashPassword('CLERK2024')
        };
        
        this.currentUser = null;
        this.sessionTimer = null;
        
        this.init();
    }

    /**
     * Initialize authentication system
     */
    init() {
        this.checkExistingSession();
        this.setupSessionManagement();
        console.log('Authentication system initialized');
    }

    /**
     * Simple password hashing (for demo - use bcrypt in production)
     * @param {string} password - Password to hash
     * @returns {string} Hashed password
     */
    hashPassword(password) {
        // Simple hash for demo purposes - use proper hashing in production
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * Check if user is currently locked out
     * @returns {boolean} True if locked out
     */
    isLockedOut() {
        const lockoutEnd = localStorage.getItem(this.lockoutKey);
        if (lockoutEnd) {
            const now = Date.now();
            if (now < parseInt(lockoutEnd)) {
                return true;
            } else {
                // Lockout expired, clear it
                localStorage.removeItem(this.lockoutKey);
                localStorage.removeItem(this.attemptsKey);
            }
        }
        return false;
    }

    /**
     * Get remaining lockout time
     * @returns {number} Remaining time in milliseconds
     */
    getRemainingLockoutTime() {
        const lockoutEnd = localStorage.getItem(this.lockoutKey);
        if (lockoutEnd) {
            const remaining = parseInt(lockoutEnd) - Date.now();
            return Math.max(0, remaining);
        }
        return 0;
    }

    /**
     * Attempt to authenticate user
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Object} Authentication result
     */
    authenticate(username, password) {
        if (this.isLockedOut()) {
            const remainingTime = Math.ceil(this.getRemainingLockoutTime() / 1000 / 60);
            return {
                success: false,
                message: `Account locked. Try again in ${remainingTime} minutes.`,
                isLockedOut: true
            };
        }

        const hashedPassword = this.hashPassword(password);
        const attempts = parseInt(localStorage.getItem(this.attemptsKey) || '0');

        if (this.credentials[username] && this.credentials[username] === hashedPassword) {
            // Successful authentication
            this.isAuthenticated = true;
            this.currentUser = username;
            this.createSession();
            this.clearFailedAttempts();
            
            console.log(`User ${username} authenticated successfully`);
            
            return {
                success: true,
                message: 'Access granted',
                user: username
            };
        } else {
            // Failed authentication
            const newAttempts = attempts + 1;
            localStorage.setItem(this.attemptsKey, newAttempts.toString());
            
            if (newAttempts >= this.maxAttempts) {
                // Lock out user
                const lockoutEnd = Date.now() + this.lockoutTime;
                localStorage.setItem(this.lockoutKey, lockoutEnd.toString());
                
                console.log(`Account locked due to too many failed attempts`);
                
                return {
                    success: false,
                    message: `Too many failed attempts. Account locked for 15 minutes.`,
                    isLockedOut: true,
                    attempts: newAttempts
                };
            } else {
                const remainingAttempts = this.maxAttempts - newAttempts;
                
                return {
                    success: false,
                    message: `Invalid credentials. ${remainingAttempts} attempts remaining.`,
                    attempts: newAttempts,
                    remainingAttempts
                };
            }
        }
    }

    /**
     * Create user session
     */
    createSession() {
        const session = {
            user: this.currentUser,
            loginTime: Date.now(),
            lastActivity: Date.now(),
            sessionId: this.generateSessionId()
        };

        localStorage.setItem(this.sessionKey, JSON.stringify(session));
        this.startSessionTimer();
    }

    /**
     * Generate unique session ID
     * @returns {string} Session ID
     */
    generateSessionId() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    /**
     * Check for existing valid session
     */
    checkExistingSession() {
        const sessionData = localStorage.getItem(this.sessionKey);
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                const now = Date.now();
                
                // Check if session is still valid
                if (now - session.lastActivity < this.sessionTimeout) {
                    this.isAuthenticated = true;
                    this.currentUser = session.user;
                    this.updateSessionActivity();
                    this.startSessionTimer();
                    console.log(`Restored session for user: ${this.currentUser}`);
                } else {
                    // Session expired
                    this.logout(true);
                }
            } catch (error) {
                console.error('Error parsing session data:', error);
                this.logout();
            }
        }
    }

    /**
     * Update session activity timestamp
     */
    updateSessionActivity() {
        const sessionData = localStorage.getItem(this.sessionKey);
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                session.lastActivity = Date.now();
                localStorage.setItem(this.sessionKey, JSON.stringify(session));
            } catch (error) {
                console.error('Error updating session activity:', error);
            }
        }
    }

    /**
     * Setup session management and activity tracking
     */
    setupSessionManagement() {
        // Track user activity to extend session
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        
        let activityTimeout;
        const handleActivity = () => {
            if (this.isAuthenticated) {
                clearTimeout(activityTimeout);
                activityTimeout = setTimeout(() => {
                    this.updateSessionActivity();
                }, 30000); // Update every 30 seconds of activity
            }
        };

        activityEvents.forEach(event => {
            document.addEventListener(event, handleActivity, true);
        });

        // Check for session expiration periodically
        setInterval(() => {
            if (this.isAuthenticated) {
                const sessionData = localStorage.getItem(this.sessionKey);
                if (sessionData) {
                    try {
                        const session = JSON.parse(sessionData);
                        const now = Date.now();
                        
                        if (now - session.lastActivity >= this.sessionTimeout) {
                            this.logout(true); // Auto logout
                        }
                    } catch (error) {
                        console.error('Error checking session:', error);
                        this.logout();
                    }
                }
            }
        }, 60000); // Check every minute
    }

    /**
     * Start session timeout timer
     */
    startSessionTimer() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }

        this.sessionTimer = setTimeout(() => {
            this.logout(true);
        }, this.sessionTimeout);
    }

    /**
     * Clear failed login attempts
     */
    clearFailedAttempts() {
        localStorage.removeItem(this.attemptsKey);
        localStorage.removeItem(this.lockoutKey);
    }

    /**
     * Enhanced logout user method
     * @param {boolean} auto - Whether this is an automatic logout
     */
    logout(auto = false) {
        console.log('🚪 AuthSystem logout called', auto ? '(auto)' : '(manual)');
        
        this.isAuthenticated = false;
        this.currentUser = null;
        
        // Clear session data
        localStorage.removeItem(this.sessionKey);
        localStorage.removeItem(this.attemptsKey); // Also clear failed attempts
        
        // Clear session timer
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }

        console.log(auto ? 'Session expired - auto logout' : 'User logged out manually');
        
        // Reset UI to login state
        this.showLoginScreen(auto);
    }

    /**
     * Show login screen with optional message
     * @param {boolean} auto - Whether this is from auto logout
     */
    showLoginScreen(auto = false) {
        const mainApp = document.getElementById('main-app');
        const loginOverlay = document.getElementById('login-overlay');
        const messageDiv = document.getElementById('login-message');
        
        // Hide main app
        if (mainApp) {
            mainApp.style.display = 'none';
        }
        
        // Show login overlay
        if (loginOverlay) {
            loginOverlay.style.display = 'block';
        }
        
        // Clear and focus login form
        const username = document.getElementById('username');
        const password = document.getElementById('password');
        
        if (username) {
            username.value = '';
            setTimeout(() => username.focus(), 100);
        }
        if (password) {
            password.value = '';
        }
        
        // Show message if auto logout
        if (messageDiv) {
            if (auto) {
                messageDiv.textContent = 'Session expired. Please sign in again.';
                messageDiv.style.color = '#e67e22';
            } else {
                messageDiv.textContent = '';
                messageDiv.style.color = '';
            }
        }
        
        console.log('Login screen displayed');
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    /**
     * Get current user
     * @returns {string|null} Current username
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Get user permissions based on role
     * @returns {Object} User permissions
     */
    getUserPermissions() {
        const permissions = {
            canViewInventory: true,
            canAddProducts: false,
            canEditProducts: false,
            canDeleteProducts: false,
            canProcessSales: true,
            canRestock: false,
            canExportData: false,
            canImportData: false,
            canViewReports: true
        };

        switch (this.currentUser) {
            case 'admin':
                // Admin has all permissions
                Object.keys(permissions).forEach(key => {
                    permissions[key] = true;
                });
                break;
            case 'manager':
                // Manager has most permissions except delete
                permissions.canAddProducts = true;
                permissions.canEditProducts = true;
                permissions.canRestock = true;
                permissions.canExportData = true;
                permissions.canImportData = true;
                break;
            case 'clerk':
                // Store clerk has limited permissions
                permissions.canProcessSales = true;
                permissions.canViewReports = false;
                break;
        }

        return permissions;
    }

    /**
     * Get session info
     * @returns {Object} Session information
     */
    getSessionInfo() {
        if (!this.isAuthenticated) {
            return null;
        }

        const sessionData = localStorage.getItem(this.sessionKey);
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                const now = Date.now();
                const timeLeft = this.sessionTimeout - (now - session.lastActivity);
                
                return {
                    user: session.user,
                    loginTime: new Date(session.loginTime),
                    lastActivity: new Date(session.lastActivity),
                    timeLeft: Math.max(0, timeLeft),
                    sessionId: session.sessionId
                };
            } catch (error) {
                console.error('Error getting session info:', error);
            }
        }
        
        return null;
    }

    /**
     * Log security events
     * @param {string} event - Event type
     * @param {Object} details - Event details
     */
    logSecurityEvent(event, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event,
            user: this.currentUser,
            details,
            userAgent: navigator.userAgent,
            ip: 'local' // In production, get real IP
        };

        // Store security log in localStorage (in production, send to secure backend)
        const logKey = 'stockpile_security_log';
        const existingLog = JSON.parse(localStorage.getItem(logKey) || '[]');
        existingLog.push(logEntry);
        
        // Keep only last 1000 entries
        if (existingLog.length > 1000) {
            existingLog.splice(0, existingLog.length - 1000);
        }
        
        localStorage.setItem(logKey, JSON.stringify(existingLog));
        console.log('Security event logged:', event, details);
    }

    /**
     * Get security log (admin only)
     * @param {number} limit - Number of entries to return
     * @returns {Array} Security log entries
     */
    getSecurityLog(limit = 100) {
        if (!this.isAuthenticated || this.currentUser !== 'admin') {
            return [];
        }

        const logKey = 'stockpile_security_log';
        const log = JSON.parse(localStorage.getItem(logKey) || '[]');
        return log.slice(-limit).reverse();
    }

    /**
     * Destroy authentication system
     */
    destroy() {
        this.logout();
        console.log('Authentication system destroyed');
    }
}
