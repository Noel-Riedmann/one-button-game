import Player from "./objects/Player.js";
import Enemy from "./objects/Enemy.js";
import Game from "./objects/Game.js";
import PlatformManager from "./objects/PlatformManager.js";

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
let gameOver = false;
let player, enemy, game, platformManager;
const timeStep = 1000 / 60; 


function init() {
    player = new Player(canvas,init);
    game = new Game(canvas, update);
    enemy = new Enemy(canvas);
    platformManager = new PlatformManager(canvas);

    player.setGame(game);
    game.setPlayer(player);

    gameOver = false;
    game.endGame();

    const startText = document.getElementById("startText");
    if (startText) {
        startText.classList.remove("hide");
    }

    game.animate();
}

function update(step) {
    player.update(step);
    player.collisionDetectionPlatforms();
    player.collisionDetectionEnemies();
    player.checkDead();
    platformManager.update(step);
}




document.addEventListener('keydown', (event) => {
    if (event.keyCode === 32) {
        if (game.gameStarted === false) {
            game.startGame();
        } else {
            game.playerJump();
        }
    }
});

init();