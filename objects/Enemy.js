class Enemy {
    constructor(height, width, positionX, positionY, color) {
        this.height = height;
        this.width = width;
        this.position = {
            x: positionX,
            y: positionY
        };
        this.color = color;
    }

    draw(c) {
        c.fillStyle = this.color;
        c.fillRect(this.position.x, this.position.y, this.width, this.height)
    }
    update(game){
    //     this.position.x -= this.velocity;

    //     if (this.position.x + this.width < 0) {
    //         this.position.x = game.canvas.width;
    //     }
    }
    
}


export default Enemy;