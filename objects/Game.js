
import Player from "./Player.js";

class Game {
    constructor() {
        this.canvas = document.querySelector('canvas');
        this.c = this.canvas.getContext('2d');
        this.canvas.width = 1200;
        this.canvas.height = 700;
        this.gameStarted = false;
        this.canJump = true;
        this.player = new Player();
    }

    playerJump() {
        if (this.gameStarted === true && this.canJump === true && this.player.velocity.y === 0) {
            this.canJump = false;
            this.player.velocity.y -= 15;

            console.log("test");
        }

        if (this.gameStarted === false) {
            this.player.velocity.x += 5;
            this.gameStarted = true;
            const startText = document.getElementById("startText");
            if (startText) {
                startText.classList.add("hide");
            }
            console.log("test2");
        }
    }

    

    startGame() {
        this.gameStarted = true;
    }

    endGame() {
        this.gameStarted = false;
    }

    getGamestate() {
        return this.gameStarted;
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