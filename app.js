import Player from "./objects/Player.js";
import Platform from "./objects/Platform.js";
import Enemy from "./objects/Enemy.js";

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = 1200
canvas.height = 700


let gameStarted = false;
let gameOver = false;
let animationFrameID;
let player, enemies, platform;
let lastUpdateTime = performance.now();
let accumulator = 0;
const timeStep = 1000 / 60; // Assuming 60 FPSs
let canJump = false;


function init() {
    player = new Player();
    platform = new Platform();

    

    enemies = [
        new Enemy(20, 20, 500, 405, "blue"),
        new Enemy(20, 20, 750, 700, "blue"),
        new Enemy(20, canvas.width, 0, canvas.height-5, "red"),
        new Enemy(100,20,canvas.width-40, canvas.height-200, "green")
        
    ]

    gameOver = false;
    gameStarted = false;

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
        update(timeStep / 1000); // Convert ms to seconds
        accumulator -= timeStep;
    }

    draw();

    if (!gameOver) {
        animationFrameID = requestAnimationFrame(animate);
    }
}

function update(step) {
    player.update(step);

    if (player.position.y > canvas.height - 100) {
        player.velocity.x = 0;
        player.velocity.y = 20;
    }
    player.collisionDetectionPlatforms();


    //Enemy Player Collision-Abfrage
    enemies.forEach(enemy => {
        if (
            player.position.x < enemy.position.x + enemy.width &&
            player.position.x + player.width > enemy.position.x &&
            player.position.y + 20 < enemy.position.y + enemy.height &&
            player.position.y + player.height > enemy.position.y
        ) {
            gameOver = true;
            cancelAnimationFrame(animationFrameID);
            init();
            console.log("aösdfjösafjsafs");
            gameStarted = false;
        }
    });
}

function draw() {
    c.clearRect(0, 0, canvas.width, canvas.height);
    player.draw();

    platform.getPlatforms().forEach(platform => {
        platform.draw();
    });

    enemies.forEach(enemy => {
        enemy.draw();
    });
}

document.addEventListener('keydown', (event) => {
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
});

init();
