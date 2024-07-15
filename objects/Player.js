import Platform from "./Platform.js";

class Player {
    constructor() {
        this.position = {
            x: 50,
            y: 500
        };
        this.width = 50;
        this.height = 50;
        this.velocity = {
            x: 0,
            y: 1
        }
        this.gravity = 0.5

        this.canvas = document.querySelector('canvas');
        this.c = this.canvas.getContext('2d');
        this.platform = new Platform();

        this.updateCollisionPoints();
    }

    updateCollisionPoints() {
        this.collisionPointBelow = {
            x: this.position.x + this.width / 2,
            y: this.position.y + this.height + 5
        };

        this.collisionPointAbove = {
            x: this.position.x + this.width / 2,
            y: this.position.y - 5
        };

        this.collisionPointRight = {
            x: this.position.x + 5,
            y: this.position.y + this.height / 2
        };
    }

    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
        this.updateCollisionPoints();
    }

    setDimensions(width, height) {
        this.width = width;
        this.height = height;
        this.updateCollisionPoints();
    }

    draw() {
        this.c.fillStyle = "Red";
        this.c.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    update() {
        this.draw();
        this.position.y += this.velocity.y;
        if (this.position.y + this.height + this.velocity.y <= this.canvas.height) {
            this.velocity.y += this.gravity;
        } else {
            this.velocity.y = 0;
        }
        this.position.x += this.velocity.x;
        if (this.position.x + this.width >= 1200) {
            this.position.x = 0;
        }
        this.updateCollisionPoints();
    }

    collisionDetectionPlatforms() {
        this.platform.getPlatforms().forEach(platform => {
            if (
                this.collisionPointBelow.y >= platform.position.y &&
                this.collisionPointBelow.y < platform.position.y + platform.height &&
                this.position.x + this.width > platform.position.x &&
                this.position.x < platform.position.x + platform.width &&
                this.velocity.y >= 0
            ) {
                this.velocity.y = 0;
                this.position.y = platform.position.y - this.height;
                console.log("player landed on platform");
                // todo: canJump = true;
            }

            if (
                this.collisionPointAbove.y <= platform.position.y + platform.height &&
                this.collisionPointAbove.y > platform.position.y &&
                this.position.x + this.width > platform.position.x &&
                this.position.x < platform.position.x + platform.width &&
                this.velocity.y < 0
            ) {
                this.velocity.y = 0;
                console.log("collision from below, player bounces off");
            }
        });
    }
}

export default Player;
