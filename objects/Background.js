class Background {
    constructor(imageSrc, speed) {
        this.image = new Image();
        this.image.src = imageSrc;
        this.speed = speed;
 
        
        this.x1 = 0;
        this.x2 = null; 

        this.image.onload = () => {
            this.x2 = this.image.width; 
            console.log('Image loaded:', this.image.width, this.image.height);
        };

        this.image.onerror = () => {
            console.error('Failed to load image:', imageSrc);
        };
    }

    draw(c) {
        if (this.image.complete) {
            c.drawImage(this.image, this.x1, 0, this.image.width, c.canvas.height);
            c.drawImage(this.image, this.x2, 0, this.image.width, c.canvas.height);
        }
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
}

export default Background;
