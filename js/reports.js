/**
 * Reports Functionality
 * Handles report generation and analytics
 */

// Generate inventory report
function generateInventoryReport() {
    if (!window.checkPermission('canViewReports')) {
        alert('No permission to view reports');
        return;
    }
    
    if (!window.inventoryManager) {
        alert('Inventory manager not ready');
        return;
    }
    
    const products = window.inventoryManager.getAllProducts();
    const stats = window.inventoryManager.getStatistics();
    
    const reportContent = document.getElementById('report-content');
    reportContent.innerHTML = `
        <div style="background: white; padding: 25px; border-radius: 15px; border: 2px solid #27ae60;">
            <h3 style="color: #27ae60; margin-bottom: 20px;">📊 Complete Inventory Report</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                    <div style="font-size: 2rem; font-weight: bold; color: #27ae60;">${stats.totalProducts}</div>
                    <div>Total Products</div>
                </div>
                <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                    <div style="font-size: 2rem; font-weight: bold; color: #e67e22;">$${stats.totalValue.toFixed(2)}</div>
                    <div>Total Value</div>
                </div>
                <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                    <div style="font-size: 2rem; font-weight: bold; color: #3498db;">${stats.categoriesCount}</div>
                    <div>Categories</div>
                </div>
            </div>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <button class="btn" onclick="window.print()" style="margin-top: 15px;">🖨️ Print</button>
        </div>
    `;
}

// Generate low stock report
function generateLowStockReport() {
    if (!window.inventoryManager) {
        alert('Inventory manager not ready');
        return;
    }
    
    const lowStockProducts = window.inventoryManager.getLowStockProducts();
    
    const reportContent = document.getElementById('report-content');
    reportContent.innerHTML = `
        <div style="background: white; padding: 25px; border-radius: 15px; border: 2px solid #e67e22;">
            <h3 style="color: #e67e22; margin-bottom: 20px;">⚠️ Low Stock Report</h3>
            ${lowStockProducts.length === 0 ? 
                '<p style="color: #27ae60; font-size: 1.2rem;">✅ All products have adequate stock</p>' :
                `<div style="margin-bottom: 20px;">
                    <p><strong>${lowStockProducts.length}</strong> products require restocking:</p>
                    <ul style="margin-top: 15px;">
                        ${lowStockProducts.map(product => 
                            `<li style="margin-bottom: 8px; padding: 8px; background: #fff3cd; border-radius: 5px;">
                                <strong>${product.name}</strong> (${product.sku}) - 
                                Stock: ${product.quantity} / Minimum: ${product.minStock}
                            </li>`
                        ).join('')}
                    </ul>
                </div>`
            }
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>
    `;
}

// Generate sales report
function generateSalesReport() {
    const reportContent = document.getElementById('report-content');
    reportContent.innerHTML = `
        <div style="background: white; padding: 25px; border-radius: 15px; border: 2px solid #3498db;">
            <h3 style="color: #3498db; margin-bottom: 20px;">💰 Sales Report</h3>
            <p style="color: #7f8c8d;">This feature will be available in a future update.</p>
            <p>Will include:</p>
            <ul style="margin-top: 15px; color: #7f8c8d;">
                <li>Sales by period</li>
                <li>Best-selling products</li>
                <li>Trend analysis</li>
                <li>Total revenue</li>
            </ul>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>
    `;
}

// Generate security report
function generateSecurityReport() {
    if (!window.checkPermission('canViewReports') || (window.authSystem && window.authSystem.getCurrentUser() !== 'admin')) {
        alert('Only administrator can view security log');
        return;
    }
    
    const securityLog = window.authSystem ? window.authSystem.getSecurityLog(50) : [];
    
    const reportContent = document.getElementById('report-content');
    reportContent.innerHTML = `
        <div style="background: white; padding: 25px; border-radius: 15px; border: 2px solid #e74c3c;">
            <h3 style="color: #e74c3c; margin-bottom: 20px;">🔐 Security Log</h3>
            ${securityLog.length === 0 ? 
                '<p>No security events recorded</p>' :
                `<div style="max-height: 400px; overflow-y: auto;">
                    ${securityLog.map(event => 
                        `<div style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px; border-left: 3px solid ${
                            event.event.includes('SUCCESS') ? '#27ae60' : 
                            event.event.includes('FAILED') ? '#e74c3c' : '#3498db'
                        };">
                            <strong>${event.event}</strong> - ${event.user || 'N/A'}<br>
                            <small>${new Date(event.timestamp).toLocaleString()}</small>
                        </div>`
                    ).join('')}
                </div>`
            }
            <p style="margin-top: 15px;"><strong>Last 50 events - Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>
    `;
}

// Setup report button listeners
document.addEventListener('DOMContentLoaded', function() {
    function setupReportButtons() {
        // Inventory Report
        const inventoryReportBtn = document.getElementById('inventory-report');
        if (inventoryReportBtn) {
            inventoryReportBtn.addEventListener('click', generateInventoryReport);
        }
        
        // Low Stock Report
        const lowStockReportBtn = document.getElementById('low-stock-report');
        if (lowStockReportBtn) {
            lowStockReportBtn.addEventListener('click', generateLowStockReport);
        }
        
        // Sales Report
        const salesReportBtn = document.getElementById('sales-report');
        if (salesReportBtn) {
            salesReportBtn.addEventListener('click', generateSalesReport);
        }
        
        // Security Report
        const securityReportBtn = document.getElementById('security-report');
        if (securityReportBtn) {
            securityReportBtn.addEventListener('click', generateSecurityReport);
        }
        
        console.log('✅ Report buttons setup complete');
    }
    
    // Setup with delay to ensure DOM is ready
    setTimeout(setupReportButtons, 2000);
});

// Export/Import functionality
function setupImportExport() {
    // Export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async function() {
            try {
                if (!window.inventoryManager) {
                    alert('Inventory manager not ready');
                    return;
                }
                
                const data = await window.inventoryManager.exportData();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `stockpile-backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                alert('Backup exported successfully!');
            } catch (error) {
                alert('Export error: ' + error.message);
            }
        });
    }
    
    // Import file
    const importFile = document.getElementById('import-file');
    if (importFile) {
        importFile.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;

            try {
                if (!window.inventoryManager) {
                    alert('Inventory manager not ready');
                    return;
                }
                
                const text = await file.text();
                const data = JSON.parse(text);
                await window.inventoryManager.importData(data);
                alert('Data imported successfully!');
            } catch (error) {
                alert('Import error: ' + error.message);
            }
        });
    }
}

// Setup import/export when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(setupImportExport, 2000);
});

// Make functions globally available
window.generateInventoryReport = generateInventoryReport;
window.generateLowStockReport = generateLowStockReport;
window.generateSalesReport = generateSalesReport;
window.generateSecurityReport = generateSecurityReport;

console.log('✅ Reports functionality loaded');
