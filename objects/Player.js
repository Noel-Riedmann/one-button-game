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
        this.width = 37; // Breite des Sprite-Frames (an das Bild angepasst)
        this.height = 69; // Höhe des Sprite-Frames (an das Bild angepasst)
        this.velocity = {
            x: 0,
            y: 1
        };
        this.gravity = 0.5;

        this.highscore = new Highscore();
        this.gameOver = false;
        this.updateCollisionPoints();

        // Sprite-Sheet Einstellungen
        this.spriteSheet = new Image();
        this.spriteSheet.src = '../graphics/dude.png'; // Pfad zum Sprite-Sheet
        this.spriteSheetLoaded = false; // Bild geladen Flag
        
        // Onload-Event für das Sprite-Sheet
        this.spriteSheet.onload = () => {
            this.spriteSheetLoaded = true; // Bild als geladen markieren
        };

        this.frameIndex = 0; // Aktueller Frame
        this.frameSpeed = 10;  // Anzahl der Frames, bevor der nächste Frame angezeigt wird (langsamer, damit es flüssiger aussieht)
        this.frameCount = 0;  // Zählt die Frames
        this.isJumping = false; // Status: Springt der Charakter?
        
        // Nur die Frames, die nach rechts schauend laufen
        this.walkRightFrames = [0, 1, 2]; // Indexe der Frames für "Laufen nach rechts"
        this.jumpRightFrame = 2; // Verwende den letzten Frame als Sprung-Frame
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
        // Überprüfe, ob das Sprite-Sheet vollständig geladen wurde
        if (!this.spriteSheetLoaded) {
            return; // Wenn das Bild nicht geladen ist, zeichne nichts
        }

        let sourceX;

        // Wenn der Charakter springt, nutze den Sprung-Frame
        if (this.isJumping) {
            sourceX = this.jumpRightFrame * this.width;
        } else {
            // Lauf-Animation: Wechsel zwischen den Frames des Laufens nach rechts
            sourceX = this.walkRightFrames[this.frameIndex] * this.width;

            // Frame-Animation aktualisieren
            this.frameCount++;
            if (this.frameCount >= this.frameSpeed) {
                this.frameIndex = (this.frameIndex + 1) % this.walkRightFrames.length;
                this.frameCount = 0;
            }
        }

        // Zeichne den aktuellen Frame des Sprite-Sheets auf das Canvas
        c.drawImage(
            this.spriteSheet,      // Bildquelle (Sprite-Sheet)
            sourceX, 0,            // X und Y Position des aktuellen Frames im Sprite-Sheet
            this.width, this.height, // Breite und Höhe des Frames im Sprite-Sheet
            this.position.x, this.position.y, // X und Y Position auf dem Canvas
            this.width, this.height  // Breite und Höhe auf dem Canvas
        );
    }

    update(game) {
        this.position.y += this.velocity.y;
        if (this.position.y + this.height + this.velocity.y <= game.canvas.height) {
            this.velocity.y += this.gravity;
            this.isJumping = true;  // Solange der Charakter fällt, springt er
        } else {
            this.velocity.y = 0;
            this.isJumping = false; // Wenn er den Boden erreicht, springt er nicht mehr
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
        if (this.canJump === true && this.velocity.y === 0 && game.buttonPressed === true) {
            this.canJump = false;
            this.velocity.y -= 15; // Der Spieler springt
        }
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