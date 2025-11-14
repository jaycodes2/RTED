import { FrameManager } from './frame-manager.js';
import { StatsDisplay } from './stats-display.js';

class EdgeDetectionViewer {
    private canvas!: HTMLCanvasElement;
    private context!: CanvasRenderingContext2D;
    private frameManager!: FrameManager;
    private statsDisplay!: StatsDisplay;

    // UI Elements
    private fpsCounter!: HTMLElement;
    private resolutionDisplay!: HTMLElement;
    private modeDisplay!: HTMLElement;
    private frameCount!: HTMLElement;
    private lastUpdate!: HTMLElement;
    private connectionStatus!: HTMLElement;

    // Buttons
    private btnRaw!: HTMLButtonElement;
    private btnGrayscale!: HTMLButtonElement;
    private btnEdgeDetection!: HTMLButtonElement;
    private btnLoadSample!: HTMLButtonElement;
    private btnSimulateStream!: HTMLButtonElement;
    private btnSimulateWebSocket!: HTMLButtonElement;

    private currentMode: 'raw' | 'grayscale' | 'edge' = 'raw';
    private isSimulating: boolean = false;
    private simulationInterval?: number;
    private isWebSocketConnected: boolean = false;

    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.frameManager = new FrameManager();
        this.statsDisplay = new StatsDisplay();

        // Load initial sample frame
        this.loadSampleFrame();

