import Player from "./Player.js";
import Platform from "./Platform.js";
import Enemy from "./Enemy.js";
import Highscore from "./Highscore.js";
import PlatformManager from "./PlatformManager.js";
import Background from "./Background.js";
import Coin from "./Coin.js";
import CoinManager from "./CoinManager.js";
import SeedGenerator from "./SeedGenerator.js";
import Ground from "./Ground.js";

class Game {
  constructor(canvas, getSeed = Math.random) {
    this.canvas = canvas;
    this.initialCanvas();
    this.addEventListener();

    this.buttonPressed = false;
    this.getSeed = getSeed;

    this.lastUpdateTime = performance.now();
    this.accumulator = 0;
    this.timeStep = 1000 / 60;
    this.animationFrameID = null;
    this.highscore = new Highscore();

    this.fps = 60;
    this.frameCount = 0;
    this.lastFPSUpdate = performance.now();

    this.tickCount = 0;
    this.jumpTimestamps = [];

    this.animate = this.animate.bind(this);
  }

  addEventListener() {
    document.addEventListener("keydown", this.onKeydown);
    document.addEventListener("keyup", this.onKeyup);
    document.addEventListener("touchstart", this.onTouchStart);
    document.addEventListener("touchend", this.onTouchEnd);
  }

  initialCanvas() {
    this.canvas.width = 1200;
    this.canvas.height = 700;
    this.c = this.canvas.getContext("2d");
    this.offScreenCanvas = document.createElement("canvas");
    this.offScreenCanvas.width = 1200;
    this.offScreenCanvas.height = 700;
    this.offScreenC = this.offScreenCanvas.getContext("2d");
  }

  createBackgrounds() {
    return [
      new Background("./objects/graphics/clouds.png", 2),
      new Background("./objects/graphics/mountains.png", 1),
    ];
  }

  createImage() {
    return new Image();
  }

  init() {
    this.gameOver = false;
    this.gameStarted = false;
    this.generator = new SeedGenerator();
    this.initialSeed = this.getSeed();
    this.randomGen = this.generator.randomNumbers(this.initialSeed);
    this.seed = this.initialSeed;

    // Zustand zurücksetzen
    this.tickCount = 0;
    this.jumpTimestamps = [];
    this.highscore.resetCurrentScore();

    // Initialisiere alle Game-Objekte
    this.objects = [
      ...this.createBackgrounds(),
      new PlatformManager(this),
      new CoinManager(this),
      new Platform(100, this.canvas.width, 0, this.canvas.height - 100, 0, this.createImage),
      new Coin(32, 48, this.canvas.width, 0, this.canvas.height - 100, this.createImage),
      new Enemy(31, 32, -100, 300, "blue", 5, this.createImage),
      new Enemy(20, this.canvas.width, 0, this.canvas.height, null, 0, this.createImage),
      new Player(this.createImage),
      new Platform(25, 150, -50, 550, 0, this.createImage),
      // new Ground(this.canvas, 3),
    ];

    if (!this.animationFrameID) {
      this.animate();
    }
  }

  onKeydown = (event) => {
    if (event.keyCode === 32) {
      this.buttonPressed = true;
      this.playerJump();
    }
  };

  onTouchStart = (event) => {
    this.buttonPressed = true;
    this.playerJump();
  };

  onKeyup = (event) => {
    if (event.keyCode === 32) {
      this.buttonPressed = false;
    }
  };

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

      if ((this.fps > 70 && this.fps <= 85) || (this.fps > 125 && this.fps <= 150)) {
        this.fps = 75;
      } else if (this.fps > 85 && this.fps <= 100) {
        this.fps = 90;
      } else if ((this.fps > 100 && this.fps <= 125) || (this.fps > 150 && this.fps <= 250)) {
        this.fps = 60;
      } else {
        this.fps = 60;
      }
    }
  }

  startGame() {
    if (!this.gameStarted) {
      this.gameStarted = true;
      localStorage.setItem("gameSeed", this.seed);
      const startText = document.getElementById("startText");
      if (startText) {
        startText.classList.add("hide");
      }
      this.generator = new SeedGenerator();
      this.initialSeed = this.getSeed();
      this.randomGen = this.generator.randomNumbers(this.initialSeed);
      this.seed = this.initialSeed;
      this.highscore.resetCurrentScore();

      this.objects.forEach((obj) => {
        if (obj instanceof Player && typeof obj.startAnimation === "function") {
          obj.startAnimation();
        }
      });
    }
  }

  async endGame() {
    const overlay = document.getElementById("overlay");
    if (overlay) {
      overlay.classList.add("death");
      setTimeout(() => {
        overlay.classList.remove("death");
      }, 150);
    }

    const gameData = {
      username: localStorage.getItem("username"),
      highscore: this.highscore.getCurrentScore(),
      jumps: this.jumpTimestamps,
      seed: this.initialSeed,
    };

    try {
      const response = await fetch("https://lovelyleap-onebutton.deno.dev/api/leaderboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gameData),
      });

      if (response.ok) {
        console.log("Game data successfully posted.");
      } else {
        console.error("Failed to post game data:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error posting game data:", error);
    }

    this.objects.forEach((obj) => {
      if (obj instanceof PlatformManager && typeof obj.resetValues === "function") {
        obj.resetValues();
      } else if (obj instanceof CoinManager && typeof obj.deleteMovingCoins === "function") {
        obj.deleteMovingCoins();
      } else if (obj instanceof Player && typeof obj.stopAnimation === "function") {
        obj.stopAnimation();
      }
    });

    this.highscore.update();
    this.gameStarted = false;
    this.frameCount = 0;
    this.fps = 60;
    console.log("Spiel vorbei");
  }

  getGamestate() {
    return this.gameStarted;
  }

  playerJump() {
    this.jumpTimestamps.push(this.tickCount);
  }

  draw() {
    this.offScreenC.clearRect(0, 0, this.offScreenCanvas.width, this.offScreenCanvas.height);
    this.c.clearRect(0, 0, this.offScreenCanvas.width, this.offScreenCanvas.height);
    this.objects.forEach((object) => {
      if (typeof object.draw === "function") {
        object.draw(this.offScreenC);
      }
    });
    this.c.drawImage(this.offScreenCanvas, 0, 0);
    this.updateHighscoreDisplay();
  }

  update() {
    this.objects.forEach((object) => {
      if (typeof object.update === "function") {
        object.update(this);
      }
    });

    this.objects = this.objects.filter((object) => {
      if (object instanceof Coin && object.collected) {
        return false;
      }
      return true;
    });

    this.tickCount++;

    if (this.gameOver === true) {
      if (typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(this.animationFrameID);
      }
      this.init();
      return;
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

    while (this.accumulator >= this.timeStep) {
      this.update();
      this.accumulator -= this.timeStep;
    }

    this.draw();
    this.animationFrameID = requestAnimationFrame(this.animate);
  }

  updateHighscoreDisplay() {
    const highScoreTextElement = document.getElementById("highScoreText");
    if (highScoreTextElement) {
      highScoreTextElement.innerHTML = `Highscore: ${this.highscore.getHighScore()}<br>Current Score: ${this.highscore.getCurrentScore()}`;
    }
  }
}

