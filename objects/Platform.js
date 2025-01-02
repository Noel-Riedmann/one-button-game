class Platform {
    constructor(height, width, positionX, positionY, velocity, createImage) {
        this.height = height;
        this.width = width;
        this.position = {
            x: positionX,
            y: positionY
        };
        this.velocity = velocity;
        this.coinSpawned = false;

        this.image = createImage();
        if (this.width <= 150) {
            this.image.src = './objects/graphics/plat_150.png';
        } else if (this.width <= 200) {
            this.image.src = './objects/graphics/plat_200.png';
        } else if (this.width <=250) {
            this.image.src = './objects/graphics/plat_250.png';
        }
    }

    isPlayerOnPlatform(player) {
        const playerBottomY = player.position.y + player.height;
        const platformTopY = this.position.y;
        const platformLeftX = this.position.x;
        const platformRightX = this.position.x + this.width;

        return (
            playerBottomY === platformTopY &&
            player.position.x + player.width >= platformLeftX &&
            player.position.x <= platformRightX
        );
    }

    draw(c) { 
        if (this.image && this.image.complete) {
            c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
        } else {
            c.fillStyle = "Black";
            c.fillRect(this.position.x, this.position.y, this.width, this.height);
        }
    }

    update(game) {
        this.position.x -= this.velocity;
    }
}

export default Platform;