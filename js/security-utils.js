/**
 * Security and Data Integrity utilities
 */
class SecurityUtils {
    /**
     * Sanitize input to prevent XSS
     * @param {string} input - Input to sanitize
     * @returns {string} Sanitized input
     */
    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }
    
    /**
     * Validate and sanitize product data
     * @param {Object} productData - Raw product data
     * @returns {Object} Sanitized product data
     */
    static sanitizeProductData(productData) {
        const sanitized = {};
        
        // Sanitize string fields
        const stringFields = ['sku', 'name', 'category', 'supplier', 'barcode'];
        stringFields.forEach(field => {
            if (productData[field]) {
                sanitized[field] = this.sanitizeInput(productData[field].toString().trim());
            }
        });
        
        // Validate and sanitize numeric fields
        if (productData.price !== undefined) {
            const price = parseFloat(productData.price);
            sanitized.price = isNaN(price) ? 0 : Math.max(0, price);
        }
        
        if (productData.quantity !== undefined) {
            const quantity = parseInt(productData.quantity);
            sanitized.quantity = isNaN(quantity) ? 0 : Math.max(0, quantity);
        }
        
        if (productData.minStock !== undefined) {
            const minStock = parseInt(productData.minStock);
            sanitized.minStock = isNaN(minStock) ? 0 : Math.max(0, minStock);
        }
        
        return sanitized;
    }
    
    /**
     * Generate secure backup filename
     * @returns {string} Secure filename
     */
    static generateSecureBackupFilename() {
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-');
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        return `comercial-garcia-backup-${timestamp}-${randomSuffix}.json`;
    }
    
    /**
     * Validate import data structure
     * @param {Object} data - Import data to validate
     * @returns {Object} Validation result
     */
    static validateImportData(data) {
        const result = { isValid: true, errors: [] };
        
        if (!data || typeof data !== 'object') {
            result.isValid = false;
            result.errors.push('Datos de importación inválidos');
            return result;
        }
        
        // Check required structure
        if (!data.products || !Array.isArray(data.products)) {
            result.isValid = false;
            result.errors.push('Estructura de productos inválida');
        }
        
        if (data.sales && !Array.isArray(data.sales)) {
            result.isValid = false;
            result.errors.push('Estructura de ventas inválida');
        }
        
        // Validate each product
        if (data.products) {
            data.products.forEach((product, index) => {
                const requiredFields = ['sku', 'name', 'category', 'price', 'quantity'];
                const missingFields = requiredFields.filter(field => 
                    product[field] === undefined || product[field] === null
                );
                
                if (missingFields.length > 0) {
                    result.isValid = false;
                    result.errors.push(`Producto ${index + 1}: Campos faltantes: ${missingFields.join(', ')}`);
                }
            });
        }
        
        return result;
    }
}

/**
 * Data backup and integrity manager
 */
class DataIntegrityManager {
    constructor(database) {
        this.db = database;
        this.backupInterval = null;
        this.autoBackupEnabled = false;
    }
    
    /**
     * Enable automatic backups
     * @param {number} intervalHours - Backup interval in hours
     */
    enableAutoBackup(intervalHours = 24) {
        this.disableAutoBackup(); // Clear existing interval
        
        this.backupInterval = setInterval(async () => {
            try {
                await this.createAutoBackup();
                console.log('Automatic backup created successfully');
            } catch (error) {
                console.error('Auto backup failed:', error);
            }
        }, intervalHours * 60 * 60 * 1000);
        
        this.autoBackupEnabled = true;
        console.log(`Auto backup enabled: every ${intervalHours} hours`);
    }
    
