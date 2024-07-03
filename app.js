import Player from "./objects/Player.js"
import Floor from "./objects/Floor.js"
import Enemy from "./objects/Enemy.js"



const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = innerWidth
canvas.height = innerHeight


let gameStarted = false
let gameOver = false;
let animationFrameID;
let player, enemies, floors;


function init() {
    player = new Player();

    floors = [
        new Floor(100, 500, 0, innerHeight - 100),
        new Floor(100, 1000, 700, innerHeight - 100),
        new Floor(30, 300, 1000, 500)
    ]

    enemies = [
        new Enemy(20, 20, 200, 400),
        new Enemy(20, canvas.width, 0, canvas.height)
    ]

    gameOver = false;

    gameStarted = false;

    animate();

    const startText = document.getElementById("startText");
    if (startText) {
        startText.classList.remove("hide");
    }
}


function animate() {
    if (gameOver) return;
    animationFrameID = requestAnimationFrame(animate)
    c.clearRect(0, 0, canvas.width, canvas.height)
    player.update()


    if (player.position.y > innerHeight - 100) {
        player.velocity.x = 0
        player.velocity.y = 20
    }

    floors.forEach(floor => {
        floor.draw();
        const collisionPointBelow = player.getCollisionPointBelow();
        const collisionPointAbove = player.getCollisionPointAbove();

        // Überprüfung, ob der Spieler auf die Plattform fällt
        if (
            collisionPointBelow.y >= floor.position.y &&
            collisionPointBelow.y < floor.position.y + floor.height &&
            player.position.x + player.width > floor.position.x &&
            player.position.x < floor.position.x + floor.width &&
            player.velocity.y >= 0
        ) {
            player.velocity.y = 0;
            player.position.y = floor.position.y - player.height;
            console.log("player landed on platform");
        }

        // Überprüfung, ob der Spieler von unten gegen die Plattform springt
        if (
            collisionPointAbove.y <= floor.position.y + floor.height &&
            collisionPointAbove.y > floor.position.y &&
            player.position.x + player.width > floor.position.x &&
            player.position.x < floor.position.x + floor.width &&
            player.velocity.y < 0
        ) {
            player.velocity.y = Math.abs(player.velocity.y); // Invert the velocity to make the player bounce off
            console.log("collision from below, player bounces off");
        }
    });

    //Enemy Player Collision-Abfrage

    enemies.forEach(enemy => {
        enemy.draw()
        if (
            player.getPositionX() < enemy.getPositionX() + enemy.getWidth() &&
            player.getPositionX() + player.getWidth() > enemy.getPositionX() &&
            player.getPositionY() + 20 < enemy.getPositionY() + enemy.getHeight() &&
            player.getPositionY() + player.getHeight() > enemy.getPositionY()
        ) {
            gameOver = true;
            cancelAnimationFrame(animationFrameID);
            init();
            console.log("aösdfjösafjsafs")
            gameStarted = false;
        }
    })
}

document.addEventListener('keydown', (event) => {
    if (gameStarted === true) {
        // temporary solution 
        if (event.keyCode === 32 /*&& player.getPositionY() + player.getHeight() == floor.getPositionY()*/) {
            player.velocity.y -= 20
        }
    }

    function gameStart() {
        if (event.keyCode === 32 && gameStarted == false) {
            player.velocity.x += 5;
            gameStarted = true
            const startText = document.getElementById("startText");
            if (startText) {
                startText.classList.add("hide");
            }
        }
    }

    gameStart();
});


init();