class Ground {
    constructor(imageSrc, speed, game) {
        this.image = new Image();
        this.image.src = imageSrc;
        this.speed = speed;
        this.game = game;

        this.x1 = 0;
        this.x2 = 0;

        this.image.onload = () => {
            this.x2 = this.image.width;
        };
    }

    update() {
        this.x1 -= this.speed;
        this.x2 -= this.speed;

        if (this.x1 <= -this.image.width) {
            this.x1 = this.x2 + this.image.width;
        }
        if (this.x2 <= -this.image.width) {
            this.x2 = this.x1 + this.image.width;
        }
    }

    draw(c) {
        if (this.image.complete) {
            const yPosition = this.game.canvas.height - this.image.height;
            c.drawImage(this.image, this.x1, yPosition, this.image.width, this.image.height);
            c.drawImage(this.image, this.x2, yPosition, this.image.width, this.image.height);
        }
    }
}

export default Ground;
