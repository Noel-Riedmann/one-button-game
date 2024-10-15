class Enemy {
    constructor(height, width, positionX, positionY, color, velocity) {
        this.height = height;
        this.width = width;
        this.position = {
            x: positionX,
            y: positionY
        };
        this.color = color;
        this.velocity = velocity
    }

    draw(c) {
        if (!this.color) {
            return;
        }
        else {
            c.fillStyle = this.color;
        }
        c.fillRect(this.position.x, this.position.y, this.width, this.height)
    }
    update(game) {
        this.position.x -= this.velocity;

        if (this.position.x + this.width < 0) {
            this.position.x = game.canvas.width;
            this.position.y = game.seed * 200 + 300
        }
    }

}


export default Enemy;