import Player from "./Player.js";


class Game {
    constructor(canvas) {
        this.canvas = canvas
        this.c = this.canvas.getContext('2d');
        this.canvas.width = 1200;
        this.canvas.height = 700;
        this.gameStarted = false;
        this.canJump = true;
        this.player = null;
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

    update() {
        this.player.update();
        this.player.collisionDetectionPlatforms();
        
        // Reset jump capability if player is on the ground
        if (this.player.position.y + this.player.height >= this.canvas.height) {
            this.canJump = true;
        }
    }

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