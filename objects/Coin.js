class Coin {
    constructor(width, height, positionX, positionY, velocity, createImage) {
        this.position = {
            x: positionX,
            y: positionY
        };
        this.width = width;
        this.height = height;
        this.velocity = velocity;
        this.collected = false;
        this.spriteSheetCoin = createImage();
        this.spriteSheetCoin.src = './objects/graphics/coin-spritesheet.png';
        this.spriteSheetCoinLoaded = false;

        this.spriteSheetCoin.onload = () => {
            this.spriteSheetCoinLoaded = true;
        };

        this.frameIndex = 0;
        this.frameSpeed = 10
        this.frameCount = 0;
        this.isJumping = false;

        this.spinFrames = [0, 1, 2, 3];
        this.jumpLeftFrame = 1;
    }

    draw(c) {

        if (!this.spriteSheetCoinLoaded) {
            return;
        }

        let sourceX;
        const sourceY = 0;

        if (this.isJumping == false) {

            sourceX = this.spinFrames[this.frameIndex] * this.width;

            this.frameCount++;
            if (this.frameCount >= this.frameSpeed) {
                this.frameIndex = (this.frameIndex + 1) % this.spinFrames.length;
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
            this.spriteSheetCoin,
            sourceX, sourceY,
            this.width, this.height,
            0, 0,
            this.width, this.height,
        );

        c.restore();



    }

    update(game) {
        this.position.x -= this.velocity;
        if (this.position.x + this.width < 0) {
            this.collected = true;
        }

        
    };
}

export default Coin;