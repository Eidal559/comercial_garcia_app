/**
 * Barcode Scanner Module
 * Handles camera-based barcode scanning and USB scanner input
 */
class BarcodeScanner {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.scanning = false;
        this.stream = null;
        this.callback = null;
        this.scanningMode = null;
        
        // Configuration
        this.config = {
            video: {
                facingMode: 'environment', // Use back camera on mobile
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            scanningInterval: 100 // ms between scan attempts
        };
    }

    /**
     * Initialize scanner elements
     */
    init() {
        this.video = document.getElementById('barcode-video');
        this.canvas = document.getElementById('barcode-canvas');
        
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
        }

        this.setupUSBScannerSupport();
        console.log('Barcode scanner initialized');
    }

    /**
     * Start camera-based barcode scanning
     * @param {Function} callback - Callback function to handle scanned barcode
     * @param {string} mode - Scanning mode identifier
     */
    async startScanning(callback, mode = 'general') {
        this.callback = callback;
        this.scanningMode = mode;
        
        if (!this.video || !this.canvas) {
            this.init();
        }

        try {
            // Check if camera is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported in this browser');
            }

            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: this.config.video 
            });
            
            this.video.srcObject = this.stream;
            await this.video.play();
            
            this.scanning = true;
            document.getElementById('camera-container').style.display = 'block';
            
            // Setup canvas dimensions
            this.video.addEventListener('loadedmetadata', () => {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                this.scanFrame();
            });

            console.log('Camera scanning started');
            
        } catch (error) {
            console.error('Camera access error:', error);
            this.handleCameraError(error);
        }
    }

    /**
     * Scan a single frame for barcodes
     */
    scanFrame() {
        if (!this.scanning || !this.video || !this.canvas) return;

        // Draw current video frame to canvas
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        
        // Get image data for processing
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Process frame for barcode detection
        // Note: In a production environment, you would use a library like QuaggaJS or ZXing-js
        this.processFrameForBarcode(imageData);
        
        // Continue scanning
        if (this.scanning) {
            setTimeout(() => this.scanFrame(), this.config.scanningInterval);
        }
    }

    /**
     * Process frame data for barcode detection
     * This is a simplified implementation - use QuaggaJS or ZXing-js for production
     * @param {ImageData} imageData - Canvas image data
     */
    processFrameForBarcode(imageData) {
        // Simplified barcode detection simulation
        // In production, replace this with actual barcode detection library
        
        // For demonstration, we'll use a timeout to simulate detection
        if (Math.random() < 0.01) { // 1% chance per frame for demo
            // Simulate found barcode
            const simulatedBarcode = this.generateSimulatedBarcode();
            this.handleBarcodeDetected(simulatedBarcode);
        }
    }

    /**
     * Generate a simulated barcode for demo purposes
     * @returns {string}
     */
    generateSimulatedBarcode() {
        const sampleBarcodes = [
            '1234567890123',
            '2345678901234',
            '3456789012345',
            '4567890123456',
            '5678901234567'
        ];
        return sampleBarcodes[Math.floor(Math.random() * sampleBarcodes.length)];
    }

    /**
     * Handle detected barcode
     * @param {string} barcode - Detected barcode string
     */
    handleBarcodeDetected(barcode) {
        if (this.callback && typeof this.callback === 'function') {
            console.log('Barcode detected:', barcode);
            this.callback(barcode);
            this.stopScanning();
        }
    }

    /**
     * Stop camera scanning
     */
    stopScanning() {
        this.scanning = false;
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
                console.log('Camera track stopped');
            });
            this.stream = null;
        }

        if (this.video) {
            this.video.srcObject = null;
        }

        const cameraContainer = document.getElementById('camera-container');
        if (cameraContainer) {
            cameraContainer.style.display = 'none';
        }

        this.callback = null;
        this.scanningMode = null;
        console.log('Camera scanning stopped');
    }

    /**
     * Handle camera access errors
     * @param {Error} error - Camera error
     */
    handleCameraError(error) {
        let message = 'Error accediendo a la cámara: ';
        
        if (error.name === 'NotAllowedError') {
            message += 'Permiso de cámara denegado. Por favor, permita el acceso a la cámara.';
        } else if (error.name === 'NotFoundError') {
            message += 'No se encontró cámara. Use entrada manual.';
        } else if (error.name === 'NotSupportedError') {
            message += 'Cámara no soportada en este navegador.';
        } else {
            message += error.message;
        }

        if (window.showAlert) {
            window.showAlert(message, 'warning');
        } else {
            alert(message);
        }

        this.fallbackToManualInput();
    }

    /**
     * Setup USB barcode scanner support
     */
    setupUSBScannerSupport() {
        // USB barcode scanners typically work as keyboard input devices
        // They send the barcode followed by an Enter key
        
        let barcodeBuffer = '';
        let lastInputTime = 0;
        const INPUT_THRESHOLD = 50; // ms - typical time between USB scanner characters
        const MIN_BARCODE_LENGTH = 8;
        const MAX_BARCODE_LENGTH = 20;

        document.addEventListener('keydown', (event) => {
            const currentTime = Date.now();
            const timeDiff = currentTime - lastInputTime;
            
            // Check if this might be from a USB scanner (rapid input)
            if (timeDiff < INPUT_THRESHOLD && event.key.length === 1) {
                event.preventDefault();
                barcodeBuffer += event.key;
                lastInputTime = currentTime;
            } else if (event.key === 'Enter' && barcodeBuffer.length >= MIN_BARCODE_LENGTH) {
                // Barcode complete
                event.preventDefault();
                this.handleUSBScannerInput(barcodeBuffer.trim());
                barcodeBuffer = '';
            } else if (timeDiff > INPUT_THRESHOLD * 3) {
                // Reset buffer if too much time has passed
                barcodeBuffer = '';
                if (event.key.length === 1) {
                    barcodeBuffer = event.key;
                    lastInputTime = currentTime;
                }
            }
        });

        console.log('USB barcode scanner support enabled');
    }

    /**
     * Handle USB scanner input
     * @param {string} barcode - Scanned barcode from USB scanner
     */
    handleUSBScannerInput(barcode) {
        // Find the active input field that should receive the barcode
        const activeElement = document.activeElement;
        const barcodeInputs = [
            'barcode-search',
            'quick-barcode',
            'sell-sku',
            'restock-sku',
            'barcode'
        ];

        if (activeElement && barcodeInputs.includes(activeElement.id)) {
            activeElement.value = barcode;
            
            // Trigger appropriate action based on the input field
            switch (activeElement.id) {
                case 'barcode-search':
                    if (window.searchByBarcode) window.searchByBarcode();
                    break;
                case 'quick-barcode':
                    // Auto-focus quantity field for quick sale
                    const quickQuantity = document.getElementById('quick-quantity');
                    if (quickQuantity) quickQuantity.focus();
                    break;
                case 'sell-sku':
                    if (window.showSellProductInfo) window.showSellProductInfo(barcode);
                    break;
                case 'restock-sku':
                    if (window.showRestockProductInfo) window.showRestockProductInfo(barcode);
                    break;
            }

            console.log('USB scanner input processed:', barcode);
        }
    }

    /**
     * Fallback to manual input when camera is not available
     */
    fallbackToManualInput() {
        const message = 'Cámara no disponible. Puede usar:\n' +
                       '• Entrada manual de códigos\n' +
                       '• Escáner USB (automático)\n' +
                       '• Escáner Bluetooth conectado';
        
        if (window.showAlert) {
            window.showAlert(message, 'warning');
        }
        
        console.log('Fallback to manual input mode');
    }

    /**
     * Check if camera is supported
     * @returns {boolean}
     */
    static isCameraSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    /**
     * Test camera access without starting full scanning
     * @returns {Promise<boolean>}
     */
    async testCameraAccess() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' }
            });
            
            // Stop the test stream immediately
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.log('Camera test failed:', error.message);
            return false;
        }
    }

    /**
     * Get available camera devices
     * @returns {Promise<Array>}
     */
    async getCameraDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('Error getting camera devices:', error);
            return [];
        }
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.stopScanning();
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        console.log('Barcode scanner destroyed');
    }
}
