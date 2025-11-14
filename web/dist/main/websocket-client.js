export class WebSocketClient {
    constructor(serverUrl = 'ws://localhost:8080') {
        this.serverUrl = serverUrl;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        this.isConnected = false;
        console.log('🔌 WebSocket Client initialized');
    }
    connect() {
        try {
            console.log(`🔗 Connecting to WebSocket: ${this.serverUrl}`);
            this.ws = new WebSocket(this.serverUrl);
            this.ws.onopen = () => {
                console.log('✅ WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.onConnected?.();
            };
            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };
            this.ws.onclose = (event) => {
                console.log('🔌 WebSocket disconnected:', event.code, event.reason);
                this.isConnected = false;
                this.onDisconnected?.();
                this.attemptReconnect();
            };
            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.onError?.('WebSocket connection error');
            };
        }
        catch (error) {
            console.error('❌ Failed to create WebSocket:', error);
            this.onError?.('Failed to create WebSocket connection');
        }
    }
    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            switch (message.type) {
                case 'frame':
                    this.handleFrameMessage(message);
                    break;
                case 'stats':
                    this.handleStatsMessage(message);
                    break;
                case 'mode_change':
                    this.handleModeChangeMessage(message);
                    break;
                default:
                    console.warn('⚠️ Unknown message type:', message.type);
            }
        }
        catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
        }
    }
    handleFrameMessage(message) {
        // In a real app, this would decode base64 image data
        // For now, we'll simulate frame processing
        console.log('📦 Received frame message:', message);
        // Simulate creating an image data object
        const mockImageData = this.createMockImageData(640, 480);
        const metadata = {
            fps: message.fps || 30,
            width: 640,
            height: 480,
            timestamp: message.timestamp || Date.now(),
            mode: message.mode || 'raw'
        };
        this.onFrameReceived?.(mockImageData, metadata);
    }
    handleStatsMessage(message) {
        console.log('📊 Received stats update:', message);
        // Stats would be handled by the main viewer
    }
    handleModeChangeMessage(message) {
        console.log('🎛️ Received mode change:', message.mode);
        // Mode changes would be handled by the main viewer
    }
    createMockImageData(width, height) {
        // Create a canvas context to generate ImageData
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const imageData = context.createImageData(width, height);
        // Create a simple animated pattern
        const time = Date.now() / 1000;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                // Animated gradient pattern
                const r = Math.sin(x * 0.02 + time) * 127 + 128;
                const g = Math.cos(y * 0.02 + time) * 127 + 128;
                const b = Math.sin((x + y) * 0.01 + time * 2) * 127 + 128;
                imageData.data[index] = r; // R
                imageData.data[index + 1] = g; // G
                imageData.data[index + 2] = b; // B
                imageData.data[index + 3] = 255; // A
            }
        }
        return imageData;
    }
    sendModeChange(mode) {
        if (this.isConnected && this.ws) {
            const message = {
                type: 'mode_change',
                mode: mode,
                timestamp: Date.now()
            };
            this.ws.send(JSON.stringify(message));
            console.log(`📤 Sent mode change: ${mode}`);
        }
        else {
            console.warn('⚠️ WebSocket not connected, cannot send mode change');
        }
    }
    sendCommand(command, data) {
        if (this.isConnected && this.ws) {
            const message = {
                type: 'command',
                command: command,
                data: data,
                timestamp: Date.now()
            };
            this.ws.send(JSON.stringify(message));
            console.log(`📤 Sent command: ${command}`);
        }
    }
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Attempting reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms`);
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay);
        }
        else {
            console.error('❌ Max reconnection attempts reached');
        }
    }
    disconnect() {
        if (this.ws) {
            this.ws.close(1000, 'Client disconnected');
            this.ws = null;
        }
        this.isConnected = false;
    }
    getConnectionStatus() {
        return this.isConnected;
    }
    getReconnectAttempts() {
        return this.reconnectAttempts;
    }
}
