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




    this.latButtonPressedState = false;
    this.getSeed = getSeed;

    this.lastUpdateTime = performance.now();
    this.accumulator = 0;
    this.timeStep = 1000 / 60;
    this.animationFrameID;
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
      new Background("./objects/graphics/mountains.png", 1),]
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
      //new Ground(this.canvas, 3),

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

      switch (true) {
        case (this.fps > 70 && this.fps <= 85) ||
          (this.fps > 125 && this.fps <= 150):
          this.fps = 75;
          break;
        case this.fps > 85 && this.fps <= 100:
          this.fps = 90;
          break;
        case (this.fps > 100 && this.fps <= 125) ||
          (this.fps > 150 && this.fps <= 250):
          this.fps = 60;
          break;
        default:
          this.fps = 60;
          break;
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
      //this.initialSeed = 0.4403660297393799//this.seed;
      //this.seed = 0.4403660297393799;

      this.highscore.resetCurrentScore();
      //this.jumpTimestamps = [];
      //this.tickCount = 0;

      const player = this.objects.filter((obj) => obj instanceof Player);

      player.forEach((player) => {
        player.startAnimation();
      });
    }
  }




  async endGame() {
    const overlay = document.getElementById("overlay");
    overlay.classList.add("death");
    setTimeout(() => {
      overlay.classList.remove("death");
    }, 150);


    const gameData = {
      username: localStorage.getItem("username"),
      highscore: this.highscore.getCurrentScore(),
      jumps: this.jumpTimestamps,
      seed: this.initialSeed,
    };


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
        console.error(
          "Failed to post game data:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error posting game data:", error);
    }

    this.objects.forEach((obj) => {
      if (obj instanceof PlatformManager) {
        obj.resetValues();
      }
      else if (obj instanceof CoinManager) {
        obj.deleteMovingCoins();
      }
      else if (obj instanceof Player) {
        obj.stopAnimation();
      }
    })
    this.highscore.update();
    //this.highscore.resetCurrentScore();
    this.gameStarted = false;
    this.frameCount = 0;
    this.fps = 60;
    console.log("spiel vorbei");
  }

  getGamestate() {
    return this.gameStarted;
  }

  playerCanJump() {
    return (this.canJump = true);
  }

  playerJump() {
    this.jumpTimestamps.push(this.tickCount);
    //console.log("PlayerJumpTickCountfunction: ",this.tickCount);
  }

  draw() {
    this.offScreenC.clearRect(
      0,
      0,
      this.offScreenCanvas.width,
      this.offScreenCanvas.height
    );
    this.c.clearRect(
      0,
      0,
      this.offScreenCanvas.width,
      this.offScreenCanvas.height
    );
    this.objects.forEach((object) => {
      object.draw(this.offScreenC);
    });
    this.c.drawImage(this.offScreenCanvas, 0, 0);
    this.updateHighscoreDisplay();
  }

  update() {
    this.objects.forEach((object) => {
      object.update(this);
    })
    this.objects = this.objects.filter((object) => {

      if (object instanceof Coin && object.collected) {

        return false;
      }
      return true;
    });

    this.tickCount++;

    if (this.gameOver === true) {
      cancelAnimationFrame(this.animationFrameID);
      this.init();
      this.tickCount = 0;
    }
    this.buttonPressed = [436, 526, 623, 721].includes(this.tickCount);
    if (this.gameStarted === false && this.buttonPressed === true) {
      this.startGame();
    }
    this.seed = this.randomGen.next().value;
    if (this.tickCount < 25) {
      console.log("TickCount: ", this.tickCount, "Seed:", this.seed);
    };

  }

  animate() {
    const now = performance.now();
    const deltaTime = now - this.lastUpdateTime;
    this.lastUpdateTime = now;
    this.accumulator += deltaTime;

    //this.calculateFPS(now);

    while (this.accumulator >= this.timeStep) {
      this.update();
      this.accumulator -= this.timeStep;
      // if (this.gameStarted === true) {
      //   this.tickCount++;
      // }
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
    console.log("VirtualGame-Konstruktor aufgerufen mit:", gameData);
    super(null, () => gameData.seed);

    // Logge gameData und überprüfe, ob alle benötigten Felder vorhanden sind
    console.log("GameData im Konstruktor:", gameData);

    if (!gameData || !gameData.jumps || !gameData.highscore || !gameData.seed) {
      throw new Error("Fehlende oder ungültige Daten im gameData.");
    }

    this.gameData = gameData;
    this.expectedJumps = gameData.jumps;
    this.highscoreValidated = false;
    this.gameOver = false;

    try {
      this.init();  // Init-Methodenaufruf
    } catch (error) {
      console.error("Fehler bei init():", error);
      throw new Error("Fehler bei der Initialisierung des Spiels.");
    }

    this.gameStarted = true;
  }

  initialCanvas() {
    this.canvas = {
      width: 1200,
      height: 700,
    };
  }

  createImage() {
    return {};
  }

  addEventListener() { }

  createBackgrounds() {
    return [];
  }

  calculateFPS() { }

  draw() { }

  animate() {
    while (!this.gameOver) {
      this.update();
      // if (this.gameStarted === true) {
      //   this.tickCount++;
      // }
      if (this.tickCount >= this.expectedJumps[this.expectedJumps.length - 1] + 200) {
        this.gameOver = true;
        console.log("Spiel beendet. Finaler Highscore:", this.highscore.getCurrentScore());
        return;
      }
    }

    // Beende das Spiel, wenn alle Sprünge verarbeitet sind
    

  }

  update() {
    this.buttonPressed = this.expectedJumps.includes(this.tickCount);
    if (this.buttonPressed) {
      this.playerJump();
      console.log("Spieler gesprungen. Aktueller Highscore:", this.highscore.getCurrentScore());
    }
    super.update();

    if (this.tickCount >= this.expectedJumps[this.expectedJumps.length - 1] + 200) {
      this.validateGameState();
    }
  }

  startGame() {
    this.gameStarted = true;
    this.generator = new SeedGenerator();
    this.initialSeed = this.gameData.seed;
    this.randomGen = this.generator.randomNumbers(this.initialSeed);
    this.seed = this.initialSeed;
    this.randomGen.next();

    // Highscore initialisieren
    this.highscore.reset();
    console.log("Highscore initialisiert:", this.highscore.getCurrentScore());
  }

  endGame() { }

  validateGameState() {
    const serverCalculatedHighscore = this.highscore.getCurrentScore();
    console.log("Validierung gestartet. Erwarteter Highscore:", this.gameData.highscore);
    console.log("Berechneter Highscore:", serverCalculatedHighscore);

    if (serverCalculatedHighscore !== this.gameData.highscore) {
      throw new Error(
        `Highscore mismatch! Expected: ${this.gameData.highscore}, Got: ${serverCalculatedHighscore}`
      );
    }

    this.highscoreValidated = true;
    this.gameOver = true;
    console.log("Spiel validiert und beendet.");
  }
}