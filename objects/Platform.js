import PlatformManager from "./PlatformManager.js";
class Platform {
    constructor(canvas, height, width, positionX, positionY, velocity) {
        this.canvas = canvas;
        this.c = canvas.getContext('2d');
        this.height = height;
        this.width = width;
        this.position = {
            x: positionX,
            y: positionY
        };
        this.velocity = velocity;
    }

    draw() { 
        this.c.fillStyle = "Black";
        this.c.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
    

    update() {
        this.position.x -= this.velocity;

        if (this.position.x + this.width < 0) {
            this.position.x = this.canvas.width;
        }
    }
}

export default Platform;
