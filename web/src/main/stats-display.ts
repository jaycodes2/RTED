export class StatsDisplay {
    private startTime: number;
    private frameCount: number;
    private fps: number;

    constructor() {
        this.startTime = Date.now();
        this.frameCount = 0;
        this.fps = 0;

        console.log('📊 Stats Display initialized');
    }

    public updateFrame(): void {
        this.frameCount++;

        // Calculate FPS every second
        const currentTime = Date.now();
        const elapsed = (currentTime - this.startTime) / 1000;

        if (elapsed >= 1) {
            this.fps = this.frameCount / elapsed;
            this.frameCount = 0;
            this.startTime = currentTime;
        }
    }

    public getFPS(): number {
        return Math.round(this.fps * 10) / 10; // Round to 1 decimal
    }

    public reset(): void {
        this.startTime = Date.now();
        this.frameCount = 0;
        this.fps = 0;
    }
}