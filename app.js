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
let player, enemy, floors;


function init() {
    player = new Player();

    floors = [
        new Floor(100, 500, 0, innerHeight - 100),
        new Floor(100, 1000, 700, innerHeight - 100),
        new Floor(30, 300, 1000, 500)
    ]

    enemy = new Enemy();



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
    enemy.draw()

    if (player.position.y > innerHeight - 100) {
        player.velocity.x = 0
        player.velocity.y = 20
    }

    floors.forEach(floor => {
        floor.draw()
        const collisionPointBelow = player.getCollisionPointBelow()
        const collisionPointAbove = player.getCollisionPointAbove()
        if (collisionPointBelow.y >= floor.position.y && player.position.x > floor.position.x && player.position.x <= floor.position.x + floor.width) {
            player.velocity.y = 0
            if (player.position.y + player.height <= floor.position.y - 3 || player.position.y + player.height <= floor.position.y + 3 && player.position.y + player.height != floor.position.y) {
                player.setPosition(player.position.x, floor.position.y - player.height)
                console.log("player height corrected")
            }
        }
        if (collisionPointAbove.y <= 0) {
            player.velocity.y = 1
            console.log("collision above");
        }
    });






    //Enemy Player Collision-Abfrage
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