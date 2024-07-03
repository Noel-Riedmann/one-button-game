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
let player, floor, enemy;


function init() {
    player = new Player();

    floor = new Floor();

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
    floor.draw(c)
    enemy.draw(c)

    const collisionPointBelow = player.getCollisionPointBelow()
    const collisionPointAbove = player.getCollisionPointAbove()


    if (collisionPointBelow.y >= floor.getPositionY()) {
        player.velocity.y = 0
        player.setPosition(player.getPositionX(), floor.getPositionY() - player.getHeight())
        console.log("collision below");
    }

    if (collisionPointAbove.y <= 0) {
        player.velocity.y = 1
        console.log("collision above");
    }

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
        if (event.keyCode === 32 && player.getPositionY() + player.getHeight() == floor.getPositionY()) {
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