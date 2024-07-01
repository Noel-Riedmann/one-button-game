import Player from "./objects/Player.js"
import Floor from "./objects/Floor.js"
import Enemy from "./objects/Enemy.js"



const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = innerWidth
canvas.height = innerHeight


let gameStarted = false
const player = new Player();

const floors = [
    new Floor(100, 500, 0, innerHeight - 100),
    new Floor(100, 1000, 700, innerHeight - 100),
    new Floor(30, 300, 1000, 500)
]

const enemy = new Enemy();


function animate() {
    requestAnimationFrame(animate)
    c.clearRect(0, 0, canvas.width, canvas.height)
    player.update()
    enemy.draw()

    floors.forEach(floor => {
        floor.draw()
        const collisionPointBelow = player.getCollisionPointBelow()
        const collisionPointAbove = player.getCollisionPointAbove()
        if((player.position.y + player.height <= floor.position.y + 5 || player.position.y + player.height >= floor.position.y - 5) && player.position.y + player.height != floor.position.y){
            console.log("player is in rage to tp");
        }
        if (collisionPointBelow.y >= floor.position.y && player.position.x > floor.position.x && player.position.x <= floor.position.x + floor.width) {
            player.velocity.y = 0
            if (player.position.y != floor.position.y - player.height && player.velocity.y == 0) {
                player.setPosition(player.position.x, floor.position.y - player.height)
                console.log("player height corrected")
            }
        }

        if (collisionPointAbove.y <= 0) {
            player.velocity.y = 1
            console.log("collision above");
        }
    });







}

animate();

document.addEventListener('keydown', (event) => {
    if (gameStarted === true) {
        // temporary solution 
        if (event.keyCode === 32 /*&& player.getPositionY() + player.getHeight() == floor.getPositionY()*/) {
            player.velocity.y -= 20
        }
    }
    if (event.keyCode === 32 && gameStarted == false) {
        player.velocity.x += 5;
        gameStarted = true
        document.getElementById("startText").classList.add("hide");
    }
});