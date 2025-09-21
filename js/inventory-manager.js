/**
 * Inventory Manager Module
 * Handles all inventory business logic and operations
 */
class InventoryManager {
    constructor(database) {
        this.db = database;
        this.inventory = [];
        this.nextId = 1;
        this.eventHandlers = {};
    }

    /**
     * Initialize inventory manager and load data
     */
    async init() {
        try {
            await this.loadInventoryFromDB();
            
            // Initialize with sample data if empty
            if (this.inventory.length === 0) {
                await this.initializeSampleData();
            }
            
            this.emit('inventoryLoaded', this.inventory);
            console.log('Inventory manager initialized with', this.inventory.length, 'products');
            
        } catch (error) {
            console.error('Error initializing inventory manager:', error);
            throw error;
        }
    }

    /**
     * Load inventory from database
     */
    async loadInventoryFromDB() {
        try {
            this.inventory = await this.db.getAllProducts();
            if (this.inventory.length > 0) {
                this.nextId = Math.max(...this.inventory.map(p => p.id)) + 1;
            }
        } catch (error) {
            console.error('Error loading inventory:', error);
            this.inventory = [];
        }
    }

    /**
     * Initialize with sample data for demo purposes
     */
   /**
 * Initialize with sample data for demo purposes
 */
async initializeSampleData() {
    const sampleProducts = [
        { 
            sku: 'TOR001', 
            name: 'Tornillo Madera 2" Phillips', 
            category: 'Tornillos y Pernos',
            price: 0.25, 
            quantity: 150, 
            minStock: 20, 
            barcode: '1234567890123', 
            supplier: 'Ferretería Central' 
        },
        { 
            sku: 'MAR001', 
            name: 'Martillo Garra 16oz', 
            category: 'Herramientas Manuales',
            price: 24.99, 
            quantity: 8, 
            minStock: 5, 
            barcode: '2345678901234', 
            supplier: 'Herramientas Pro' 
        },
        { 
            sku: 'PIN001', 
            name: 'Pintura Interior Blanca 1gal', 
            category: 'Pinturas y Barnices',
            price: 34.99, 
            quantity: 3, 
            minStock: 5, 
            barcode: '3456789012345', 
            supplier: 'Pinturas García' 
        },
        { 
            sku: 'TUE001', 
            name: 'Tuerca Hex 1/4"', 
            category: 'Ferretería General',
            price: 0.15, 
            quantity: 200, 
            minStock: 25, 
            barcode: '4567890123456', 
            supplier: 'Ferretería Central' 
        },
        { 
            sku: 'CAB001', 
            name: 'Cable Cobre 12AWG 100ft', 
            category: 'Material Eléctrico',
            price: 89.99, 
            quantity: 2, 
            minStock: 3, 
            barcode: '5678901234567', 
            supplier: 'Eléctricos SA' 
        },
        { 
            sku: 'TAL001', 
            name: 'Taladro Eléctrico 1/2"', 
            category: 'Herramientas Eléctricas',
            price: 159.99, 
            quantity: 4, 
            minStock: 2, 
            barcode: '6789012345678', 
            supplier: 'Herramientas Pro' 
        },
        { 
            sku: 'TUB001', 
            name: 'Tubo PVC 2" x 6m', 
            category: 'Plomería',
            price: 12.50, 
            quantity: 25, 
            minStock: 10, 
            barcode: '7890123456789', 
            supplier: 'Plomería Rápida' 
        },
        { 
            sku: 'SIL001', 
            name: 'Silicón Construcción Transparente', 
            category: 'Adhesivos',
            price: 4.99, 
            quantity: 15, 
            minStock: 8, 
            barcode: '8901234567890', 
            supplier: 'Químicos Industriales' 
        }
    ];

        for (const productData of sampleProducts) {
            const product = this.createProduct(productData);
            await this.addProduct(product);
        }

        console.log('Sample data initialized');
    }

