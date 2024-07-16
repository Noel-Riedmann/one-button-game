import Player from "./objects/Player.js";
import Platform from "./objects/Platform.js";
import Enemy from "./objects/Enemy.js";
import Game from "./objects/Game.js";

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
let gameOver = false;
let animationFrameID;
let player, enemy, platform, game;
let lastUpdateTime = performance.now();
let accumulator = 0;
const timeStep = 1000 / 60; 


function init() {
    player = new Player(canvas);
    platform = new Platform(canvas);
    game = new Game(canvas);
    enemy = new Enemy(canvas);

    player.setGame(game);
    game.setPlayer(player);


   

    gameOver = false;
    game.endGame();

    const startText = document.getElementById("startText");
    if (startText) {
        startText.classList.remove("hide");
    }

    animate();
}


function animate() {
    if (gameOver) return;

    
    const now = performance.now();
    const deltaTime = now - lastUpdateTime;
    lastUpdateTime = now;
    accumulator += deltaTime;

    while (accumulator >= timeStep) {
        update(timeStep / 1000);
        accumulator -= timeStep;
    }

    draw();

    if (!gameOver) {
        animationFrameID = requestAnimationFrame(animate);
    }
}


function update(step) {
    player.update(step);


    player.collisionDetectionPlatforms();

    
    player.collisionDetectionEnemies();
   
    if(player.gameOver === true){
        cancelAnimationFrame(animationFrameID);
        init();
        console.log("Game Over");
    }
    
}

function draw() {
    c.clearRect(0, 0, canvas.width, canvas.height);
    player.draw();

    platform.getPlatforms().forEach(platform => {
        platform.draw();
    });

    enemy.getEnemies().forEach(enemy => {
        enemy.draw();
    });
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