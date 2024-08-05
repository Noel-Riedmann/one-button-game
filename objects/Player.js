import Enemy from "./Enemy.js";
import Platform from "./Platform.js";
import Highscore from "./Highscore.js";

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
        };
        this.gravity = 0.5;

        this.highscore = new Highscore();
        this.gameOver = false;
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
            x: this.position.x + this.width - 5,
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

    draw(c) {
        c.fillStyle = "Red";
        c.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    update(game) {
        this.position.y += this.velocity.y;
        if (this.position.y + this.height + this.velocity.y <= game.canvas.height) {
            this.velocity.y += this.gravity;
        } else {
            this.velocity.y = 0;
        }
        this.position.x += this.velocity.x;
        if (this.position.x + this.width >= 1200) {
            this.position.x = 0;
        }
        this.updateCollisionPoints();
        this.collisionDetectionPlatforms(game);
        this.collisionDetectionEnemies(game);
        this.checkDead(game);
        if (this.canJump === true && this.velocity.y === 0 && game.buttonPressed === true) {
            this.canJump = false;
            this.velocity.y -= 15;
            console.log("Player jumped");
        }

        game.highscore.increment();
    }

    collisionDetectionPlatforms(game) {
        game.objects.forEach(platform => {
            if (!(platform instanceof Platform)) { return; }
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
                this.canJump = true;
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
            if (this.position.y > game.canvas.height - 100) {
                this.velocity.x = 0;
                this.velocity.y = 20;
            }
        });
    }

    collisionDetectionEnemies(game) {
        game.objects.forEach(enemy => {
            if (!(enemy instanceof Enemy)) { return; }
            if (
                this.position.x < enemy.position.x + enemy.width &&
                this.position.x + this.width > enemy.position.x &&
                this.position.y + 20 < enemy.position.y + enemy.height &&
                this.position.y + this.height > enemy.position.y
            ) {
                game.gameOver = true;
                game.endGame();
            }
        });
    }

    getGamestate() {
        return this.gameOver;
    }

    checkDead(game) {
        if (game.gameOver) {
            this.highscore.update();
            this.highscore.resetCurrentScore();
        }
    }
}

export default Player;