class Background {
    constructor(imageSrc,speed) {
        this.image = new Image();
        this.image.src = imageSrc;
        this.speed = speed;
        this.x1 = 0;
        this.x2 = null;
        this.xdrawn = 0;

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
            c.drawImage(this.image, this.xdrawn, 0, c.canvas.width, c.canvas.height);
            //console.log("Background drawn");
            // this.xdrawn -= this.speed
            console.log("Background drawn");
            //this.xdrawn -= this.speed
        }

    }
    update(game) {
       //console.log(this.x1, this.x2);
       //console.log(-this.image.width, -this.image.height);
        this.x1 -= this.speed;
        this.x2 -= this.speed;
       console.log(this.x1, this.x2);
       console.log(-this.image.width, -this.image.height);
        //this.x1 -= this.speed;
        //this.x2 -= this.speed;

        if (this.x1 <= -this.image.width) {
            this.x1 = this.image.width + this.x2 - this.speed;
           // console.log("Background updated");
        }

        /*if (this.x2 <= -this.image.width) {
            this.x2 = this.image.width + this.x1 - this.speed;
            //console.log("Background updated");

        }*/
    }
}

export default Background;