export default Game;

export class VirtualGame extends Game {
  constructor(gameData) {
    if (!gameData || !gameData.jumps || !gameData.highscore || !gameData.seed) {
      throw new Error("Fehlende oder ungültige Daten im gameData.");
    }
    super({ width: 1200, height: 700 }, () => gameData.seed);

    this.gameData = gameData;
    this.expectedJumps = gameData.jumps;
    this.highscoreValidated = false;
    this.gameOver = false;

    this.tickCount = 0;
    this.jumpTimestamps = [];
    this.highscore.resetCurrentScore();

    this.canvas = { width: 1200, height: 700 };
    this.initialCanvas();

    this.init();
    this.startGame();
  }

  addEventListener() {}

  initialCanvas() {
    this.canvas.width = 1200;
    this.canvas.height = 700;
    this.offScreenCanvas = { width: 1200, height: 700 };
    this.offScreenC = {
      clearRect: () => {},
      drawImage: () => {},
    };
  }

  createImage() {
    return {};
  }

  createBackgrounds() {
    return [];
  }

  calculateFPS() {}

  draw() {}

  animate() {
    const maxTicks = this.expectedJumps[this.expectedJumps.length - 1] + 300;
    while (!this.gameOver && this.tickCount < maxTicks) {
      this.update();
    }
  }

  update() {
    if (!this.gameStarted) {
      this.tickCount++;
      this.seed = this.randomGen.next().value;
      return;
    }

    if (this.expectedJumps.includes(this.tickCount)) {
      this.buttonPressed = true;
      this.playerJump();
    } else {
      this.buttonPressed = false;
    }

    this.objects.forEach((object) => {
      if (typeof object.update === "function") {
        object.update(this);
      }
      if (object.position && typeof object.velocity === "number") {
        object.position.x -= object.velocity;
      }
    });

    const platformManager = this.objects.find((o) => o instanceof PlatformManager);
    if (platformManager) {
      this.objects.forEach((obj) => {
        if (obj instanceof Platform) {
          obj.velocity = platformManager.speed;
        }
      });
    }

    this.objects = this.objects.filter((object) => {
      if (object instanceof Coin && object.collected) {
        return false;
      }
      return true;
    });

    this.tickCount++;
    this.seed = this.randomGen.next().value;

    if (
      this.tickCount >=
      this.expectedJumps[this.expectedJumps.length - 1] + 200
    ) {
      this.validateGameState();
    }
  }

  startGame() {
    this.gameStarted = true;
    this.generator = new SeedGenerator();
    this.initialSeed = this.gameData.seed;
    this.randomGen = this.generator.randomNumbers(this.initialSeed);
    this.seed = this.initialSeed;
    this.highscore.resetCurrentScore();

    this.objects.forEach((obj) => {
      if (obj instanceof Platform) {
        if (!obj.velocity || obj.velocity === 0) {
          obj.velocity = 3;
        }
      }
      if (obj instanceof Coin) {
        if (!obj.velocity || obj.velocity === 0) {
          obj.velocity = 3;
        }
      }
      if (obj instanceof Player && typeof obj.startAnimation === "function") {
        obj.startAnimation();
      }
    });
  }

  endGame() {}

  validateGameState() {
    const serverCalculatedHighscore = this.highscore.getCurrentScore();

    if (serverCalculatedHighscore !== this.gameData.highscore) {
      throw new Error(
        `Highscore mismatch! Expected: ${this.gameData.highscore}, Got: ${serverCalculatedHighscore}`
      );
    }

    this.highscoreValidated = true;
    this.gameOver = true;
  }
}
