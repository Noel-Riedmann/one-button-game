class Platform {
    constructor(height, width, positionX, positionY, velocity) {
        this.height = height;
        this.width = width;
        this.position = {
            x: positionX,
            y: positionY
        };
        this.velocity = velocity;
        this.coinSpawned = false;

        this.imageSmall = new Image();
        this.imageSmall.src = '../graphics/plat_150.png';

        this.imageMedium = new Image();
        this.imageMedium.src = '../graphics/plat_200.png';

        this.imageLarge = new Image();
        this.imageLarge.src = '../graphics/plat_250.png';

        if (width === 100) {
            this.image = this.imageSmall;
        } else if (width === 200) {
            this.image = this.imageMedium;
        } else if (width === 250) {
            this.image = this.imageLarge;
        }
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