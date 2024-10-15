import Enemy from "./Enemy.js";
import Platform from "./Platform.js";
import Highscore from "./Highscore.js";
import Coin from "./Coin.js";

class Player {
    constructor() {
        this.position = {
            x: 50,
            y: 500
        };
        this.width = 31;
        this.height = 47;
        this.velocity = {
            x: 0,
            y: 1
        };
        this.gravity = 0.5;

        this.highscore = new Highscore();
        this.gameOver = false;
        this.updateCollisionPoints();

        this.spriteSheet = new Image();
        this.spriteSheet.src = './objects/graphics/dudecolor.png';
        this.spriteSheetLoaded = false;
        
        this.spriteSheet.onload = () => {
            this.spriteSheetLoaded = true;
        };

        this.frameIndex = 0;
        this.frameSpeed = 10
        this.frameCount = 0;
        this.isJumping = false;

        
        this.walkRightFrames = [0, 1, 2, 3];
        this.jumpRightFrame = 1;

        this.canJump = false;
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
        if (!this.spriteSheetLoaded) {
            return;
        }
    
        let sourceX;
        const sourceY = 0;
    

        if (this.isJumping) {
            sourceX = this.jumpRightFrame * this.width;
        } else {
            sourceX = this.walkRightFrames[this.frameIndex] * this.width;
    
            this.frameCount++;
            if (this.frameCount >= this.frameSpeed) {
                this.frameIndex = (this.frameIndex + 1) % this.walkRightFrames.length;
                this.frameCount = 0;
            }
        }
    
        c.save();
    
        if (this.velocity.x > 0) {
            c.translate(this.position.x + this.width, this.position.y);
            c.scale(-1, 1);
            c.translate(-this.width, 0);
        } else {

            c.translate(this.position.x, this.position.y);
        }
    

        c.drawImage(
            this.spriteSheet,   
            sourceX, sourceY,  
            this.width, this.height,
            0, 0,              
            this.width, this.height,
        );

        c.restore();
    }

    update(game) {
        this.position.y += this.velocity.y;
        if (this.position.y + this.height + this.velocity.y <= game.canvas.height) {
            this.velocity.y += this.gravity;
            this.isJumping = true;
        } else {
            this.velocity.y = 0;
            this.isJumping = false;
        }

        this.position.x += this.velocity.x;
        if (this.position.x + this.width >= game.canvas.width) {
            this.position.x = 0;
        }

        this.updateCollisionPoints();
        this.collisionDetectionPlatforms(game);
        this.collisionDetectionEnemies(game);
        this.collisionDetectionCoins(game);
        this.checkDead(game);

        if (this.canJump && this.velocity.y === 0 && game.buttonPressed) {
            this.canJump = false;
            this.velocity.y -= 15;
            this.isJumping = true;
        }
    }

    collisionDetectionPlatforms(game) {
        game.objects.forEach(platform => {
            if (!(platform instanceof Platform)) return;

            if (
                this.collisionPointBelow.y >= platform.position.y &&
                this.collisionPointBelow.y < platform.position.y + platform.height &&
                this.position.x + this.width > platform.position.x &&
                this.position.x < platform.position.x + platform.width &&
                this.velocity.y >= 0
            ) {
                this.velocity.y = 0;
                this.position.y = platform.position.y - this.height;
                this.canJump = true;
                this.isJumping = false;
            }

            if (
                this.collisionPointAbove.y <= platform.position.y + platform.height &&
                this.collisionPointAbove.y > platform.position.y &&
                this.position.x + this.width > platform.position.x &&
                this.position.x < platform.position.x + platform.width &&
                this.velocity.y < 0
            ) {
                this.velocity.y = 0;
            }

        });
    }

    collisionDetectionEnemies(game) {
        game.objects.forEach(enemy => {
            if (!(enemy instanceof Enemy)) return;

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

    collisionDetectionCoins(game) {
        game.objects.forEach(object => {
            if (object instanceof Coin) {
                const coin = object;

                if (
                    this.position.x < coin.position.x + coin.width &&
                    this.position.x + this.width > coin.position.x &&
                    this.position.y < coin.position.y + coin.height &&
                    this.position.y + this.height > coin.position.y
                ) {
                    coin.collected = true;
                    game.highscore.increment();
                }
            }
        });
    }

    checkDead(game) {
        if (game.gameOver) {
            this.highscore.update();
            this.highscore.resetCurrentScore();
        }
    }
}

export default Player;