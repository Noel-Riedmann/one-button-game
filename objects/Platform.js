import PlatformManager from "./PlatformManager.js";
class Platform {
    constructor(canvas, height, width, positionX, positionY, velocity) {
        this.canvas = canvas;
        this.c = canvas.getContext('2d');
    constructor(height, width, positionX, positionY, velocityX) {
        this.height = height;
        this.width = width;
        this.position = {
            x: positionX,
            y: positionY
        };
        this.velocity = velocity;
        this.velocityX = velocityX;

        this.canvas = document.querySelector('canvas');
        this.c = this.canvas.getContext('2d');
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


    update() {
        this.getPlatforms().forEach(platform => {
            this.position.x += this.velocityX;
            if (this.position.x + this.width <= 0) {
                this.position.x = 1200;
            }
        })
    }


    getPlatforms() {
        return [
            //height / widhth / pos x / pos y / velocity
            new Platform(100, 500, 0, this.canvas.height - 100, -5),
            new Platform(100, 1000, 700, this.canvas.height - 100, -5),
            new Platform(20, 200, 400, 450, 0),
            new Platform(20, 200, 600, 300, 0)
        ]
    }
}

export default Platform;
