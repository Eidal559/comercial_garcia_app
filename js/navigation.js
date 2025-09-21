/**
 * Navigation Functionality
 * Handles section switching and UI navigation
 */

// Global navigation function
function showSection(sectionId) {
    console.log('🧭 Showing section:', sectionId);
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        console.log('✅ Section shown:', sectionId);
    } else {
        console.error('❌ Section not found:', sectionId);
        return;
    }
    
    // Activate current nav button
    const currentButton = document.querySelector(`[data-section="${sectionId}"]`);
    if (currentButton) {
        currentButton.classList.add('active');
    }
    
    // Update section content if needed
    updateSectionContent(sectionId);
}

// Update section content when navigating
function updateSectionContent(sectionId) {
    setTimeout(() => {
        if (sectionId === 'dashboard' && window.inventoryManager) {
            updateDashboardStats();
        } else if (sectionId === 'inventory' && window.inventoryManager) {
            displayInventoryTable();
        }
    }, 100);
}

// Update dashboard statistics
function updateDashboardStats() {
    if (!window.inventoryManager) return;
    
    try {
        const stats = window.inventoryManager.getStatistics();
        
        const totalProductsEl = document.getElementById('total-products');
        const lowStockCountEl = document.getElementById('low-stock-count');
        const totalValueEl = document.getElementById('total-value');
        const categoriesCountEl = document.getElementById('categories-count');
        
        if (totalProductsEl) totalProductsEl.textContent = stats.totalProducts;
        if (lowStockCountEl) lowStockCountEl.textContent = stats.lowStockCount;
        if (totalValueEl) totalValueEl.textContent = `$${stats.totalValue.toFixed(2)}`;
        if (categoriesCountEl) categoriesCountEl.textContent = stats.categoriesCount;
        
        // Update alerts
        const alertsEl = document.getElementById('low-stock-alerts');
        if (alertsEl) {
            if (stats.lowStockCount > 0) {
                alertsEl.innerHTML = `
                    <div class="alert alert-warning">
                        <strong>⚠️ Low Stock Alert!</strong><br>
                        ${stats.lowStockProducts.map(item => 
                            `${item.name} (${item.sku}): ${item.quantity} remaining`
                        ).join('<br>')}
                    </div>
                `;
            } else {
                alertsEl.innerHTML = '<div class="alert alert-success"><strong>✅ All products have good stock!</strong></div>';
            }
        }
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

// Display inventory table
function displayInventoryTable() {
    if (!window.inventoryManager) return;
    
    try {
        const products = window.inventoryManager.getAllProducts();
        const inventoryBody = document.getElementById('inventory-body');
        
        if (!inventoryBody) return;
        
        inventoryBody.innerHTML = '';
        
        products.forEach(item => {
            const row = document.createElement('tr');
            if (item.quantity <= item.minStock) {
                row.classList.add('low-stock');
            }
            
            row.innerHTML = `
                <td>${item.sku}</td>
                <td>
                    ${item.name}
                    ${item.barcode ? '<br><small style="color: #7f8c8d;">BC: ' + item.barcode + '</small>' : ''}
                    ${item.supplier ? '<br><small style="color: #7f8c8d;">Supplier: ' + item.supplier + '</small>' : ''}
                </td>
                <td>${item.category}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>${item.minStock}</td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
                <td class="action-buttons">
                    <button class="btn btn-warning" onclick="quickAdjust(${item.id}, 'add')" title="Add stock">+</button>
                    <button class="btn btn-warning" onclick="quickAdjust(${item.id}, 'subtract')" title="Remove stock">-</button>
                    <button class="btn btn-danger" onclick="deleteProduct(${item.id})" title="Delete product">🗑️</button>
                </td>
            `;
            inventoryBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error displaying inventory:', error);
    }
}

// Setup navigation when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    function setupNavigation() {
        console.log('📋 Setting up navigation...');
        
        const navButtons = document.querySelectorAll('.nav-btn[data-section]');
        console.log('Found nav buttons:', navButtons.length);
        
        navButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const sectionId = this.getAttribute('data-section');
                console.log('🖱️ Navigation button clicked:', sectionId);
                showSection(sectionId);
            });
        });
        
        // Show dashboard by default
        setTimeout(() => {
            showSection('dashboard');
        }, 500);
    }
    
    // Setup navigation with delay to ensure DOM is ready
    setTimeout(setupNavigation, 1000);
});

// Setup keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey) {
        const shortcuts = {
            '1': 'dashboard',
            '2': 'add-product',
            '3': 'inventory',
            '4': 'sell',
            '5': 'restock',
            '6': 'barcode',
            '7': 'reports'
        };
        
        if (shortcuts[e.key]) {
            e.preventDefault();
            showSection(shortcuts[e.key]);
        }
    }
});

// Make navigation function globally available
window.showSection = showSection;

console.log('✅ Navigation functionality loaded');
