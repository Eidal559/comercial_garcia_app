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
        this.sessionKey = 'comercial_garcia_session';
        this.attemptsKey = 'comercial_garcia_attempts';
        this.lockoutKey = 'comercial_garcia_lockout';
        
        // Default credentials (in production, these should be hashed)
        this.credentials = {
            // Default: admin / CG2024
            admin: this.hashPassword('CG2024'),
            // Additional users can be added here
            gerente: this.hashPassword('FERR2024'),
            vendedor: this.hashPassword('VENTA2024')
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
                message: `Cuenta bloqueada. Intente nuevamente en ${remainingTime} minutos.`,
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
                message: 'Acceso autorizado',
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
                    message: `Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.`,
                    isLockedOut: true,
                    attempts: newAttempts
                };
            } else {
                const remainingAttempts = this.maxAttempts - newAttempts;
                
                return {
                    success: false,
                    message: `Credenciales incorrectas. ${remainingAttempts} intentos restantes.`,
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
                    this.logout();
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
     * Logout user
     * @param {boolean} auto - Whether this is an automatic logout
     */
    logout(auto = false) {
        this.isAuthenticated = false;
        this.currentUser = null;
        
        // Clear session data
        localStorage.removeItem(this.sessionKey);
        
        // Clear session timer
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }

        console.log(auto ? 'Session expired - auto logout' : 'User logged out');
        
        // Show login form again
        if (window.app && window.app.showLoginForm) {
            const message = auto ? 'Sesión expirada. Por favor, inicie sesión nuevamente.' : null;
            window.app.showLoginForm(message);
        }
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
            case 'gerente':
                // Manager has most permissions except delete
                permissions.canAddProducts = true;
                permissions.canEditProducts = true;
                permissions.canRestock = true;
                permissions.canExportData = true;
                permissions.canImportData = true;
                break;
            case 'vendedor':
                // Salesperson has limited permissions
                permissions.canProcessSales = true;
                permissions.canViewReports = false;
                break;
        }

        return permissions;
    }

    /**
     * Change user password
     * @param {string} oldPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Object} Result of password change
     */
    changePassword(oldPassword, newPassword) {
        if (!this.isAuthenticated) {
            return { success: false, message: 'No autorizado' };
        }

        const oldHash = this.hashPassword(oldPassword);
        if (this.credentials[this.currentUser] !== oldHash) {
            return { success: false, message: 'Contraseña actual incorrecta' };
        }

        if (newPassword.length < 6) {
            return { success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres' };
        }

        this.credentials[this.currentUser] = this.hashPassword(newPassword);
        
        // In a real application, this would be saved to a secure backend
        localStorage.setItem('comercial_garcia_credentials', JSON.stringify(this.credentials));
        
        return { success: true, message: 'Contraseña cambiada exitosamente' };
    }

    /**
     * Add new user (admin only)
     * @param {string} username - New username
     * @param {string} password - Password for new user
     * @returns {Object} Result of user creation
     */
    addUser(username, password) {
        if (!this.isAuthenticated || this.currentUser !== 'admin') {
            return { success: false, message: 'Solo el administrador puede agregar usuarios' };
        }

        if (this.credentials[username]) {
            return { success: false, message: 'El usuario ya existe' };
        }

        if (password.length < 6) {
            return { success: false, message: 'La contraseña debe tener al menos 6 caracteres' };
        }

        this.credentials[username] = this.hashPassword(password);
        localStorage.setItem('comercial_garcia_credentials', JSON.stringify(this.credentials));
        
        return { success: true, message: `Usuario ${username} creado exitosamente` };
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
        const logKey = 'comercial_garcia_security_log';
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

        const logKey = 'comercial_garcia_security_log';
        const log = JSON.parse(localStorage.getItem(logKey) || '[]');
        return log.slice(-limit).reverse();
    }

    /**
     * Initialize credentials from localStorage if available
     */
    loadStoredCredentials() {
        const stored = localStorage.getItem('comercial_garcia_credentials');
        if (stored) {
            try {
                const parsedCredentials = JSON.parse(stored);
                this.credentials = { ...this.credentials, ...parsedCredentials };
            } catch (error) {
                console.error('Error loading stored credentials:', error);
            }
        }
    }

    /**
     * Cleanup expired sessions and security logs
     */
    cleanup() {
        // Remove expired sessions
        const sessionData = localStorage.getItem(this.sessionKey);
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                const now = Date.now();
                if (now - session.lastActivity >= this.sessionTimeout) {
                    localStorage.removeItem(this.sessionKey);
                }
            } catch (error) {
                localStorage.removeItem(this.sessionKey);
            }
        }

        // Clean old security logs (keep only last 30 days)
        const logKey = 'comercial_garcia_security_log';
        const log = JSON.parse(localStorage.getItem(logKey) || '[]');
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        const filteredLog = log.filter(entry => {
            const entryTime = new Date(entry.timestamp).getTime();
            return entryTime > thirtyDaysAgo;
        });
        
        if (filteredLog.length !== log.length) {
            localStorage.setItem(logKey, JSON.stringify(filteredLog));
        }
    }

    /**
     * Destroy authentication system
     */
    destroy() {
        this.logout();
        this.cleanup();
        console.log('Authentication system destroyed');
    }
}