    /**
     * Disable automatic backups
     */
    disableAutoBackup() {
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
            this.backupInterval = null;
        }
        this.autoBackupEnabled = false;
        console.log('Auto backup disabled');
    }
    
    /**
     * Create automatic backup to localStorage
     */
    async createAutoBackup() {
        try {
            const data = await this.db.exportData();
            const backupKey = `comercial_garcia_backup_${Date.now()}`;
            
            // Store in localStorage (with size limit consideration)
            const dataString = JSON.stringify(data);
            if (dataString.length < 5 * 1024 * 1024) { // 5MB limit
                localStorage.setItem(backupKey, dataString);
                
                // Keep only last 3 auto backups
                this.cleanupOldBackups();
            }
            
        } catch (error) {
            console.error('Auto backup creation failed:', error);
        }
    }
    
    /**
     * Clean up old automatic backups
     */
    cleanupOldBackups() {
        const backupKeys = Object.keys(localStorage)
            .filter(key => key.startsWith('comercial_garcia_backup_'))
            .sort()
            .reverse();
        
        // Remove backups beyond the last 3
        backupKeys.slice(3).forEach(key => {
            localStorage.removeItem(key);
        });
    }
    
    /**
     * Get available backups
     * @returns {Array} List of available backups
     */
    getAvailableBackups() {
        return Object.keys(localStorage)
            .filter(key => key.startsWith('comercial_garcia_backup_'))
            .map(key => {
                const timestamp = key.replace('comercial_garcia_backup_', '');
                return {
                    key,
                    timestamp: parseInt(timestamp),
                    date: new Date(parseInt(timestamp)),
                    size: localStorage.getItem(key).length
                };
            })
            .sort((a, b) => b.timestamp - a.timestamp);
    }
    
    /**
     * Restore from backup
     * @param {string} backupKey - Backup key to restore from
     * @returns {Promise<boolean>} Success status
     */
    async restoreFromBackup(backupKey) {
        try {
            const backupData = localStorage.getItem(backupKey);
            if (!backupData) {
                throw new Error('Backup not found');
            }
            
            const data = JSON.parse(backupData);
            const validation = SecurityUtils.validateImportData(data);
            
            if (!validation.isValid) {
                throw new Error('Invalid backup data: ' + validation.errors.join(', '));
            }
            
            await this.db.importData(data);
            console.log('Backup restored successfully');
            return true;
            
        } catch (error) {
            console.error('Backup restoration failed:', error);
            throw error;
        }
    }
    
    /**
     * Verify data integrity
     * @returns {Promise<Object>} Integrity check result
     */
    async verifyDataIntegrity() {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            stats: {}
        };
        
        try {
            const products = await this.db.getAllProducts();
            const sales = await this.db.getAllSales();
            
            // Check for duplicate SKUs
            const skuCounts = {};
            products.forEach(product => {
                if (skuCounts[product.sku]) {
                    result.isValid = false;
                    result.errors.push(`Duplicate SKU found: ${product.sku}`);
                } else {
                    skuCounts[product.sku] = 1;
                }
            });
            
            // Check for invalid data
            products.forEach((product, index) => {
                if (!product.sku || !product.name) {
                    result.isValid = false;
                    result.errors.push(`Product ${index + 1}: Missing required fields`);
                }
                
                if (product.price < 0 || product.quantity < 0) {
                    result.isValid = false;
                    result.errors.push(`Product ${product.sku}: Negative values detected`);
                }
                
                if (product.quantity <= product.minStock) {
                    result.warnings.push(`Product ${product.sku}: Low stock warning`);
                }
            });
            
            // Check sales data integrity
            sales.forEach((sale, index) => {
                if (!sale.sku || !sale.quantity || !sale.date) {
                    result.warnings.push(`Sale ${index + 1}: Missing fields`);
                }
            });
            
            result.stats = {
                totalProducts: products.length,
                totalSales: sales.length,
                duplicateSKUs: Object.keys(skuCounts).filter(sku => skuCounts[sku] > 1).length,
                lowStockItems: products.filter(p => p.quantity <= p.minStock).length
            };
            
        } catch (error) {
            result.isValid = false;
            result.errors.push('Database access error: ' + error.message);
        }
        
        return result;
    }
}

/**
 * Enhanced InventoryManager with security features
 */
class SecureInventoryManager extends InventoryManager {
    constructor(database) {
        super(database);
        this.dataIntegrityManager = new DataIntegrityManager(database);
        this.auditLog = [];
    }
    
    /**
     * Log audit events
     * @param {string} action - Action performed
     * @param {Object} data - Action data
     */
    logAuditEvent(action, data) {
        const event = {
            timestamp: new Date().toISOString(),
            action,
            data: SecurityUtils.sanitizeProductData(data),
            userAgent: navigator.userAgent
        };
        
        this.auditLog.push(event);
        
        // Keep only last 1000 events
        if (this.auditLog.length > 1000) {
            this.auditLog = this.auditLog.slice(-1000);
        }
        
        console.log('Audit event logged:', action);
    }
    
    /**
     * Secure add product with audit logging
     */
    async addProduct(product) {
        const sanitizedProduct = SecurityUtils.sanitizeProductData(product);
        const result = await super.addProduct(sanitizedProduct);
        this.logAuditEvent('ADD_PRODUCT', sanitizedProduct);
        return result;
    }
    
    /**
     * Secure update product with audit logging
     */
    async updateProduct(product) {
        const sanitizedProduct = SecurityUtils.sanitizeProductData(product);
        const result = await super.updateProduct(sanitizedProduct);
        this.logAuditEvent('UPDATE_PRODUCT', sanitizedProduct);
        return result;
    }
    
    /**
     * Secure delete product with audit logging
     */
    async deleteProduct(productId) {
        const product = this.inventory.find(p => p.id === productId);
        const result = await super.deleteProduct(productId);
        this.logAuditEvent('DELETE_PRODUCT', { id: productId, sku: product?.sku });
        return result;
    }
    
    /**
     * Secure process sale with audit logging
     */
    async processSale(identifier, quantity) {
        const result = await super.processSale(identifier, quantity);
        this.logAuditEvent('PROCESS_SALE', { 
            identifier, 
            quantity, 
            total: result.sale.total 
        });
        return result;
    }
    
    /**
     * Get audit log
     * @param {number} limit - Maximum number of events to return
     * @returns {Array} Audit events
     */
    getAuditLog(limit = 100) {
        return this.auditLog.slice(-limit).reverse();
    }
    
    /**
     * Export audit log
     * @returns {Object} Audit log data
     */
    exportAuditLog() {
        return {
            exportDate: new Date().toISOString(),
            events: this.auditLog,
            summary: {
                totalEvents: this.auditLog.length,
                dateRange: {
                    start: this.auditLog[0]?.timestamp,
                    end: this.auditLog[this.auditLog.length - 1]?.timestamp
                }
            }
        };
    }
}
