/**
 * Main Application Entry Point
 * Comercial García Inventory Management System
 */

class ComercialGarciaApp {
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
            console.log('🏪 Inicializando Comercial García...');
            
            // Show loading state
            this.showLoadingState();
            
            // Initialize database
            this.database = new InventoryDB();
            await this.database.init();
            console.log('✅ Base de datos inicializada');
            
            // Initialize inventory manager
            this.inventoryManager = new InventoryManager(this.database);
            await this.inventoryManager.init();
            console.log('✅ Gestor de inventario inicializado');
            
            // Initialize barcode scanner
            this.barcodeScanner = new BarcodeScanner();
            this.barcodeScanner.init();
            console.log('✅ Escáner de códigos inicializado');
            
            // Initialize UI controller
            this.uiController = new UIController(this.inventoryManager, this.barcodeScanner);
            console.log('✅ Controlador de UI inicializado');
            
            // Setup global functions for HTML onclick events
            this.setupGlobalFunctions();
            
            // Hide loading state
            this.hideLoadingState();
            
            this.isInitialized = true;
            console.log('🎉 Comercial García inicializado exitosamente');
            
        } catch (error) {
            console.error('❌ Error inicializando la aplicación:', error);
            this.showError('Error inicializando la aplicación: ' + error.message);
        }
    }

    /**
     * Setup global functions accessible from HTML
     */
    setupGlobalFunctions() {
        // Make instances globally accessible
        window.app = this;
        window.inventoryManager = this.inventoryManager;
        window.barcodeScanner = this.barcodeScanner;
        window.uiController = this.uiController;
        
        // Navigation functions
        window.showSection = (sectionId) => {
            if (this.uiController) {
                this.uiController.showSection(sectionId);
            }
        };
        
        // Barcode scanning functions
        window.scanBarcodeForAdd = () => this.scanBarcodeForField('barcode');
        window.scanBarcodeForSell = () => this.scanBarcodeForField('sell-sku');
        window.scanBarcodeForRestock = () => this.scanBarcodeForField('restock-sku');
        window.startBarcodeScanning = () => this.startGeneralBarcodeScanning();
        window.startQuickSaleScanning = () => this.scanBarcodeForField('quick-barcode');
        window.stopBarcodeScanning = () => this.barcodeScanner.stopScanning();
        
        // Search and product info functions
        window.searchByBarcode = () => this.searchProductByBarcode();
        window.showSellProductInfo = (identifier) => {
            if (this.uiController) {
                this.uiController.showSellProductInfo(identifier);
            }
        };
        window.showRestockProductInfo = (identifier) => {
            if (this.uiController) {
                this.uiController.showRestockProductInfo(identifier);
            }
        };
        
        // Quick sale function
        window.quickSale = () => this.performQuickSale();
        
        // Import/Export functions
        window.exportData = () => {
            if (this.uiController) {
                this.uiController.exportData();
            }
        };
        window.importData = (event) => {
            if (this.uiController) {
                this.uiController.handleImport(event);
            }
        };
        
        // Filter function
        window.filterInventory = () => {
            if (this.uiController) {
                this.uiController.filterInventory();
            }
        };
        
        // Alert function
        window.showAlert = (message, type) => {
            if (this.uiController) {
                this.uiController.showAlert(message, type);
            }
        };
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
                this.uiController.showAlert('Error iniciando escáner: ' + error.message, 'warning');
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
                this.uiController.showAlert('Error iniciando escáner: ' + error.message, 'warning');
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
                        <h3>✅ Producto Encontrado</h3>
                        <strong>${product.name}</strong><br>
                        SKU: ${product.sku}<br>
                        Categoría: ${product.category}<br>
                        Precio: $${product.price.toFixed(2)}<br>
                        Stock: ${product.quantity} unidades<br>
                        ${product.supplier ? 'Proveedor: ' + product.supplier + '<br>' : ''}
                        <div style="margin-top: 10px;">
                            <button class="btn" onclick="window.showSection('sell'); window.document.getElementById('sell-sku').value='${product.sku}'; window.showSellProductInfo('${product.sku}')">
                                💰 Vender
                            </button>
                            <button class="btn" onclick="window.showSection('restock'); window.document.getElementById('restock-sku').value='${product.sku}'; window.showRestockProductInfo('${product.sku}')">
                                📈 Reabastecer
                            </button>
                        </div>
                    </div>
                `;
            } else if (resultDiv) {
                resultDiv.innerHTML = `
                    <div class="alert alert-warning">
                        <h3>❌ Producto No Encontrado</h3>
                        <p>No se encontró ningún producto con el código de barras: <strong>${barcode}</strong></p>
                        <button class="btn" onclick="window.showSection('add-product'); window.document.getElementById('barcode').value='${barcode}'">
                            ➕ Agregar Nuevo Producto
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error searching product by barcode:', error);
            if (this.uiController) {
                this.uiController.showAlert('Error buscando producto: ' + error.message, 'danger');
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
                this.uiController.showAlert('Por favor ingrese código de barras y cantidad válidos', 'warning');
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
                this.uiController.showAlert('Error en venta rápida: ' + error.message, 'danger');
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
                        <h3>Cargando Comercial García...</h3>
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

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const app = new ComercialGarciaApp();
        await app.init();
    } catch (error) {
        console.error('Failed to initialize application:', error);
    }
});

// Handle app lifecycle
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.destroy();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComercialGarciaApp;
}
