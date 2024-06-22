class Enemy {
    constructor() {
        this.position = {
            x: 220,
            y: 400
        };
        this.width = 20;
        this.height = 20;

        this.canvas = document.querySelector('canvas');
        this.c = this.canvas.getContext('2d');

    }

    draw() {
        this.c.fillStyle = "Blue"
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
}


export default Enemy;