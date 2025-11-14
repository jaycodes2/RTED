import { WebSocketServer, WebSocket } from 'ws';
class MockFrameServer {
    constructor(port = 8080) {
        this.clients = new Map();
        this.isStreaming = false;
        this.frameCount = 0;
        this.wss = new WebSocketServer({ port });
        console.log(`🚀 Mock WebSocket Server started on port ${port}`);
        this.setupServer();
        this.startFrameStream();
    }
    setupServer() {
        this.wss.on('connection', (ws) => {
            const clientId = this.generateClientId();
            const metadata = {
                id: clientId,
                joined: new Date()
            };
            this.clients.set(ws, metadata);
            console.log(`✅ Client connected: ${clientId} (Total: ${this.clients.size})`);
            // Send welcome message
            this.sendToClient(ws, {
                type: 'welcome',
                clientId: clientId,
                message: 'Connected to Mock Frame Server',
                timestamp: Date.now()
            });
            // Handle messages from client
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleClientMessage(ws, message);
                }
                catch (error) {
                    console.error('❌ Failed to parse client message:', error);
                }
            });
            // Handle client disconnect
            ws.on('close', () => {
                this.clients.delete(ws);
                console.log(`❌ Client disconnected: ${clientId} (Remaining: ${this.clients.size})`);
            });
            ws.on('error', (error) => {
                console.error(`❌ WebSocket error for ${clientId}:`, error);
            });
        });
    }
    handleClientMessage(ws, message) {
        console.log(`📨 Received from ${this.clients.get(ws)?.id}:`, message);
        switch (message.type) {
            case 'mode_change':
                this.handleModeChange(ws, message);
                break;
            case 'command':
                this.handleCommand(ws, message);
                break;
            case 'ping':
                this.sendToClient(ws, { type: 'pong', timestamp: Date.now() });
                break;
            default:
                console.warn('⚠️ Unknown message type:', message.type);
        }
    }
    handleModeChange(ws, message) {
        const clientId = this.clients.get(ws)?.id;
        console.log(`🎛️ Client ${clientId} changed mode to: ${message.mode}`);
        // Acknowledge mode change
        this.sendToClient(ws, {
            type: 'mode_change_ack',
            mode: message.mode,
            timestamp: Date.now()
        });
    }
    handleCommand(ws, message) {
        const clientId = this.clients.get(ws)?.id;
        console.log(`⚡ Client ${clientId} sent command: ${message.command}`);
        // Handle different commands
        switch (message.command) {
            case 'start_stream':
                this.isStreaming = true;
                break;
            case 'stop_stream':
                this.isStreaming = false;
                break;
            case 'get_stats':
                this.sendStats(ws);
                break;
        }
    }
    startFrameStream() {
        // Send frames to all connected clients at 15 FPS
        this.frameInterval = setInterval(() => {
            if (this.clients.size > 0 && this.isStreaming) {
                this.broadcastFrame();
            }
        }, 1000 / 15); // 15 FPS
    }
    broadcastFrame() {
        this.frameCount++;
        const frameMessage = {
            type: 'frame',
            frameId: this.frameCount,
            fps: 15,
            width: 640,
            height: 480,
            mode: 'raw', // This would change based on client mode
            timestamp: Date.now(),
            data: {
                // In a real implementation, this would contain actual frame data
                format: 'mock',
                description: 'Simulated frame data from Android app'
            }
        };
        this.broadcast(frameMessage);
    }
    sendStats(ws) {
        const statsMessage = {
            type: 'stats',
            clients: this.clients.size,
            totalFrames: this.frameCount,
            streaming: this.isStreaming,
            uptime: process.uptime(),
            timestamp: Date.now()
        };
        this.sendToClient(ws, statsMessage);
    }
    sendToClient(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    broadcast(message) {
        this.clients.forEach((metadata, ws) => {
            this.sendToClient(ws, message);
        });
    }
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    stop() {
        if (this.frameInterval) {
            clearInterval(this.frameInterval);
        }
        this.wss.close();
        console.log('🛑 Mock WebSocket Server stopped');
    }
}
// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const port = parseInt(process.argv[2]) || 8080;
    new MockFrameServer(port);
}
export { MockFrameServer };
