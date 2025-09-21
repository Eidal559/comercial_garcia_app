/**
 * Main Application Entry Point
 * Stockpile Inventory Management System
 */

class StockpileApp {
    constructor() {
        this.database = null;
        this.inventoryManager = null;
        this.barcodeScanner = null;
        this.uiController = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('📦 Initializing Stockpile...');
            
            // Show loading state
            this.showLoadingState();
            
            // Initialize database
            this.database = new InventoryDB();
            await this.database.init();
            console.log('✅ Database initialized');
            
            // Initialize inventory manager
            this.inventoryManager = new InventoryManager(this.database);
            await this.inventoryManager.init();
            console.log('✅ Inventory manager initialized');
            
            // Initialize barcode scanner
            this.barcodeScanner = new BarcodeScanner();
            this.barcodeScanner.init();
            console.log('✅ Barcode scanner initialized');
            
            // Initialize UI controller
            this.uiController = new UIController(this.inventoryManager, this.barcodeScanner);
            console.log('✅ UI controller initialized');
            
            // Hide loading state
            this.hideLoadingState();
            
            this.isInitialized = true;
            console.log('🎉 Stockpile initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing application:', error);
            this.showError('Application initialization error: ' + error.message);
        }
    }

    /**
     * Start barcode scanning for a specific field
     * @param {string} fieldId - Target field ID
     */
    async scanBarcodeForField(fieldId) {
        if (!this.barcodeScanner) return;
        
        try {
            await this.barcodeScanner.startScanning((barcode) => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = barcode;
                    
                    // Trigger appropriate actions based on field
                    if (fieldId === 'sell-sku') {
                        this.uiController.showSellProductInfo(barcode);
                    } else if (fieldId === 'restock-sku') {
                        this.uiController.showRestockProductInfo(barcode);
                    } else if (fieldId === 'quick-barcode') {
                        // Focus on quantity field for quick sale
                        const quantityField = document.getElementById('quick-quantity');
                        if (quantityField) {
                            quantityField.focus();
                        }
                    }
                }
            }, `scan-for-${fieldId}`);
        } catch (error) {
            console.error('Error starting barcode scanning:', error);
            if (this.uiController) {
                this.uiController.showAlert('Scanner error: ' + error.message, 'warning');
            }
        }
    }

    /**
     * Start general barcode scanning
     */
    async startGeneralBarcodeScanning() {
        if (!this.barcodeScanner) return;
        
        try {
            await this.barcodeScanner.startScanning((barcode) => {
                document.getElementById('barcode-search').value = barcode;
                this.searchProductByBarcode();
            }, 'general-scan');
        } catch (error) {
            console.error('Error starting general barcode scanning:', error);
            if (this.uiController) {
                this.uiController.showAlert('Scanner error: ' + error.message, 'warning');
            }
        }
    }

    /**
     * Search product by barcode
     */
    async searchProductByBarcode() {
        const barcode = document.getElementById('barcode-search').value.trim();
        if (!barcode) return;
        
        try {
            const product = await this.inventoryManager.getProductByBarcode(barcode);
            const resultDiv = document.getElementById('barcode-result');
            
            if (product && resultDiv) {
                resultDiv.innerHTML = `
                    <div class="alert alert-success">
                        <h3>✅ Product Found</h3>
                        <strong>${product.name}</strong><br>
                        SKU: ${product.sku}<br>
                        Category: ${product.category}<br>
                        Price: $${product.price.toFixed(2)}<br>
                        Stock: ${product.quantity} units<br>
                        ${product.supplier ? 'Supplier: ' + product.supplier + '<br>' : ''}
                        <div style="margin-top: 10px;">
                            <button class="btn" onclick="window.showSection('sell'); window.document.getElementById('sell-sku').value='${product.sku}'; window.showSellProductInfo('${product.sku}')">
                                💰 Sell
                            </button>
                            <button class="btn" onclick="window.showSection('restock'); window.document.getElementById('restock-sku').value='${product.sku}'; window.showRestockProductInfo('${product.sku}')">
                                📈 Restock
                            </button>
                        </div>
                    </div>
                `;
            } else if (resultDiv) {
                resultDiv.innerHTML = `
                    <div class="alert alert-warning">
                        <h3>❌ Product Not Found</h3>
                        <p>No product found with barcode: <strong>${barcode}</strong></p>
                        <button class="btn" onclick="window.showSection('add-product'); window.document.getElementById('barcode').value='${barcode}'">
                            ➕ Add New Product
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error searching product by barcode:', error);
            if (this.uiController) {
                this.uiController.showAlert('Search error: ' + error.message, 'danger');
            }
        }
    }

    /**
     * Perform quick sale
     */
    async performQuickSale() {
        const barcode = document.getElementById('quick-barcode').value.trim();
        const quantity = parseInt(document.getElementById('quick-quantity').value);
        
        if (!barcode || !quantity || quantity <= 0) {
            if (this.uiController) {
                this.uiController.showAlert('Please enter valid barcode and quantity', 'warning');
            }
            return;
        }
        
        try {
            await this.inventoryManager.processSale(barcode, quantity);
            
            // Reset form
            document.getElementById('quick-barcode').value = '';
            document.getElementById('quick-quantity').value = '1';
            
        } catch (error) {
            console.error('Error in quick sale:', error);
            if (this.uiController) {
                this.uiController.showAlert('Quick sale error: ' + error.message, 'danger');
            }
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const body = document.body;
        if (body) {
            body.style.cursor = 'wait';
            const loader = document.createElement('div');
            loader.id = 'app-loader';
            loader.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                           background: rgba(255,255,255,0.9); display: flex; align-items: center; 
                           justify-content: center; z-index: 9999;">
                    <div style="text-align: center;">
                        <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; 
                                   border-radius: 50%; width: 50px; height: 50px; 
                                   animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                        <h3>Loading Stockpile...</h3>
                    </div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            body.appendChild(loader);
        }
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.remove();
        }
        document.body.style.cursor = 'default';
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.hideLoadingState();
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

    /**
     * Check if app is initialized
     * @returns {boolean}
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * Cleanup application resources
     */
    destroy() {
        if (this.barcodeScanner) {
            this.barcodeScanner.destroy();
        }
        if (this.inventoryManager) {
            this.inventoryManager.destroy();
        }
        if (this.uiController) {
            this.uiController.destroy();
        }
        if (this.database) {
            this.database.close();
        }
        
        this.isInitialized = false;
        console.log('Application destroyed');
    }
}

// Handle app lifecycle
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.destroy();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StockpileApp;
}
