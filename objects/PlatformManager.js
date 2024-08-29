import Platform from "./Platform.js";

class PlatformManager {
    constructor(game) {
        this.game = game;
        this.spacing = 150;
        this.width;
    }

    createPlatform() {
        let lastPlatformX = 0;
        this.game.objects.forEach(platform => {
            if (platform instanceof Platform) {
                if (platform.position.x > lastPlatformX) {
                    lastPlatformX = platform.position.x + platform.width;
                }
            }
        });

        const positionX = lastPlatformX + this.spacing;
        const positionY = this.game.canvas.height - (this.game.seed * 200 + 125);

        let shiftedSeed = (Math.floor(this.game.seed * 10000)) % 100;
        if (shiftedSeed <= 33) {
            this.width = 150;
        } else if (shiftedSeed <= 66) {
            this.width = 200;
        } else {
            this.width = 250;
        }


        const platform = new Platform(25, this.width, positionX, positionY, 3);
        this.game.objects.push(platform);
    }

    update() {
        let needNewPlatform = true;
        this.game.objects.forEach(platform => {
            if (platform instanceof Platform) {
                if (platform.position.x + platform.width + this.spacing > this.game.canvas.width && platform.velocity != 0) {
                    needNewPlatform = false;
                }
            }
        });
        if (needNewPlatform) {
            this.createPlatform();
        }

        this.game.objects = this.game.objects.filter(object => {
            if (object instanceof Platform) {
                if (object.position.x + object.width <= 0) {
                    return false;
                }
                if (this.game.gameStarted && object.velocity === 0) {
                    return false;
                }
            }
            return true;
        });
    }
}

export default PlatformManager;
