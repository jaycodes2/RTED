export class StatsDisplay {
    constructor() {
        this.startTime = Date.now();
        this.frameCount = 0;
        this.fps = 0;
        console.log('📊 Stats Display initialized');
    }
    updateFrame() {
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
    getFPS() {
        return Math.round(this.fps * 10) / 10; // Round to 1 decimal
    }
    reset() {
        this.startTime = Date.now();
        this.frameCount = 0;
        this.fps = 0;
    }
}
