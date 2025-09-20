/**
 * UI Controller Module
 * Handles all user interface interactions and updates
 */
class UIController {
    constructor(inventoryManager, barcodeScanner) {
        this.inventoryManager = inventoryManager;
        this.barcodeScanner = barcodeScanner;
        this.currentSection = 'dashboard';
        this.searchCache = new Map();
        
        // DOM elements cache
        this.elements = {};
        
        this.init();
    }

    /**
     * Initialize UI controller
     */
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupInventoryEventHandlers();
        this.setupKeyboardShortcuts();
        console.log('UI Controller initialized');
    }

    /**
     * Cache frequently used DOM elements
     */
    cacheElements() {
        this.elements = {
            // Navigation
            navButtons: document.querySelectorAll('.nav-btn'),
            sections: document.querySelectorAll('.section'),
            
            // Dashboard
            totalProducts: document.getElementById('total-products'),
            lowStockCount: document.getElementById('low-stock-count'),
            totalValue: document.getElementById('total-value'),
            categoriesCount: document.getElementById('categories-count'),
            lowStockAlerts: document.getElementById('low-stock-alerts'),
            
            // Forms
            addProductForm: document.getElementById('add-product-form'),
            sellForm: document.getElementById('sell-form'),
            restockForm: document.getElementById('restock-form'),
            
            // Inventory
            inventoryBody: document.getElementById('inventory-body'),
            searchInput: document.getElementById('search'),
            categoryFilter: document.getElementById('category-filter'),
            
            // Alerts
            alerts: document.getElementById('alerts'),
            
            // Product info displays
            productInfo: document.getElementById('product-info'),
            productDetails: document.getElementById('product-details'),
            restockProductInfo: document.getElementById('restock-product-info'),
            restockProductDetails: document.getElementById('restock-product-details'),
            
            // Barcode
            barcodeResult: document.getElementById('barcode-result')
        };
    }

    /**
     * Setup event listeners for forms and interactions
     */
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sectionId = e.target.textContent.includes('Panel') ? 'dashboard' :
                                e.target.textContent.includes('Agregar') ? 'add-product' :
                                e.target.textContent.includes('Ver') ? 'inventory' :
                                e.target.textContent.includes('Vender') ? 'sell' :
                                e.target.textContent.includes('Reabastecer') ? 'restock' :
                                e.target.textContent.includes('Código') ? 'barcode' : 'dashboard';
                this.showSection(sectionId);
            });
        });

        // Add Product Form
        if (this.elements.addProductForm) {
            this.elements.addProductForm.addEventListener('submit', (e) => this.handleAddProduct(e));
        }

        // Sell Form
        if (this.elements.sellForm) {
            this.elements.sellForm.addEventListener('submit', (e) => this.handleSale(e));
        }

        // Restock Form
        if (this.elements.restockForm) {
            this.elements.restockForm.addEventListener('submit', (e) => this.handleRestock(e));
        }

        // Search
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', 
                this.debounce((e) => this.filterInventory(), 300));
        }

        // Category Filter
        if (this.elements.categoryFilter) {
            this.elements.categoryFilter.addEventListener('change', () => this.filterInventory());
        }

        // Product search suggestions
        this.setupProductSearch('sell-sku', 'search-suggestions', (sku) => this.showSellProductInfo(sku));
        this.setupProductSearch('restock-sku', 'restock-suggestions', (sku) => this.showRestockProductInfo(sku));

        // Import/Export
        const importFile = document.getElementById('import-file');
        if (importFile) {
            importFile.addEventListener('change', (e) => this.handleImport(e));
        }
    }

    /**
     * Setup inventory event handlers
     */
    setupInventoryEventHandlers() {
        this.inventoryManager.on('inventoryLoaded', () => {
            this.updateDashboard();
            this.displayInventory();
            this.updateCategoryFilter();
        });

        this.inventoryManager.on('productAdded', () => {
            this.updateDashboard();
            this.updateCategoryFilter();
            this.showAlert('Producto agregado exitosamente!', 'success');
        });

        this.inventoryManager.on('productUpdated', () => {
            this.updateDashboard();
            this.displayInventory();
        });

        this.inventoryManager.on('productDeleted', () => {
            this.updateDashboard();
            this.displayInventory();
            this.updateCategoryFilter();
            this.showAlert('Producto eliminado exitosamente!', 'success');
        });

        this.inventoryManager.on('saleProcessed', (data) => {
            this.updateDashboard();
            this.displayInventory();
            this.showAlert(
                `Venta completada! ${data.sale.quantity} x ${data.sale.name} - Total: $${data.sale.total.toFixed(2)}`, 
                'success'
            );
        });

        this.inventoryManager.on('productRestocked', (data) => {
            this.updateDashboard();
            this.displayInventory();
            this.showAlert(
                `Reabastecido exitosamente! Agregado ${data.quantity} x ${data.product.name}`, 
                'success'
            );
        });

        this.inventoryManager.on('stockAdjusted', (data) => {
            this.updateDashboard();
            this.displayInventory();
            const action = data.adjustment > 0 ? 'Agregado' : 'Removido';
            this.showAlert(
                `${action} ${Math.abs(data.adjustment)} de ${data.product.name}`, 
                'success'
            );
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                const shortcuts = {
                    '1': 'dashboard',
                    '2': 'add-product',
                    '3': 'inventory',
                    '4': 'sell',
                    '5': 'restock',
                    '6': 'barcode'
                };
                
                if (shortcuts[e.key]) {
                    e.preventDefault();
                    this.showSection(shortcuts[e.key]);
                }
            }
        });
    }

    /**
     * Show a specific section
     * @param {string} sectionId - Section to show
     */
    showSection(sectionId) {
        // Hide all sections
        this.elements.sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Remove active class from all nav buttons
        this.elements.navButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected section
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
        }
        
        // Set active nav button
        const activeBtn = Array.from(this.elements.navButtons).find(btn => {
            const text = btn.textContent.toLowerCase();
            return (sectionId === 'dashboard' && text.includes('panel')) ||
                   (sectionId === 'add-product' && text.includes('agregar')) ||
                   (sectionId === 'inventory' && text.includes('ver')) ||
                   (sectionId === 'sell' && text.includes('vender')) ||
                   (sectionId === 'restock' && text.includes('reabastecer')) ||
                   (sectionId === 'barcode' && text.includes('código'));
        });
        
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        this.currentSection = sectionId;
        
        // Update content based on section
        if (sectionId === 'dashboard') {
            this.updateDashboard();
        } else if (sectionId === 'inventory') {
            this.displayInventory();
        }
    }

    /**
     * Handle add product form submission
     * @param {Event} e - Form submit event
     */
    async handleAddProduct(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const productData = {
                sku: formData.get('sku') || document.getElementById('sku').value,
                name: document.getElementById('name').value,
                category: document.getElementById('category').value,
                price: document.getElementById('price').value,
                quantity: document.getElementById('quantity').value,
                minStock: document.getElementById('min-stock').value,
                barcode: document.getElementById('barcode').value,
                supplier: document.getElementById('supplier').value
            };
            
            const product = this.inventoryManager.createProduct(productData);
            await this.inventoryManager.addProduct(product);
            
            // Reset form
            e.target.reset();
            
        } catch (error) {
            this.showAlert(error.message, 'danger');
        }
    }

    /**
     * Handle sale form submission
     * @param {Event} e - Form submit event
     */
    async handleSale(e) {
        e.preventDefault();
        
        try {
            const identifier = document.getElementById('sell-sku').value.trim();
            const quantity = parseInt(document.getElementById('sell-quantity').value);
            
            await this.inventoryManager.processSale(identifier, quantity);
            
            // Reset form
            e.target.reset();
            this.elements.productInfo.style.display = 'none';
            
        } catch (error) {
            this.showAlert(error.message, 'danger');
        }
    }

    /**
     * Handle restock form submission
     * @param {Event} e - Form submit event
     */
    async handleRestock(e) {
        e.preventDefault();
        
        try {
            const identifier = document.getElementById('restock-sku').value.trim();
            const quantity = parseInt(document.getElementById('restock-quantity').value);
            
            await this.inventoryManager.restockProduct(identifier, quantity);
            
            // Reset form
            e.target.reset();
            this.elements.restockProductInfo.style.display = 'none';
            
        } catch (error) {
            this.showAlert(error.message, 'danger');
        }
    }

    /**
     * Update dashboard statistics
     */
    updateDashboard() {
        const stats = this.inventoryManager.getStatistics();
        
        if (this.elements.totalProducts) {
            this.elements.totalProducts.textContent = stats.totalProducts;
        }
        
        if (this.elements.lowStockCount) {
            this.elements.lowStockCount.textContent = stats.lowStockCount;
        }
        
        if (this.elements.totalValue) {
            this.elements.totalValue.textContent = `$${stats.totalValue.toFixed(2)}`;
        }
        
        if (this.elements.categoriesCount) {
            this.elements.categoriesCount.textContent = stats.categoriesCount;
        }
        
        // Update low stock alerts
        if (this.elements.lowStockAlerts) {
            if (stats.lowStockCount > 0) {
                this.elements.lowStockAlerts.innerHTML = `
                    <div class="alert alert-warning">
                        <strong>⚠️ Alerta de Stock Bajo!</strong><br>
                        ${stats.lowStockProducts.map(item => 
                            `${item.name} (${item.sku}): ${item.quantity} restantes`
                        ).join('<br>')}
                    </div>
                `;
            } else {
                this.elements.lowStockAlerts.innerHTML = 
                    '<div class="alert alert-success"><strong>✅ Todos los productos tienen buen stock!</strong></div>';
            }
        }
    }

    /**
     * Display inventory table
     * @param {Array} items - Items to display (optional, defaults to all)
     */
    displayInventory(items = null) {
        if (!this.elements.inventoryBody) return;
        
        const products = items || this.inventoryManager.getAllProducts();
        this.elements.inventoryBody.innerHTML = '';

        products.forEach(item => {
            const row = document.createElement('tr');
            if (item.quantity <= item.minStock) {
                row.classList.add('low-stock');
            }
            
            row.innerHTML = `
                <td>${item.sku}</td>
                <td>
                    ${item.name}
                    ${item.barcode ? '<br><small style="color: #7f8c8d;">CB: ' + item.barcode + '</small>' : ''}
                    ${item.supplier ? '<br><small style="color: #7f8c8d;">Prov: ' + item.supplier + '</small>' : ''}
                </td>
                <td>${item.category}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>${item.minStock}</td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
                <td class="action-buttons">
                    <button class="btn btn-warning" onclick="window.uiController.quickAdjust(${item.id}, 'add')" title="Agregar stock">+</button>
                    <button class="btn btn-warning" onclick="window.uiController.quickAdjust(${item.id}, 'subtract')" title="Quitar stock">-</button>
                    <button class="btn btn-danger" onclick="window.uiController.deleteProduct(${item.id})" title="Eliminar producto">🗑️</button>
                </td>
            `;
            this.elements.inventoryBody.appendChild(row);
        });
    }

    /**
     * Filter inventory based on search and category
     */
    filterInventory() {
        const searchTerm = this.elements.searchInput?.value || '';
        const categoryFilter = this.elements.categoryFilter?.value || '';
        
        const filteredProducts = this.inventoryManager.searchProducts(searchTerm, categoryFilter);
        this.displayInventory(filteredProducts);
    }

    /**
     * Update category filter options
     */
    updateCategoryFilter() {
        if (!this.elements.categoryFilter) return;
        
        const stats = this.inventoryManager.getStatistics();
        this.elements.categoryFilter.innerHTML = '<option value="">Todas las Categorías</option>';
        
        stats.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            this.elements.categoryFilter.appendChild(option);
        });
    }

    /**
     * Setup product search with suggestions
     * @param {string} inputId - Input element ID
     * @param {string} suggestionsId - Suggestions container ID
     * @param {Function} callback - Selection callback
     */
    setupProductSearch(inputId, suggestionsId, callback) {
        const input = document.getElementById(inputId);
        const suggestions = document.getElementById(suggestionsId);
        
        if (!input || !suggestions) return;
        
        input.addEventListener('input', this.debounce((e) => {
            const query = e.target.value;
            
            if (query.length < 2) {
                suggestions.style.display = 'none';
                return;
            }

            const matches = this.inventoryManager.getProductSuggestions(query, 5);

            if (matches.length > 0) {
                suggestions.innerHTML = matches.map(item => 
                    `<div style="padding: 10px; cursor: pointer; border-bottom: 1px solid #eee;" 
                     onclick="window.uiController.selectProduct('${item.sku}', '${inputId}', '${suggestionsId}', ${callback.name})">
                        ${item.sku} - ${item.name} 
                        ${item.barcode ? '(CB: ' + item.barcode + ')' : ''} 
                        (Stock: ${item.stock})
                     </div>`
                ).join('');
                suggestions.style.display = 'block';
            } else {
                suggestions.style.display = 'none';
            }
        }, 300));

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !suggestions.contains(e.target)) {
                suggestions.style.display = 'none';
            }
        });
    }

    /**
     * Select a product from suggestions
     * @param {string} sku - Product SKU
     * @param {string} inputId - Input element ID
     * @param {string} suggestionsId - Suggestions container ID
     * @param {string} callbackName - Callback function name
     */
    selectProduct(sku, inputId, suggestionsId, callbackName) {
        document.getElementById(inputId).value = sku;
        document.getElementById(suggestionsId).style.display = 'none';
        
        // Call the appropriate callback
        if (callbackName === 'showSellProductInfo') {
            this.showSellProductInfo(sku);
        } else if (callbackName === 'showRestockProductInfo') {
            this.showRestockProductInfo(sku);
        }
    }

    /**
     * Show product info for selling
     * @param {string} identifier - Product SKU or barcode
     */
    async showSellProductInfo(identifier) {
        try {
            const product = await this.inventoryManager.findProduct(identifier);
            if (product && this.elements.productInfo && this.elements.productDetails) {
                this.elements.productInfo.style.display = 'block';
                this.elements.productDetails.innerHTML = `
                    <strong>${product.name}</strong><br>
                    Categoría: ${product.category}<br>
                    Precio: $${product.price.toFixed(2)}<br>
                    Stock Actual: ${product.quantity}
                    ${product.barcode ? '<br>Código de Barras: ' + product.barcode : ''}
                    ${product.supplier ? '<br>Proveedor: ' + product.supplier : ''}
                `;
            }
        } catch (error) {
            console.error('Error showing product info:', error);
        }
    }

    /**
     * Show product info for restocking
     * @param {string} identifier - Product SKU or barcode
     */
    async showRestockProductInfo(identifier) {
        try {
            const product = await this.inventoryManager.findProduct(identifier);
            if (product && this.elements.restockProductInfo && this.elements.restockProductDetails) {
                this.elements.restockProductInfo.style.display = 'block';
                this.elements.restockProductDetails.innerHTML = `
                    <strong>${product.name}</strong><br>
                    Categoría: ${product.category}<br>
                    Precio: $${product.price.toFixed(2)}<br>
                    Stock Actual: ${product.quantity}
                    ${product.barcode ? '<br>Código de Barras: ' + product.barcode : ''}
                    ${product.supplier ? '<br>Proveedor: ' + product.supplier : ''}
                `;
            }
        } catch (error) {
            console.error('Error showing restock product info:', error);
        }
    }

    /**
     * Quick stock adjustment
     * @param {number} productId - Product ID
     * @param {string} action - 'add' or 'subtract'
     */
    async quickAdjust(productId, action) {
        const actionText = action === 'add' ? 'agregar' : 'quitar';
        const adjustment = prompt(`Ingrese cantidad a ${actionText}:`);
        const quantity = parseInt(adjustment);
        
        if (isNaN(quantity) || quantity <= 0) return;

        try {
            const adjustmentValue = action === 'add' ? quantity : -quantity;
            await this.inventoryManager.adjustStock(productId, adjustmentValue);
        } catch (error) {
            this.showAlert(error.message, 'danger');
        }
    }

    /**
     * Delete a product
     * @param {number} productId - Product ID
     */
    async deleteProduct(productId) {
        if (confirm('¿Está seguro de que desea eliminar este producto?')) {
            try {
                await this.inventoryManager.deleteProduct(productId);
            } catch (error) {
                this.showAlert(error.message, 'danger');
            }
        }
    }

    /**
     * Handle data import
     * @param {Event} e - File input change event
     */
    async handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            await this.inventoryManager.importData(data);
            this.showAlert('Datos importados exitosamente!', 'success');
        } catch (error) {
            this.showAlert('Error importando datos: ' + error.message, 'danger');
        }
    }

    /**
     * Export data
     */
    async exportData() {
        try {
            const data = await this.inventoryManager.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `comercial-garcia-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.showAlert('Respaldo exportado exitosamente!', 'success');
        } catch (error) {
            this.showAlert('Error exportando datos: ' + error.message, 'danger');
        }
    }

    /**
     * Show alert message
     * @param {string} message - Alert message
     * @param {string} type - Alert type (success, warning, danger)
     */
    showAlert(message, type = 'success') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        this.elements.alerts.appendChild(alert);
        
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    /**
     * Utility: Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.searchCache.clear();
        this.elements = {};
        console.log('UI Controller destroyed');
    }
}
