import Player from "./Player.js";
import Platform from "./Platform.js";
import Enemy from "./Enemy.js";

class Game {
    constructor(canvas, update) {
        this.canvas = canvas
        this.c = this.canvas.getContext('2d');
        this.canvas.width = 1200;
        this.canvas.height = 700;
        this.gameStarted = false;
        this.canJump = true;
        this.player = null;
        this.platform = new Platform();
        this.c = canvas.getContext('2d');
        this.enemy = new Enemy();
        this.lastUpdateTime = performance.now();
        this.accumulator = 0;
        this.timeStep = 1000 / 60; 
        this.animationFrameID;

        this.update = update;

        this.animate = this.animate.bind(this);
    }


    setPlayer(player){
        this.player = player;
    }

    playerJump() {
        if (this.gameStarted === true && this.canJump === true && this.player.velocity.y === 0) {
            this.canJump = false;
            this.player.velocity.y -= 15;
            console.log("Player jumped");
        }
    }

    startGame() {
        if (!this.gameStarted) {
            this.player.velocity.x = 5;
            this.gameStarted = true;
            const startText = document.getElementById("startText");
            if (startText) {
                startText.classList.add("hide");
            }
            console.log("Game started");
        }
    }

/*    gameUpdate() {
        this.player.update();
        this.player.collisionDetectionPlatforms();
        
        // Reset jump capability if player is on the ground
        if (this.player.position.y + this.player.height >= this.canvas.height) {
            this.canJump = true;
        }
    } */

    draw() {
        this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.player.draw();
    }

    endGame() {
        this.gameStarted = false;
    }

    getGamestate() {
        return this.gameStarted;
    }

    playerCanJump(){
        return this.canJump = true;
    }

    draw() {
        this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.player.draw();
    
        this.platform.getPlatforms().forEach(platform => {
            platform.draw();
        });
    
        this.enemy.getEnemies().forEach(enemy => {
            enemy.draw();
        });
    }

    animate() {
        if (this.player.getGamestate()) return;
    
        
        const now = performance.now();
        const deltaTime = now - this.lastUpdateTime;
        this.lastUpdateTime = now;
        this.accumulator += deltaTime;
    
        while (this.accumulator >= this.timeStep) {
            this.update(this.timeStep / 1000);
            this.accumulator -= this.timeStep;
        }
    
        this.draw();
    
        if (!this.player.getGamestate()) {
            this.animationFrameID = requestAnimationFrame(this.animate);
        }
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