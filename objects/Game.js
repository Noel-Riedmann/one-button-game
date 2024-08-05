import Player from "./Player.js";
import Platform from "./Platform.js";
import Enemy from "./Enemy.js";
import PlatformManager from "./PlatformManager.js";

class Game {
    constructor(canvas) {
        this.canvas = canvas
        this.canvas.width = 1200;
        this.canvas.height = 700;
        this.c = this.canvas.getContext('2d');
        this.platfformanager = new PlatformManager(this)

        this.lastUpdateTime = performance.now();
        this.accumulator = 0;
        this.timeStep = 1000 / 60;
        this.animationFrameID;

        this.animate = this.animate.bind(this);

        document.addEventListener('keydown', this.onKeydown)
        document.addEventListener('keyup', this.onKeyup)
    }

    init() {
        this.gameOver = false;
        this.gameStarted = false;
        this.objects = [
            new Platform(100, this.canvas.width, 0, this.canvas.height - 100, 0),
            new Enemy(20, 20, 0, 300, "blue"),
            new Enemy(20, this.canvas.width, 0, this.canvas.height - 5, "red"),
            new Enemy(100, 20, this.canvas.width - 40, this.canvas.height - 200, "green"),
            new Player()
        ]
        this.animate()
        const startText = document.getElementById("startText"); 
        startText.classList.remove("hide");
    }


    onKeydown = (event) => {
        if (event.keyCode === 32) {
            this.buttonPressed = true;
        }
    }
    onKeyup = (event) => {
        if (event.keyCode === 32) {
            this.buttonPressed = false;
        }
    }

    startGame() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            const startText = document.getElementById("startText");
            if (startText) {
                startText.classList.add("hide");
            }
            console.log("Game started");
        }
    }
    endGame() {
        this.gameStarted = false;
    }

    getGamestate() {
        return this.gameStarted;
    }

    playerCanJump() {
        return this.canJump = true;
    }

    draw() {
        this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.objects.forEach(object => {
            object.draw(this.c)
        });
    }

    update() {
        this.objects.forEach(object => {
            object.update(this)
        });

        this.platfformanager.update()

        if (this.gameOver === true) {
            cancelAnimationFrame(this.animationFrameID);
            this.init();
            console.log("Game Over");
        }

        if (this.gameStarted === false && this.buttonPressed === true) {
            this.startGame()
        }
    }


    animate() {
        const now = performance.now();
        const deltaTime = now - this.lastUpdateTime;
        this.lastUpdateTime = now;
        this.accumulator += deltaTime;

        while (this.accumulator >= this.timeStep) {
            this.update(this.timeStep / 1000);
            this.accumulator -= this.timeStep;
        }

        this.draw();

        this.animationFrameID = requestAnimationFrame(this.animate);



    }




}

export default Game;

/*document.addEventListener('keydown', (event) => {
    if (gameStarted === true) {
        // temporary solution 
        if (event.keyCode === 32 && canJump === true && player.velocity.y === 0) {
            canJump = false
            player.velocity.y -= 15 
        }
    }

    function gameStart() {
        if (event.keyCode === 32 && gameStarted === false) {
            player.velocity.x += 5;
            gameStarted = true;
            const startText = document.getElementById("startText");
            if (startText) {
                startText.classList.add("hide");
            }
        }
    }



    gameStart();
}); */