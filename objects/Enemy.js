class Enemy {
    constructor(height, width, positionX, positionY, color, velocity) {
        this.height = height;
        this.width = width;
        this.position = {
            x: positionX,
            y: positionY
        };
        this.color = color;
        this.velocity = velocity

        this.spriteSheetEnemy = new Image();
        this.spriteSheetEnemy.src = './objects/graphics/enemy2.png';
        this.spriteSheetEnemyLoaded = false;

        this.spriteSheetEnemy.onload = () => {
            this.spriteSheetEnemyLoaded = true;
        };

        this.frameIndex = 0;
        this.frameSpeed = 10
        this.frameCount = 0;

        
        this.walkLeftFrames = [0, 1, 2, 3];
        this.jumpLeftFrame = 1;
    }

    draw(c) {
        if (!this.spriteSheetEnemyLoaded) {
            return;
        }
    
        let sourceX;
        const sourceY = 0;
    

        if (this.isJumping) {
            sourceX = this.jumpLeftFrame * this.width;
        } else {
            sourceX = this.walkLeftFrames[this.frameIndex] * this.width;
    
            this.frameCount++;
            if (this.frameCount >= this.frameSpeed) {
                this.frameIndex = (this.frameIndex + 1) % this.walkLeftFrames.length;
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
            this.spriteSheetEnemy,   
            sourceX, sourceY,  
            this.width, this.height,
            0, 0,              
            this.width, this.height,
        );

        c.restore();
    }
    update(game) {
        if (!game.gameStarted) {
            return;
        }
        this.position.x -= this.velocity;

        if (this.position.x + this.width < 0) {
            this.position.x = game.canvas.width;
            this.position.y = game.seed * 200 + 300
        }
    }

}


export default Enemy;