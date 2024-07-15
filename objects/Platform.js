class Platform {
    constructor(height, width, positionX, positionY) {
        this.height = height;
        this.width = width;
        this.position = {
            x: positionX,
            y: positionY
        };

        this.canvas = document.querySelector('canvas');
        this.c = this.canvas.getContext('2d');
    }

    draw() {
        this.c.fillStyle = "Black"
        this.c.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
    getPlatforms() {
        return [
            //height / widhth / pos x / pos y
            new Platform(100, 500, 0, this.canvas.height - 100),
            new Platform(100, 1000, 700, this.canvas.height - 100),
            new Platform(20, 200, 400, 450),
            new Platform(20, 200, 600, 300)

        ]
    }

}

export default Platform;