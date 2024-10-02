class Coin {
    constructor(width, height, positionX, positionY, velocity) {
        this.position = {
            x: positionX,
            y: positionY
        };
        this.width = width;    // Breite der Münze
        this.height = height;  // Höhe der Münze
        this.velocity = velocity;
        this.collected = false;
        this.image = new Image();
        this.image.src = '../graphics/star.png'; // Pfad zum Bild
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

        // Überprüfen, ob die Münze den Bildschirm verlassen hat
        if (this.position.x + this.width < 0) {
            this.collected = true;
        }
    }
}

export default Coin;