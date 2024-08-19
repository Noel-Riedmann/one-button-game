class Coin {
    constructor(size, positionX, positionY, velocity) {
        this.size = size;
        this.position = {
            x: positionX,
            y: positionY
        };
        this.velocity = velocity;
        this.collected = false;
    }

    draw(c) { 
        c.fillStyle = "Yellow";
        c.beginPath();
        c.arc(this.position.x + this.size / 2, this.position.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
        c.fill();
    }

    update(game) {
        // Bewege die Münze entsprechend der Plattformgeschwindigkeit
        this.position.x -= this.velocity;

        // Überprüfen, ob die Münze aus dem Bild verschwunden ist
        if (this.position.x + this.size < 0) {
            this.collected = true;
        }
    }
}

export default Coin;
