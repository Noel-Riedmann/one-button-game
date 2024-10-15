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
        this.platfformanager = new PlatformManager(this)
        this.coinmanager = new CoinManager(this)

        this.offScreenCanvas = document.createElement('canvas');
        this.offScreenCanvas.width = 1200;
        this.offScreenCanvas.height = 700;
        this.offScreenC = this.offScreenCanvas.getContext('2d');

        this.logs = [];
        this.latButtonPressedState = false

        this.lastUpdateTime = performance.now();
        this.accumulator = 0;
        this.timeStep = 1000 / 60;
        this.animationFrameID;

        this.highscore = new Highscore();
        this.generator = new SeedGenerator();
        this.randomGen = this.generator.randomNumbers();
        this.seed;


        this.fps = 60;
        this.frameCount = 0;
        this.lastFPSUpdate = performance.now();

        this.animate = this.animate.bind(this);

        document.addEventListener('keydown', this.onKeydown);
        document.addEventListener('keyup', this.onKeyup);

        this.setFPS();
    }

    init() {
        this.gameOver = false;
        this.gameStarted = false;
        this.objects = [
            new Background("./objects/graphics/sky.png", 3),
            new Platform(100, this.canvas.width, 0, this.canvas.height - 100, 0),
            new Coin(20, 20, this.canvas.width, 0, this.canvas.height - 100, 0),
            new Enemy(20, 20, 0, 300, "blue", 5),
            new Enemy(20, this.canvas.width, 0, this.canvas.height - 5, null, 0),
            new Player()
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
        }
    }

    setFPS() {
        this.timeStep = 1000 / this.fps;
    }

    calculateFPS(now) {
        this.frameCount++;
        const elapsed = now - this.lastFPSUpdate;

        if (elapsed >= 1000) {
            this.fps = (this.frameCount / (elapsed / 1000)) | 0;
            this.frameCount = 0;
            this.lastFPSUpdate = now;
            if (this.fps >= 58) { this.setFPS(); }
        }
    }

    onKeyup = (event) => {
        if (event.keyCode === 32) {
            this.buttonPressed = false;
        }
    }

    logAction(action, type, positionX = null, positionY = null) {
        const logEntry = {
            action: action,
            type: type
        };

        if (positionX !== null && positionY !== null) {
            logEntry.positionX = positionX;
            logEntry.positionY = positionY;
        }

        this.logs.push(logEntry);
        this.saveLogs();
    }

    saveLogs() {
        try {
            localStorage.setItem('gameLogs', JSON.stringify(this.logs));
            console.log("Logs saved successfully.");
        } catch (error) {
            console.error("Error saving logs:", error);
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
        }
    }

    endGame() {
        this.platfformanager.resetValues();
        this.highscore.update();
        this.highscore.resetCurrentScore();
        this.gameStarted = false;
        this.frameCount = 0;
        this.fps = 60;

    }

    getGamestate() {
        return this.gameStarted;
    }

    playerCanJump() {
        return this.canJump = true;
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
        if (this.buttonPressed !== this.lastButtonPressedState) {
            if (this.buttonPressed) {
                this.logAction('jump', 'pressed');
            } else {
                this.logAction('jump', 'released');
            }
            this.lastButtonPressedState = this.buttonPressed;
        }

        this.objects = this.objects.filter(object => {
            object.update(this);

            if (object instanceof Coin && object.collected) {
                this.logAction('coinCollected', 'collect', object.position.x, object.position.y);
                return false;
            }
            return true;
        });

        this.platfformanager.update();
        this.coinmanager.update();

        if (this.gameOver === true) {
            cancelAnimationFrame(this.animationFrameID);
            this.init();
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
            this.update(this.timeStep / 1000);
            this.accumulator -= this.timeStep;
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
