export class FrameManager {
    private frameBuffer: ImageData[] = [];
    private maxBufferSize: number = 10;

    constructor() {
        console.log('📦 Frame Manager initialized');
    }

    public addFrame(imageData: ImageData): void {
        this.frameBuffer.push(imageData);

        // Maintain buffer size
        if (this.frameBuffer.length > this.maxBufferSize) {
            this.frameBuffer.shift();
        }
    }

    public getLatestFrame(): ImageData | null {
        return this.frameBuffer.length > 0 ? this.frameBuffer[this.frameBuffer.length - 1] : null;
    }

    public clearBuffer(): void {
        this.frameBuffer = [];
    }

    public getBufferSize(): number {
        return this.frameBuffer.length;
    }
}