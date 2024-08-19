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
        const positionX = platform.position.x + Math.random() * (platform.width - this.coinSize);
        const positionY = platform.position.y - this.coinSize;

        const velocity = platform.velocity;

        console.log(`Creating coin at (${positionX}, ${positionY}) with velocity ${velocity}`);

        const coin = new Coin(this.coinSize, positionX, positionY, velocity);
        this.game.objects.push(coin);
    }

    update() {
        if (!this.game.gameStarted) {
            return; // Münzen nur aktualisieren, wenn das Spiel gestartet ist
        }

        const platforms = this.game.objects.filter(obj => obj instanceof Platform);
        const coins = this.game.objects.filter(obj => obj instanceof Coin);

        // Überprüfen, ob eine neue Münze auf jeder Plattform erstellt werden kann
        platforms.forEach(platform => {
            const lastCoinOnPlatform = coins.find(coin => 
                coin.position.x > platform.position.x && 
                coin.position.x < platform.position.x + platform.width
            );

            if (!lastCoinOnPlatform || lastCoinOnPlatform.position.x < platform.position.x + platform.width - this.spacing) {
                if (Math.random() < this.spawnChance) {
                    this.createCoin(platform);
                }
            }
        });

        // Aktualisiere Münzen und entferne sie, wenn sie eingesammelt oder aus dem Bild verschwunden sind
        this.game.objects = this.game.objects.filter(object => {
            if (object instanceof Coin) {
                object.update(this.game); // Aktualisiere die Münze
                if (object.collected) {
                    return false; // Entferne die Münze, wenn sie eingesammelt wurde
                }
            }
            return true;
        });
    }
}

export default CoinManager;
