import Coin from "./Coin.js";
import Platform from "./Platform.js";

class CoinManager {
    constructor(game) {
        this.game = game;
        this.coinWidth = 32;
        this.coinHeight = 46;
    }

    createCoin(platform) {
        const positionX = platform.position.x + (platform.width / 2) - (this.coinWidth / 2);
        const positionY = platform.position.y - this.coinHeight - 10;
        const velocity = platform.velocity;

        const coin = new Coin(this.coinWidth, this.coinHeight, positionX, positionY, velocity);
        this.game.objects.push(coin);
        platform.coinSpawned = true;
    }

    update() {
        if (!this.game.gameStarted) return;

        this.game.objects.forEach(object => {
            if (object instanceof Platform && !object.coinSpawned) {
                this.createCoin(object);
            }
        });

        this.game.objects = this.game.objects.filter(object => {
            return !(object instanceof Coin && object.collected);
        });
    }
}

export default CoinManager;
