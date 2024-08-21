import Coin from "./Coin.js";
import Platform from "./Platform.js";

class CoinManager {
    constructor(game) {
        this.game = game;
        this.spacing = 300;
        this.coinSize = 20;
        this.spawnChance = 0.02;
    }

    createCoin(platform) {
        const randomSeed = (this.game.seed * 100) % platform.width;
    
        const positionX = platform.position.x + (platform.width / 2) - (this.coinSize / 2) + randomSeed;
        const positionY = platform.position.y - this.coinSize - 10;

        const velocity = platform.velocity;

        const coin = new Coin(this.coinSize, positionX, positionY, velocity);
        this.game.objects.push(coin);

        platform.coinSpawned = true;
    }

    update() {
        if (!this.game.gameStarted) {
            return;
        }
    
        const platforms = this.game.objects.filter(obj => obj instanceof Platform);
        const coins = this.game.objects.filter(obj => obj instanceof Coin);
        
        platforms.forEach(platform => {
            if (platform.coinSpawned) {
                return;
            }

            const lastCoinOnPlatform = coins.find(coin => 
                coin.position.x > platform.position.x && 
                coin.position.x < platform.position.x + platform.width
            );

            if (!lastCoinOnPlatform || lastCoinOnPlatform.position.x < platform.position.x + platform.width - this.spacing) {
                if (this.game.seed < this.spawnChance) {
                    this.createCoin(platform);
                }
            }
        });
    }
}

export default CoinManager;