/**
 * Enhanced ComercialGarciaApp with Authentication
 */
class SecureComercialGarciaApp extends ComercialGarciaApp {
    constructor() {
        super();
        this.authSystem = new AuthenticationSystem();
        this.loginOverlay = null;
    }

    /**
     * Initialize the secure application
     */
    async init() {
        try {
            console.log('🔐 Inicializando Sistema Seguro...');
            
            // Load stored credentials
            this.authSystem.loadStoredCredentials();
            
            // Check authentication first
            if (!this.authSystem.isUserAuthenticated()) {
                this.showLoginForm();
                return;
            }

            // Proceed with normal initialization
            await super.init();
            
            // Log successful login
            this.authSystem.logSecurityEvent('SYSTEM_ACCESS', {
                user: this.authSystem.getCurrentUser()
            });
            
        } catch (error) {
            console.error('❌ Error inicializando la aplicación segura:', error);
            this.showError('Error inicializando la aplicación: ' + error.message);
        }
    }

    /**
     * Show login form
     * @param {string} message - Optional message to display
     */
    showLoginForm(message = null) {
        // Remove existing overlay if present
        if (this.loginOverlay) {
            this.loginOverlay.remove();
        }

        // Create login overlay
        this.loginOverlay = document.createElement('div');
        this.loginOverlay.className = 'login-overlay';
        
        const lockoutInfo = this.authSystem.isLockedOut() ? 
            `<div class="login-attempts">Cuenta bloqueada por ${Math.ceil(this.authSystem.getRemainingLockoutTime() / 1000 / 60)} minutos</div>` : '';
        
        this.loginOverlay.innerHTML = `
            <div class="login-form">
                <h2>🔐 Acceso al Sistema</h2>
                <p style="color: #7f8c8d; margin-bottom: 30px;">Comercial García - Sistema de Inventario</p>
                ${message ? `<div class="alert alert-warning" style="margin-bottom: 20px;">${message}</div>` : ''}
                ${lockoutInfo}
                <form id="login-form">
                    <div class="form-group">
                        <label for="username">Usuario</label>
                        <input type="text" id="username" required ${this.authSystem.isLockedOut() ? 'disabled' : ''}>
                    </div>
                    <div class="form-group">
                        <label for="password">Contraseña</label>
                        <input type="password" id="password" required ${this.authSystem.isLockedOut() ? 'disabled' : ''}>
                    </div>
                    <button type="submit" class="btn" ${this.authSystem.isLockedOut() ? 'disabled' : ''}>
                        Iniciar Sesión
                    </button>
                </form>
                <div id="login-message" class="login-attempts"></div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1; font-size: 12px; color: #7f8c8d;">
                    <strong>Usuarios por defecto:</strong><br>
                    admin / CG2024 (Administrador)<br>
                    gerente / FERR2024 (Gerente)<br>
                    vendedor / VENTA2024 (Vendedor)
                </div>
            </div>
        `;

        document.body.appendChild(this.loginOverlay);

        // Setup login form handler
        const loginForm = document.getElementById('login-form');
        loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        // Focus username field
        setTimeout(() => {
            const usernameField = document.getElementById('username');
            if (usernameField && !this.authSystem.isLockedOut()) {
                usernameField.focus();
            }
        }, 100);

        // Update lockout timer if locked out
        if (this.authSystem.isLockedOut()) {
            this.updateLockoutTimer();
        }
    }

