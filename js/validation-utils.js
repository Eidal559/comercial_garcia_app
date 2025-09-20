/**
 * Enhanced validation utilities
 */
class ValidationUtils {
    /**
     * Validate SKU format
     * @param {string} sku - SKU to validate
     * @returns {Object} Validation result
     */
    static validateSKU(sku) {
        const result = { isValid: true, errors: [] };
        
        if (!sku || typeof sku !== 'string') {
            result.isValid = false;
            result.errors.push('SKU es requerido');
            return result;
        }
        
        const cleanSKU = sku.trim().toUpperCase();
        
        if (cleanSKU.length < 3) {
            result.isValid = false;
            result.errors.push('SKU debe tener al menos 3 caracteres');
        }
        
        if (cleanSKU.length > 20) {
            result.isValid = false;
            result.errors.push('SKU no puede exceder 20 caracteres');
        }
        
        if (!/^[A-Z0-9-_]+$/.test(cleanSKU)) {
            result.isValid = false;
            result.errors.push('SKU solo puede contener letras, números, guiones y guiones bajos');
        }
        
        result.value = cleanSKU;
        return result;
    }
    
    /**
     * Validate barcode format
     * @param {string} barcode - Barcode to validate
     * @returns {Object} Validation result
     */
    static validateBarcode(barcode) {
        const result = { isValid: true, errors: [], value: barcode };
        
        if (!barcode) {
            return result; // Barcode is optional
        }
        
        const cleanBarcode = barcode.trim();
        
        // Common barcode lengths: UPC-A (12), EAN-13 (13), Code 128 (variable)
        if (cleanBarcode.length < 8 || cleanBarcode.length > 20) {
            result.isValid = false;
            result.errors.push('Código de barras debe tener entre 8 y 20 caracteres');
        }
        
        if (!/^[0-9]+$/.test(cleanBarcode)) {
            result.isValid = false;
            result.errors.push('Código de barras solo puede contener números');
        }
        
        result.value = cleanBarcode;
        return result;
    }
    
    /**
     * Validate price
     * @param {string|number} price - Price to validate
     * @returns {Object} Validation result
     */
    static validatePrice(price) {
        const result = { isValid: true, errors: [] };
        
        const numPrice = parseFloat(price);
        
        if (isNaN(numPrice)) {
            result.isValid = false;
            result.errors.push('Precio debe ser un número válido');
            return result;
        }
        
        if (numPrice < 0) {
            result.isValid = false;
            result.errors.push('Precio no puede ser negativo');
        }
        
        if (numPrice > 999999.99) {
            result.isValid = false;
            result.errors.push('Precio excede el máximo permitido');
        }
        
        result.value = Math.round(numPrice * 100) / 100; // Round to 2 decimals
        return result;
    }
    
    /**
     * Validate quantity
     * @param {string|number} quantity - Quantity to validate
     * @returns {Object} Validation result
     */
    static validateQuantity(quantity) {
        const result = { isValid: true, errors: [] };
        
        const numQuantity = parseInt(quantity);
        
        if (isNaN(numQuantity)) {
            result.isValid = false;
            result.errors.push('Cantidad debe ser un número entero válido');
            return result;
        }
        
        if (numQuantity < 0) {
            result.isValid = false;
            result.errors.push('Cantidad no puede ser negativa');
        }
        
        if (numQuantity > 999999) {
            result.isValid = false;
            result.errors.push('Cantidad excede el máximo permitido');
        }
        
        result.value = numQuantity;
        return result;
    }
    
    /**
     * Validate product name
     * @param {string} name - Product name to validate
     * @returns {Object} Validation result
     */
    static validateProductName(name) {
        const result = { isValid: true, errors: [] };
        
        if (!name || typeof name !== 'string') {
            result.isValid = false;
            result.errors.push('Nombre del producto es requerido');
            return result;
        }
        
        const cleanName = name.trim();
        
        if (cleanName.length < 3) {
            result.isValid = false;
            result.errors.push('Nombre debe tener al menos 3 caracteres');
        }
        
        if (cleanName.length > 100) {
            result.isValid = false;
            result.errors.push('Nombre no puede exceder 100 caracteres');
        }
        
        result.value = cleanName;
        return result;
    }
    
    /**
     * Validate complete product data
     * @param {Object} productData - Product data to validate
     * @returns {Object} Validation result with all field validations
     */
    static validateProduct(productData) {
        const result = {
            isValid: true,
            errors: [],
            validatedData: {},
            fieldErrors: {}
        };
        
        // Validate each field
        const fields = {
            sku: this.validateSKU(productData.sku),
            name: this.validateProductName(productData.name),
            price: this.validatePrice(productData.price),
            quantity: this.validateQuantity(productData.quantity),
            minStock: this.validateQuantity(productData.minStock),
            barcode: this.validateBarcode(productData.barcode)
        };
        
        // Check each field validation
        Object.keys(fields).forEach(fieldName => {
            const validation = fields[fieldName];
            if (!validation.isValid) {
                result.isValid = false;
                result.fieldErrors[fieldName] = validation.errors;
                result.errors.push(...validation.errors);
            } else {
                result.validatedData[fieldName] = validation.value;
            }
        });
        
        // Copy other fields
        if (productData.category) {
            result.validatedData.category = productData.category;
        }
        if (productData.supplier) {
            result.validatedData.supplier = productData.supplier.trim();
        }
        
        return result;
    }
}

// Add to your InventoryManager class:
/**
 * Enhanced validate product function using ValidationUtils
 * @param {Object} product - Product to validate
 * @throws {Error} Validation error with detailed messages
 */
function validateProduct(product) {
    const validation = ValidationUtils.validateProduct(product);
    
    if (!validation.isValid) {
        const errorMessage = validation.errors.join(', ');
        throw new Error(`Errores de validación: ${errorMessage}`);
    }
    
    return validation.validatedData;
}