    /**
     * Create a new product object
     * @param {Object} productData - Product data
     * @returns {Object} Complete product object
     */
    createProduct(productData) {
        return {
            id: this.nextId++,
            sku: productData.sku.trim().toUpperCase(),
            name: productData.name.trim(),
            category: productData.category,
            price: parseFloat(productData.price),
            quantity: parseInt(productData.quantity),
            minStock: parseInt(productData.minStock),
            barcode: productData.barcode ? productData.barcode.trim() : null,
            supplier: productData.supplier ? productData.supplier.trim() : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    /**
     * Add a new product to inventory
     * @param {Object} product - Product to add
     * @returns {Promise<Object>} Added product
     */
    async addProduct(product) {
        try {
            // Validate product data
            this.validateProduct(product);
            
            // Check for duplicate SKU
            if (await this.getProductBySKU(product.sku)) {
                throw new Error(`Ya existe un producto con el SKU: ${product.sku}`);
            }
            
            // Check for duplicate barcode if provided
            if (product.barcode && await this.getProductByBarcode(product.barcode)) {
                throw new Error(`Ya existe un producto con el código de barras: ${product.barcode}`);
            }

            // Add to database
            await this.db.addProduct(product);
            
            // Add to local inventory
            this.inventory.push(product);
            
            this.emit('productAdded', product);
            console.log('Product added:', product.sku);
            
            return product;
            
        } catch (error) {
            console.error('Error adding product:', error);
            throw error;
        }
    }

    /**
     * Update an existing product
     * @param {Object} product - Product to update
     * @returns {Promise<Object>} Updated product
     */
    async updateProduct(product) {
        try {
            product.updatedAt = new Date().toISOString();
            
            // Update in database
            await this.db.updateProduct(product);
            
            // Update in local inventory
            const index = this.inventory.findIndex(p => p.id === product.id);
            if (index !== -1) {
                this.inventory[index] = product;
            }
            
            this.emit('productUpdated', product);
            console.log('Product updated:', product.sku);
            
            return product;
            
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    }

    /**
     * Delete a product from inventory
     * @param {number} productId - Product ID to delete
     * @returns {Promise<boolean>} Success status
     */
    async deleteProduct(productId) {
        try {
            const product = this.inventory.find(p => p.id === productId);
            if (!product) {
                throw new Error('Producto no encontrado');
            }
            
            // Delete from database
            await this.db.deleteProduct(productId);
            
            // Remove from local inventory
            this.inventory = this.inventory.filter(p => p.id !== productId);
            
            this.emit('productDeleted', product);
            console.log('Product deleted:', product.sku);
            
            return true;
            
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }

    /**
     * Process a sale transaction
     * @param {string} identifier - Product SKU or barcode
     * @param {number} quantity - Quantity to sell
     * @returns {Promise<Object>} Sale result
     */
    async processSale(identifier, quantity) {
        try {
            const product = await this.findProduct(identifier);
            if (!product) {
                throw new Error('Producto no encontrado');
            }

            if (product.quantity < quantity) {
                throw new Error(`Stock insuficiente. Disponible: ${product.quantity}`);
            }

            // Update product quantity
            product.quantity -= quantity;
            await this.updateProduct(product);

            // Create sale record
            const sale = {
                productId: product.id,
                sku: product.sku,
                name: product.name,
                quantity: quantity,
                unitPrice: product.price,
                total: product.price * quantity,
                date: new Date().toISOString()
            };

            // Record sale
            await this.db.addSale(sale);
            
            this.emit('saleProcessed', { sale, product });
            console.log('Sale processed:', sale.sku, 'x', quantity);
            
            return { sale, product };
            
        } catch (error) {
            console.error('Error processing sale:', error);
            throw error;
        }
    }

    /**
     * Restock a product
     * @param {string} identifier - Product SKU or barcode
     * @param {number} quantity - Quantity to add
     * @returns {Promise<Object>} Updated product
     */
    async restockProduct(identifier, quantity) {
        try {
            const product = await this.findProduct(identifier);
            if (!product) {
                throw new Error('Producto no encontrado');
            }

            // Update product quantity
            product.quantity += quantity;
            await this.updateProduct(product);
            
            this.emit('productRestocked', { product, quantity });
            console.log('Product restocked:', product.sku, '+', quantity);
            
            return product;
            
        } catch (error) {
            console.error('Error restocking product:', error);
            throw error;
        }
    }

    /**
     * Adjust product stock
     * @param {number} productId - Product ID
     * @param {number} adjustment - Stock adjustment (positive or negative)
     * @returns {Promise<Object>} Updated product
     */
    async adjustStock(productId, adjustment) {
        try {
            const product = this.inventory.find(p => p.id === productId);
            if (!product) {
                throw new Error('Producto no encontrado');
            }

            const newQuantity = product.quantity + adjustment;
            if (newQuantity < 0) {
                throw new Error('La cantidad no puede ser negativa');
            }

            product.quantity = newQuantity;
            await this.updateProduct(product);
            
            this.emit('stockAdjusted', { product, adjustment });
            
            return product;
            
        } catch (error) {
            console.error('Error adjusting stock:', error);
            throw error;
        }
    }

    /**
     * Find a product by SKU or barcode
     * @param {string} identifier - SKU or barcode
     * @returns {Promise<Object|null>} Found product or null
     */
    async findProduct(identifier) {
        // Try to find by SKU first
        let product = this.inventory.find(p => p.sku === identifier.toUpperCase());
        
        // If not found, try by barcode
        if (!product) {
            product = await this.getProductByBarcode(identifier);
        }
        
        return product || null;
    }

    /**
     * Get product by SKU
     * @param {string} sku - Product SKU
     * @returns {Promise<Object|null>} Product or null
     */
    async getProductBySKU(sku) {
        return this.inventory.find(p => p.sku === sku.toUpperCase()) || 
               await this.db.getProductBySKU(sku.toUpperCase());
    }

    /**
     * Get product by barcode
     * @param {string} barcode - Product barcode
     * @returns {Promise<Object|null>} Product or null
     */
    async getProductByBarcode(barcode) {
        return this.inventory.find(p => p.barcode === barcode) || 
               await this.db.getProductByBarcode(barcode);
    }

    /**
     * Search products
     * @param {string} searchTerm - Search term
     * @param {string} category - Category filter (optional)
     * @returns {Array} Filtered products
     */
    searchProducts(searchTerm, category = '') {
        let results = this.inventory;
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(product =>
                product.sku.toLowerCase().includes(term) ||
                product.name.toLowerCase().includes(term) ||
                product.category.toLowerCase().includes(term) ||
                (product.barcode && product.barcode.includes(term)) ||
                (product.supplier && product.supplier.toLowerCase().includes(term))
            );
        }
        
        if (category) {
            results = results.filter(product => product.category === category);
        }
        
        return results;
    }

    /**
     * Get low stock products
     * @returns {Array} Products with low stock
     */
    getLowStockProducts() {
        return this.inventory.filter(product => product.quantity <= product.minStock);
    }

    /**
     * Get inventory statistics
     * @returns {Object} Statistics object
     */
    getStatistics() {
        const totalProducts = this.inventory.length;
        const lowStockProducts = this.getLowStockProducts();
        const totalValue = this.inventory.reduce((sum, product) => 
            sum + (product.price * product.quantity), 0);
        const categories = [...new Set(this.inventory.map(product => product.category))];
        
        return {
            totalProducts,
            lowStockCount: lowStockProducts.length,
            totalValue,
            categoriesCount: categories.length,
            categories,
            lowStockProducts,
            averageProductValue: totalProducts > 0 ? totalValue / totalProducts : 0,
            categoryBreakdown: categories.map(category => ({
                name: category,
                count: this.inventory.filter(p => p.category === category).length,
                value: this.inventory
                    .filter(p => p.category === category)
                    .reduce((sum, p) => sum + (p.price * p.quantity), 0)
            }))
        };
    }

    /**
     * Get all products
     * @returns {Array} All products
     */
    getAllProducts() {
        return [...this.inventory];
    }

    /**
     * Get products by category
     * @param {string} category - Category name
     * @returns {Array} Products in category
     */
    getProductsByCategory(category) {
        return this.inventory.filter(product => product.category === category);
    }

    /**
     * Get product suggestions for autocomplete
     * @param {string} query - Search query
     * @param {number} limit - Maximum number of suggestions
     * @returns {Array} Product suggestions
     */
    getProductSuggestions(query, limit = 5) {
        if (!query || query.length < 2) return [];
        
        const term = query.toLowerCase();
        const matches = this.inventory.filter(product =>
            product.sku.toLowerCase().includes(term) ||
            product.name.toLowerCase().includes(term) ||
            (product.barcode && product.barcode.includes(query))
        ).slice(0, limit);
        
        return matches.map(product => ({
            id: product.id,
            sku: product.sku,
            name: product.name,
            barcode: product.barcode,
            stock: product.quantity,
            price: product.price
        }));
    }

    /**
     * Validate product data
     * @param {Object} product - Product to validate
     * @throws {Error} Validation error
     */
    validateProduct(product) {
        const required = ['sku', 'name', 'category', 'price', 'quantity', 'minStock'];
        
        for (const field of required) {
            if (product[field] === undefined || product[field] === null || product[field] === '') {
                throw new Error(`Campo requerido: ${field}`);
            }
        }
        
        if (product.price < 0) {
            throw new Error('El precio no puede ser negativo');
        }
        
        if (product.quantity < 0) {
            throw new Error('La cantidad no puede ser negativa');
        }
        
        if (product.minStock < 0) {
            throw new Error('El stock mínimo no puede ser negativo');
        }
        
        if (product.sku.length < 3) {
            throw new Error('El SKU debe tener al menos 3 caracteres');
        }
        
        if (product.name.length < 3) {
            throw new Error('El nombre debe tener al menos 3 caracteres');
        }
    }

    /**
     * Export inventory data
     * @returns {Promise<Object>} Export data
     */
    async exportData() {
        try {
            const data = await this.db.exportData();
            console.log('Inventory data exported');
            return data;
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }

    /**
     * Import inventory data
     * @param {Object} data - Data to import
     * @returns {Promise<void>}
     */
    async importData(data) {
        try {
            await this.db.importData(data);
            await this.loadInventoryFromDB();
            this.emit('dataImported', data);
            console.log('Inventory data imported');
        } catch (error) {
            console.error('Error importing data:', error);
            throw error;
        }
    }

    /**
     * Event handling methods
     */
    on(event, handler) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    }

    emit(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('Error in event handler:', error);
                }
            });
        }
    }

    /**
     * Get backup recommendations based on inventory analysis
     * @returns {Object} Backup recommendations
     */
    getBackupRecommendations() {
        const stats = this.getStatistics();
        const recommendations = [];
        
        if (stats.lowStockCount > 0) {
            recommendations.push({
                type: 'warning',
                message: `${stats.lowStockCount} productos con stock bajo requieren atención`,
                action: 'restock'
            });
        }
        
        if (stats.totalProducts > 100) {
            recommendations.push({
                type: 'info',
                message: 'Se recomienda hacer respaldo semanal del inventario',
                action: 'backup'
            });
        }
        
        return {
            recommendations,
            lastUpdate: new Date().toISOString(),
            stats
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.eventHandlers = {};
        this.inventory = [];
        console.log('Inventory manager destroyed');
    }
}