    /**
     * Handle login form submission
     * @param {Event} e - Form submit event
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const messageDiv = document.getElementById('login-message');

        if (!username || !password) {
            messageDiv.textContent = 'Por favor, complete todos los campos';
            messageDiv.style.color = '#e74c3c';
            return;
        }

        // Attempt authentication
        const result = this.authSystem.authenticate(username, password);
        
        if (result.success) {
            // Log successful login
            this.authSystem.logSecurityEvent('LOGIN_SUCCESS', {
                user: username,
                timestamp: new Date().toISOString()
            });

            messageDiv.textContent = 'Acceso autorizado...';
            messageDiv.style.color = '#27ae60';
            
            // Remove login overlay
            setTimeout(() => {
                if (this.loginOverlay) {
                    this.loginOverlay.remove();
                    this.loginOverlay = null;
                }
                // Initialize the main application
                super.init();
            }, 1000);
            
        } else {
            // Log failed login
            this.authSystem.logSecurityEvent('LOGIN_FAILED', {
                username,
                reason: result.message,
                attempts: result.attempts || 0
            });

            messageDiv.textContent = result.message;
            messageDiv.style.color = '#e74c3c';
            
            if (result.isLockedOut) {
                // Disable form and start lockout timer
                document.getElementById('username').disabled = true;
                document.getElementById('password').disabled = true;
                document.querySelector('.btn').disabled = true;
                this.updateLockoutTimer();
            }
            
            // Clear password field
            document.getElementById('password').value = '';
        }
    }

    /**
     * Update lockout timer display
     */
    updateLockoutTimer() {
        const messageDiv = document.getElementById('login-message');
        
        const updateTimer = () => {
            const remaining = this.authSystem.getRemainingLockoutTime();
            if (remaining > 0) {
                const minutes = Math.ceil(remaining / 1000 / 60);
                messageDiv.textContent = `Cuenta bloqueada. Tiempo restante: ${minutes} minutos`;
                messageDiv.style.color = '#e74c3c';
                setTimeout(updateTimer, 1000);
            } else {
                // Lockout expired, re-enable form
                document.getElementById('username').disabled = false;
                document.getElementById('password').disabled = false;
                document.querySelector('.btn').disabled = false;
                messageDiv.textContent = 'Puede intentar nuevamente';
                messageDiv.style.color = '#27ae60';
            }
        };
        
        updateTimer();
    }

    /**
     * Enhanced setup with authentication checks
     */
    setupGlobalFunctions() {
        super.setupGlobalFunctions();
        
        // Add authentication-aware functions
        window.authSystem = this.authSystem;
        
        // Add logout function
        window.logout = () => {
            if (confirm('¿Está seguro de que desea cerrar sesión?')) {
                this.authSystem.logSecurityEvent('LOGOUT', {
                    user: this.authSystem.getCurrentUser()
                });
                this.authSystem.logout();
            }
        };
        
        // Add session info function
        window.getSessionInfo = () => {
            return this.authSystem.getSessionInfo();
        };
        
        // Add permission check function
        window.checkPermission = (permission) => {
            const permissions = this.authSystem.getUserPermissions();
            return permissions[permission] || false;
        };
    }

    /**
     * Enhanced destroy with cleanup
     */
    destroy() {
        if (this.authSystem) {
            this.authSystem.destroy();
        }
        if (this.loginOverlay) {
            this.loginOverlay.remove();
        }
        super.destroy();
    }
}
