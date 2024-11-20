import Player from "./Player.js";
import Platform from "./Platform.js";
import Enemy from "./Enemy.js";
import Highscore from "./Highscore.js";
import PlatformManager from "./PlatformManager.js";
import Background from "./Background.js";
import Coin from "./Coin.js";
import CoinManager from "./CoinManager.js";
import SeedGenerator from "./SeedGenerator.js";

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.canvas.width = 1200;
        this.canvas.height = 700;
        this.c = this.canvas.getContext('2d');
        this.platfformanager = new PlatformManager(this);
        this.coinmanager = new CoinManager(this);

        this.offScreenCanvas = document.createElement('canvas');
        this.offScreenCanvas.width = 1200;
        this.offScreenCanvas.height = 700;
        this.offScreenC = this.offScreenCanvas.getContext('2d');

        this.latButtonPressedState = false;

        this.lastUpdateTime = performance.now();
        this.accumulator = 0;
        this.timeStep = 1000 / 60;
        this.animationFrameID;

        this.highscore = new Highscore();
        this.generator = new SeedGenerator();
        this.initialSeed = Math.random();
        this.randomGen = this.generator.randomNumbers(this.initialSeed);
        this.seed;

        this.fps = 60;
        this.frameCount = 0;
        this.lastFPSUpdate = performance.now();

        this.tickCount = 0;
        this.jumpTimestamps = [];

        this.animate = this.animate.bind(this);

        document.addEventListener('keydown', this.onKeydown);
        document.addEventListener('keyup', this.onKeyup);
        document.addEventListener('touchstart', this.onTouchStart);
        document.addEventListener('touchend', this.onTouchEnd);
    }

    init() {
        this.gameOver = false;
        this.gameStarted = false;
        this.objects = [
            new Background("./objects/graphics/clouds.png", 2),
            new Background("./objects/graphics/mountains.png", 1),


            new Platform(100, this.canvas.width, 0, this.canvas.height - 100, 0),
            new Coin(32, 48, this.canvas.width, 0, this.canvas.height - 100, 0),
            new Enemy(31, 32, -100, 300, "blue", 5),
            new Enemy(20, this.canvas.width, 0, this.canvas.height, null, 0),
            new Player(),
            new Platform(25, 150, -50, 550, 0)
        ];
        if (!this.animationFrameID) {
            this.animate();
        }
        const startText = document.getElementById("startText");
        startText.classList.remove("hide");
    }

    onKeydown = (event) => {
        if (event.keyCode === 32) {
            this.buttonPressed = true;
            this.playerJump();
        }
    }

    onTouchStart = (event) => {
        this.buttonPressed = true;
    };

    onKeyup = (event) => {
        if (event.keyCode === 32) {
            this.buttonPressed = false;
        }
    }

    onTouchEnd = (event) => {
        this.buttonPressed = false;
    };

    calculateFPS(now) {
        this.frameCount++;
        const elapsed = now - this.lastFPSUpdate;

        if (elapsed >= 1000) {
            this.fps = (this.frameCount / (elapsed / 1000)) | 0;
            this.frameCount = 0;
            this.lastFPSUpdate = now;

            switch (true) {
                case ((this.fps > 70 && this.fps <= 85) || (this.fps > 125 && this.fps <= 150)):
                    this.fps = 75;
                    break;
                case (this.fps > 85 && this.fps <= 100):
                    this.fps = 90;
                    break;
                case ((this.fps > 100 && this.fps <= 125) || (this.fps > 150 && this.fps <= 250)):
                    this.fps = 60;
                    break;
                default:
                    this.fps = 60
                    break;
            }
        }
    }

    startGame() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            localStorage.setItem('gameSeed', this.seed);
            const startText = document.getElementById("startText");
            if (startText) {
                startText.classList.add("hide");
            }

            this.highscore.resetCurrentScore();
            this.jumpTimestamps = [];
            this.tickCount = 0;

            const player = this.objects.filter(obj => obj instanceof Player);

            player.forEach(player => {
                player.startAnimation();
            })
        }
    }

    async endGame() {
        const overlay = document.getElementById('overlay');
        overlay.classList.add('death');
        setTimeout(() => {
            overlay.classList.remove('death');
        }, 150);
        const gameData = {
            username: localStorage.getItem("username"),
            highscore: this.highscore.getCurrentScore(),
            jumps: this.jumpTimestamps,
            seed: this.initialSeed,
        };

        console.log("seed before game end:", this.seed);

        if (typeof this.seed === 'undefined') {
            console.error("Seed is not defined in endGame function!");
            return;
        }

        try {
            const response = await fetch(
                "https://lovelyleap-onebutton.deno.dev/api/leaderboard",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(gameData),
                }
                
            );

            if (response.ok) {
                console.log("Game data successfully posted.");
            } else {
                console.error("Failed to post game data:", response.status, response.statusText);
            }
        } catch (error) {
            console.error("Error posting game data:", error);
        }

        this.platfformanager.resetValues();
        this.highscore.update();
        this.highscore.resetCurrentScore();
        this.gameStarted = false;
        this.frameCount = 0;
        this.fps = 60;


        this.fps = 60;
        const player = this.objects.filter(obj => obj instanceof Player);

        player.forEach(player => {
            player.stopAnimation();
        })
    }

    getGamestate() {
        return this.gameStarted;
    }

    playerCanJump() {
        return this.canJump = true;
    }

    playerJump() {
        this.jumpTimestamps.push(this.tickCount);
    }

    draw() {
        this.offScreenC.clearRect(0, 0, this.offScreenCanvas.width, this.offScreenCanvas.height);
        this.c.clearRect(0, 0, this.offScreenCanvas.width, this.offScreenCanvas.height);
        this.objects.forEach(object => {
            object.draw(this.offScreenC);
        });
        this.c.drawImage(this.offScreenCanvas, 0, 0)
        this.updateHighscoreDisplay();
    }

    update() {
        this.objects = this.objects.filter(object => {
            object.update(this);

            if (object instanceof Coin && object.collected) {
                return false;
            }
            return true;
        });

        this.tickCount++;

        this.platfformanager.update();
        this.coinmanager.update();

        if (this.gameOver === true) {
            cancelAnimationFrame(this.animationFrameID);
            this.init();
            this.tickCount = 0;
        }

        if (this.gameStarted === false && this.buttonPressed === true) {
            this.startGame();
        }
        this.seed = this.randomGen.next().value;
    }

    animate() {
        const now = performance.now();
        const deltaTime = now - this.lastUpdateTime;
        this.lastUpdateTime = now;
        this.accumulator += deltaTime;

        this.calculateFPS(now);

        while (this.accumulator >= this.timeStep) {
            this.update();
            this.accumulator -= this.timeStep;
            if (this.gameStarted === true) {
                this.tickCount++;
            }
        }

        this.draw();

        this.animationFrameID = requestAnimationFrame(this.animate);
    }

    updateHighscoreDisplay() {
        const highScoreTextElement = document.getElementById('highScoreText');
        if (highScoreTextElement) {
            highScoreTextElement.innerHTML = `Highscore: ${this.highscore.getHighScore()}<br>Current Score: ${this.highscore.getCurrentScore()}`;
        }
    }
}