        console.log('🔍 Edge Detection Viewer initialized');
    }

    private initializeElements(): void {
        // Canvas setup
        const canvasElement = document.getElementById('frameCanvas');
        if (!canvasElement) {
            throw new Error('Canvas element not found');
        }
        this.canvas = canvasElement as HTMLCanvasElement;

        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error('Canvas 2D context not supported');
        }
        this.context = context;

        // Stats elements
        this.fpsCounter = this.getElement('fpsCounter');
        this.resolutionDisplay = this.getElement('resolutionDisplay');
        this.modeDisplay = this.getElement('modeDisplay');
        this.frameCount = this.getElement('frameCount');
        this.lastUpdate = this.getElement('lastUpdate');
        this.connectionStatus = this.getElement('connectionStatus');

        // Control buttons
        this.btnRaw = this.getElement('btnRaw') as HTMLButtonElement;
        this.btnGrayscale = this.getElement('btnGrayscale') as HTMLButtonElement;
        this.btnEdgeDetection = this.getElement('btnEdgeDetection') as HTMLButtonElement;
        this.btnLoadSample = this.getElement('btnLoadSample') as HTMLButtonElement;
        this.btnSimulateStream = this.getElement('btnSimulateStream') as HTMLButtonElement;
        this.btnSimulateWebSocket = this.getElement('btnSimulateWebSocket') as HTMLButtonElement;
    }

    private getElement(id: string): HTMLElement {
        const element = document.getElementById(id);
        if (!element) {
            throw new Error(`Element with id '${id}' not found`);
        }
        return element;
    }

    private setupEventListeners(): void {
        // Mode toggle buttons
        this.btnRaw.addEventListener('click', () => this.setMode('raw'));
        this.btnGrayscale.addEventListener('click', () => this.setMode('grayscale'));
        this.btnEdgeDetection.addEventListener('click', () => this.setMode('edge'));

        // Action buttons
        this.btnLoadSample.addEventListener('click', () => this.loadSampleFrame());
        this.btnSimulateStream.addEventListener('click', () => this.toggleSimulation());
        this.btnSimulateWebSocket.addEventListener('click', () => this.simulateWebSocketConnection());

        // Window resize handling
        window.addEventListener('resize', () => this.handleResize());
    }

    private setMode(mode: 'raw' | 'grayscale' | 'edge'): void {
        this.currentMode = mode;

        // Update active button styles
        this.btnRaw.classList.toggle('mode-active', mode === 'raw');
        this.btnGrayscale.classList.toggle('mode-active', mode === 'grayscale');
        this.btnEdgeDetection.classList.toggle('mode-active', mode === 'edge');

        // Update mode display
        this.modeDisplay.textContent = this.getModeDisplayName(mode);

        console.log(`🎛️ Mode changed to: ${mode}`);

        // If WebSocket is "connected", simulate sending mode change to Android
        if (this.isWebSocketConnected) {
            console.log(`📱 WebSocket: Sending mode change to Android: ${mode}`);
        }

        // Reload sample frame with new mode
        this.loadSampleFrame();
    }

    private getModeDisplayName(mode: string): string {
        const names: { [key: string]: string } = {
            'raw': 'Raw Camera',
            'grayscale': 'Grayscale',
            'edge': 'Edge Detection'
        };
        return names[mode] || mode;
    }

    // WebSocket simulation method
    private simulateWebSocketConnection(): void {
        if (this.isWebSocketConnected) {
            this.disconnectWebSocket();
        } else {
            this.connectWebSocket();
        }
    }

    private connectWebSocket(): void {
        console.log("🔗 WebSocket: Connecting to Android app...");

        // Simulate connection delay
        setTimeout(() => {
            this.isWebSocketConnected = true;
            this.connectionStatus.textContent = "🟢 Connected";
            this.btnSimulateWebSocket.textContent = "🔌 Disconnect WS";
            this.btnSimulateWebSocket.classList.add('websocket-active');

            console.log("✅ WebSocket: Connected to Android app");
            console.log("📡 WebSocket: Receiving real-time frames...");

            // Update connection status display
            const statusElement = document.getElementById('websocketStatus');
            if (statusElement) {
                statusElement.textContent = "✅ WebSocket: Connected to Android app - Receiving real-time frames";
                statusElement.className = "connection-status connected";
            }

            // Simulate receiving first frame from Android
            setTimeout(() => {
                console.log("🖼️ WebSocket: Received frame from Android");
                this.loadSampleFrame();

                // Simulate continuous frame streaming
                this.simulateWebSocketStream();
            }, 500);

        }, 1000);
    }

    private disconnectWebSocket(): void {
        console.log("🔌 WebSocket: Disconnecting from Android app...");

        this.isWebSocketConnected = false;
        this.connectionStatus.textContent = "🔴 Disconnected";
        this.btnSimulateWebSocket.textContent = "🔗 Simulate WebSocket";
        this.btnSimulateWebSocket.classList.remove('websocket-active');

        // Update connection status display
        const statusElement = document.getElementById('websocketStatus');
        if (statusElement) {
            statusElement.textContent = "⚡ WebSocket: Ready to connect to Android app";
            statusElement.className = "connection-status disconnected";
        }

        console.log("❌ WebSocket: Disconnected from Android app");
    }

    private simulateWebSocketStream(): void {
        if (!this.isWebSocketConnected) return;

        // Simulate receiving frames every second
        setTimeout(() => {
            if (this.isWebSocketConnected) {
                console.log("🖼️ WebSocket: Received real-time frame from Android");
                this.loadSampleFrame();
                this.simulateWebSocketStream(); // Continue streaming
            }
        }, 1000);
    }

    private async loadSampleFrame(): Promise<void> {
        try {
            // Create a sample processed frame (simulating Android output)
            const sampleFrame = this.createSampleFrame();
            this.displayFrame(sampleFrame);

            this.updateStats({
                fps: this.isWebSocketConnected ? 15 : 30,
                width: sampleFrame.width,
                height: sampleFrame.height,
                frameCount: parseInt(this.frameCount.textContent || '0') + 1,
                mode: this.currentMode
            });

            console.log('🖼️ Sample frame loaded');
        } catch (error) {
            console.error('❌ Failed to load sample frame:', error);
        }
    }

    private createSampleFrame(): ImageData {
        const width = 640;
        const height = 480;
        const imageData = this.context.createImageData(width, height);

        // Create a simple test pattern that simulates edge detection
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;

                // Simulate different processing modes
                if (this.currentMode === 'raw') {
                    // Color gradient
                    imageData.data[index] = (x / width) * 255;     // R
                    imageData.data[index + 1] = (y / height) * 255; // G
                    imageData.data[index + 2] = 128;               // B
                    imageData.data[index + 3] = 255;               // A
                } else if (this.currentMode === 'grayscale') {
                    // Grayscale gradient
                    const intensity = ((x + y) / (width + height)) * 255;
                    imageData.data[index] = intensity;     // R
                    imageData.data[index + 1] = intensity; // G
                    imageData.data[index + 2] = intensity; // B
                    imageData.data[index + 3] = 255;       // A
                } else { // edge detection
                    // Black background with white edges
                    const isEdge = Math.sin(x * 0.1) > 0.9 || Math.sin(y * 0.1) > 0.9;
                    const value = isEdge ? 255 : 0;
                    imageData.data[index] = value;     // R
                    imageData.data[index + 1] = value; // G
                    imageData.data[index + 2] = value; // B
                    imageData.data[index + 3] = 255;   // A
                }
            }
        }

        return imageData;
    }

    private displayFrame(imageData: ImageData): void {
        // Resize canvas to match frame dimensions
        this.canvas.width = imageData.width;
        this.canvas.height = imageData.height;

        // Draw the frame
        this.context.putImageData(imageData, 0, 0);

        // Update last update timestamp
        this.lastUpdate.textContent = new Date().toLocaleTimeString();
    }

    private updateStats(stats: {
        fps: number;
        width: number;
        height: number;
        frameCount: number;
        mode: string;
    }): void {
        this.fpsCounter.textContent = stats.fps.toString();
        this.resolutionDisplay.textContent = `${stats.width}×${stats.height}`;
        this.frameCount.textContent = stats.frameCount.toString();
    }

    private toggleSimulation(): void {
        if (this.isSimulating) {
            this.stopSimulation();
        } else {
            this.startSimulation();
        }
    }

    private startSimulation(): void {
        this.isSimulating = true;
        this.btnSimulateStream.textContent = '⏹️ Stop Simulation';

        let frameCount = 0;
        const targetFPS = 15; // Simulate real-time stream

        this.simulationInterval = window.setInterval(() => {
            const sampleFrame = this.createSampleFrame();
            this.displayFrame(sampleFrame);

            frameCount++;
            this.updateStats({
                fps: targetFPS,
                width: sampleFrame.width,
                height: sampleFrame.height,
                frameCount: frameCount,
                mode: this.currentMode
            });
        }, 1000 / targetFPS);

        console.log('🎬 Simulation started');
    }

    private stopSimulation(): void {
        this.isSimulating = false;
        this.btnSimulateStream.textContent = '🎬 Simulate Live Stream';

        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = undefined;
        }

        console.log('⏹️ Simulation stopped');
    }

    private handleResize(): void {
        // Maintain aspect ratio or adjust layout on resize
        console.log('📐 Window resized');
    }

    // Public method to receive frames from Android app (for future integration)
    public receiveFrame(imageData: ImageData, metadata: any): void {
        this.displayFrame(imageData);
        this.updateStats({
            fps: metadata.fps || 0,
            width: imageData.width,
            height: imageData.height,
            frameCount: parseInt(this.frameCount.textContent || '0') + 1,
            mode: this.currentMode
        });
    }
}

// Initialize the viewer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EdgeDetectionViewer();
});

// Export for potential module usage
export { EdgeDetectionViewer };