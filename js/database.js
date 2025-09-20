/**
 * Database Management using IndexedDB for local storage
 * Handles all database operations for Comercial García inventory system
 */
class InventoryDB {
    constructor() {
        this.dbName = 'ComercialGarciaDB';
        this.dbVersion = 1;
        this.db = null;
    }

    /**
     * Initialize database connection and create object stores
     * @returns {Promise<IDBDatabase>}
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database initialized successfully');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create products store
                if (!db.objectStoreNames.contains('products')) {
                    const store = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('sku', 'sku', { unique: true });
                    store.createIndex('barcode', 'barcode', { unique: false });
                    store.createIndex('category', 'category', { unique: false });
                    store.createIndex('name', 'name', { unique: false });
                    console.log('Products store created');
                }
                
                // Create sales store for future reporting
                if (!db.objectStoreNames.contains('sales')) {
                    const salesStore = db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
                    salesStore.createIndex('date', 'date', { unique: false });
                    salesStore.createIndex('sku', 'sku', { unique: false });
                    salesStore.createIndex('productId', 'productId', { unique: false });
                    console.log('Sales store created');
                }

                // Create suppliers store for future use
                if (!db.objectStoreNames.contains('suppliers')) {
                    const suppliersStore = db.createObjectStore('suppliers', { keyPath: 'id', autoIncrement: true });
                    suppliersStore.createIndex('name', 'name', { unique: true });
                    console.log('Suppliers store created');
                }
            };
        });
    }

    /**
     * Add a new product to the database
     * @param {Object} product - Product object to add
     * @returns {Promise<IDBValidKey>}
     */
    async addProduct(product) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            const request = store.add(product);
            
            request.onsuccess = () => {
                console.log('Product added:', product.sku);
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Update an existing product in the database
     * @param {Object} product - Product object to update
     * @returns {Promise<IDBValidKey>}
     */
    async updateProduct(product) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            const request = store.put(product);
            
            request.onsuccess = () => {
                console.log('Product updated:', product.sku);
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Delete a product from the database
     * @param {number} id - Product ID to delete
     * @returns {Promise<undefined>}
     */
    async deleteProduct(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            const request = store.delete(id);
            
            request.onsuccess = () => {
                console.log('Product deleted:', id);
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all products from the database
     * @returns {Promise<Array>}
     */
    async getAllProducts() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get a product by SKU
     * @param {string} sku - Product SKU
     * @returns {Promise<Object|undefined>}
     */
    async getProductBySKU(sku) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            const index = store.index('sku');
            const request = index.get(sku);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get a product by barcode
     * @param {string} barcode - Product barcode
     * @returns {Promise<Object|undefined>}
     */
    async getProductByBarcode(barcode) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            const index = store.index('barcode');
            const request = index.get(barcode);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Search products by name (partial match)
     * @param {string} searchTerm - Search term
     * @returns {Promise<Array>}
     */
    async searchProductsByName(searchTerm) {
        const allProducts = await this.getAllProducts();
        const lowercaseSearch = searchTerm.toLowerCase();
        
        return allProducts.filter(product => 
            product.name.toLowerCase().includes(lowercaseSearch) ||
            product.sku.toLowerCase().includes(lowercaseSearch) ||
            product.category.toLowerCase().includes(lowercaseSearch) ||
            (product.barcode && product.barcode.includes(searchTerm))
        );
    }

    /**
     * Get products by category
     * @param {string} category - Product category
     * @returns {Promise<Array>}
     */
    async getProductsByCategory(category) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            const index = store.index('category');
            const request = index.getAll(category);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Add a sale record
     * @param {Object} sale - Sale object
     * @returns {Promise<IDBValidKey>}
     */
    async addSale(sale) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['sales'], 'readwrite');
            const store = transaction.objectStore('sales');
            const request = store.add(sale);
            
            request.onsuccess = () => {
                console.log('Sale recorded:', sale.sku);
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all sales records
     * @returns {Promise<Array>}
     */
    async getAllSales() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['sales'], 'readonly');
            const store = transaction.objectStore('sales');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get sales by date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<Array>}
     */
    async getSalesByDateRange(startDate, endDate) {
        const allSales = await this.getAllSales();
        return allSales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= startDate && saleDate <= endDate;
        });
    }

    /**
     * Get low stock products
     * @returns {Promise<Array>}
     */
    async getLowStockProducts() {
        const allProducts = await this.getAllProducts();
        return allProducts.filter(product => product.quantity <= product.minStock);
    }

    /**
     * Export all data for backup
     * @returns {Promise<Object>}
     */
    async exportData() {
        const products = await this.getAllProducts();
        const sales = await this.getAllSales();
        
        return {
            version: this.dbVersion,
            exportDate: new Date().toISOString(),
            products: products,
            sales: sales,
            metadata: {
                totalProducts: products.length,
                totalSales: sales.length
            }
        };
    }

    /**
     * Import data from backup
     * @param {Object} data - Data object to import
     * @returns {Promise<void>}
     */
    async importData(data) {
        const transaction = this.db.transaction(['products', 'sales'], 'readwrite');
        const productsStore = transaction.objectStore('products');
        const salesStore = transaction.objectStore('sales');
        
        try {
            // Clear existing data
            await this.clearStore('products');
            await this.clearStore('sales');
            
            // Import products
            if (data.products && Array.isArray(data.products)) {
                for (const product of data.products) {
                    await this.addProduct(product);
                }
            }
            
            // Import sales
            if (data.sales && Array.isArray(data.sales)) {
                for (const sale of data.sales) {
                    await this.addSale(sale);
                }
            }
            
            console.log('Data imported successfully');
        } catch (error) {
            console.error('Error importing data:', error);
            throw error;
        }
    }

    /**
     * Clear a specific store
     * @param {string} storeName - Name of the store to clear
     * @returns {Promise<void>}
     */
    async clearStore(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log(`${storeName} store cleared`);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get database statistics
     * @returns {Promise<Object>}
     */
    async getStatistics() {
        const products = await this.getAllProducts();
        const sales = await this.getAllSales();
        const lowStockProducts = products.filter(p => p.quantity <= p.minStock);
        const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        const categories = [...new Set(products.map(p => p.category))];
        
        return {
            totalProducts: products.length,
            totalCategories: categories.length,
            lowStockCount: lowStockProducts.length,
            totalInventoryValue: totalValue,
            totalSales: sales.length,
            averageProductPrice: products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0,
            categoriesBreakdown: categories.map(cat => ({
                category: cat,
                count: products.filter(p => p.category === cat).length
            }))
        };
    }

    /**
     * Check if database is ready
     * @returns {boolean}
     */
    isReady() {
        return this.db !== null;
    }

    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            console.log('Database connection closed');
        }
    }
}
