class Enemy {
    constructor(height, width, positionX, positionY, color) {
        this.height = height;
        this.width = width;
        this.position = {
            x: positionX,
            y: positionY
        };
        this.color = color;
        this.canvas = document.querySelector('canvas');
        this.c = this.canvas.getContext('2d');


    }

    draw() {
        this.c.fillStyle = this.color;
        this.c.fillRect(this.position.x, this.position.y, this.width, this.height)
    }    

    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
    }

    setDimensions(width, height) {
        this.width = width;
        this.height = height;
    }

    getPositionX() {
        return this.position.x;
    }

    getPositionY() {
        return this.position.y;
    }


    getWidth() {
        return this.width;
    }

    getHeight() {
        return this.height;
    }

    getEnemies() { return [
        new Enemy(20, 20, 300, 200, "blue"),
        new Enemy(20, this.canvas.width, 0, this.canvas.height - 5, "red"),
        new Enemy(100, 20, this.canvas.width - 40, this.canvas.height - 200, "green")
    ]}
}


export default Enemy;