export class FrameManager {
    constructor() {
        this.frameBuffer = [];
        this.maxBufferSize = 10;
        console.log('📦 Frame Manager initialized');
    }
    addFrame(imageData) {
        this.frameBuffer.push(imageData);
        // Maintain buffer size
        if (this.frameBuffer.length > this.maxBufferSize) {
            this.frameBuffer.shift();
        }
    }
    getLatestFrame() {
        return this.frameBuffer.length > 0 ? this.frameBuffer[this.frameBuffer.length - 1] : null;
    }
    clearBuffer() {
        this.frameBuffer = [];
    }
    getBufferSize() {
        return this.frameBuffer.length;
    }
}
