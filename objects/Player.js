class Player {
    constructor() {
        this.position = {
            x: 200,
            y: innerHeight - 200 //get floor height + player
        };
        this.width = 100;
        this.height = 100;
        this.velocity = {
            x: 0,
            y: 1
        }
        this.gravity = 0.5
        console.log("player created");
        console.log("inner", innerHeight);

        this.canvas = document.querySelector('canvas');
        this.c = this.canvas.getContext('2d');
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

    getVelocity() {
        return this.velocity;
    }

    draw() {
        this.c.fillStyle = "Red"
        this.c.fillRect(this.position.x, this.position.y, this.width, this.height)
    }

    update() {
        this.draw()
        this.position.y += this.velocity.y
        if (this.position.y + this.height + this.velocity.y <= this.canvas.height) {
            this.velocity.y += this.gravity
        }
        else { this.velocity.y = 0 }

    }
}


export default Player;
