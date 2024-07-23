import Platform from "./Platform.js";

class PlatformManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.c = this.canvas.getContext('2d');
        this.platforms = this.createPlatforms();
        this.livePlatform = [];
    }

    createPlatforms() {
        console.log("hey");

        return [
            new Platform(this.canvas, 100, 500, 0, this.canvas.height - 100, 0),
            new Platform(this.canvas, 100, 1000, 700, this.canvas.height - 100, 0),
            new Platform(this.canvas, 10, 200 , 700, 500, 3),
        ];
    }

    update() {
        this.platforms.forEach(platform => {
            platform.update();
            platform.draw();  
        });
    }

    getPlatforms() {
        this.update()
        return this.platforms;
    }
}

export default PlatformManager;
