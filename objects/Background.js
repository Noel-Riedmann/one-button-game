class Background {
    constructor(imageSrc, speed) {

        this.image = new Image();
        this.image.src = imageSrc;
        this.speed = speed;
        this.x1 = 0;
       

        this.image.onload = () => {
            this.x2 = this.image.width;
        }
    }

    update(game) {
        this.x1 -= this.speed;
        this.x2 -= this.speed;

        if (this.x1 <= -this.image.width) {
            this.x1 = this.image.width + this.x2 - this.speed;
            console.log("img moving");
        }

        if (this.x2 <= -this.image.width) {
            this.x2 = this.image.width + this.x1 - this.speed;
            console.log("img moving");
        }
    }

    draw(c) {
        if (this.image.complete) {
            c.drawImage(this.image, this.x1, 0, this.image.width, c.height);
            c.drawImage(this.image, this.x2, 0, this.image.width, c.height);
            console.log("img loaded");
        }
        
    }
}

export default Background;