export default Game;


class virtualGame extends Game {
    constructor(gameData) {
        super(null); // Keine Canvas-Initialisierung
        this.gameData = gameData;
        this.generator = new SeedGenerator();
        this.randomGen = this.generator.randomNumbers(gameData.seed);
        this.expectedJumps = gameData.jumps;
        this.highscoreValidated = false;

        this.removeInputListeners(); // Entferne Event-Listener

        this.init(); // Initialisiere Spiel
        this.gameStarted = true; // Setze Spielzustand
    }

    removeInputListeners() {
        document.removeEventListener('keydown', this.onKeydown);
        document.removeEventListener('keyup', this.onKeyup);
        document.removeEventListener('touchstart', this.onTouchStart);
        document.removeEventListener('touchend', this.onTouchEnd);
    }

    onKeydown = () => {};
    onKeyup = () => {};
    onTouchStart = () => {};
    onTouchEnd = () => {};

    calculateFPS() {
        // Keine FPS-Berechnung notwendig
    }

    draw() {
        // Keine grafische Darstellung notwendig
    }

    update() {
        // Simuliere Sprungaktionen
        this.buttonPressed = this.expectedJumps.includes(this.tickCount);
        if (this.buttonPressed) {
            this.playerJump();
        }

        super.update(); // Aktualisiere Spielwelt

        // Validierung: Stoppe nach letztem Sprung
        if (this.tickCount > this.expectedJumps[this.expectedJumps.length - 1]) {
            this.validateGameState();
        }
    }

    validateGameState() {
        const serverCalculatedHighscore = this.highscore.getCurrentScore();
        if (serverCalculatedHighscore !== this.gameData.highscore) {
            throw new Error(`Highscore mismatch! Expected: ${this.gameData.highscore}, Got: ${serverCalculatedHighscore}`);
        }

        this.highscoreValidated = true;
    }
}

