import Coin from "./Coin.js";
import Platform from "./Platform.js";

class CoinManager {
    constructor(game) {
        this.game = game;
        this.spacing = 300;
        this.coinWidth = 20;
        this.coinHeight = 20;
        this.spawnChance = 0.02;
    }

    createCoin(platform) {
        const positionX = platform.position.x + (platform.width / 2) - (this.coinWidth / 2);
        const positionY = platform.position.y - this.coinHeight - 10;
    
        const velocity = platform.velocity;

        console.log("Creating coin at: ", { x: positionX, y: positionY });
    
        const coin = new Coin(this.coinWidth, this.coinHeight, positionX, positionY, velocity);
        this.game.objects.push(coin);
    
        platform.coinSpawned = true;
    
        this.game.logAction('coinSpawn', 'spawn', positionX, positionY);
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
        this.game.objects = this.game.objects.filter(object => {
            if (object instanceof Coin && object.collected) {
                this.game.logAction('coinCollected', 'collect', object.position.x, object.position.y);
                return false;
            }
            return true;
        });
    }
}

export default CoinManager;
