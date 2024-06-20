class Floor {
    constructor() {
        this.height = 100;
        this.width = innerWidth;
        this.position = {
            x: 0,
            y: innerHeight - this.height
        };

        this.canvas = document.querySelector('canvas');
        this.c = this.canvas.getContext('2d');


        console.log(this.position.y);
    }

    draw() {
        this.c.fillStyle = "Black"
        this.c.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    getHeight() {
        return this.height;
    }

    getPositionY() {
        return this.position.y;
    }


}

export default Floor;