import Player from "./objects/Player.js"
import Floor from "./objects/Floor.js"


const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = innerWidth
canvas.height = innerHeight

let gameStarted = false
const player = new Player()
player.draw()

const floor = new Floor()

function animate() {
    requestAnimationFrame(animate)
    c.clearRect(0, 0, canvas.width, canvas.height)
    player.update()
    floor.draw()

    const collisionPointBelow = player.getCollisionPointBelow()
    const collisionPointAbove = player.getCollisionPointAbove()

 
    if (collisionPointBelow.y >= floor.getPositionY()) {
        player.velocity.y = 0
        player.setPosition(player.getPositionX(), floor.getPositionY() - player.getHeight())
        console.log("collision below");
    }

    if (collisionPointAbove.y <= 600) {  
        player.velocity.y = 1 
        console.log("collision above");
    }

}
animate()


document.addEventListener('keydown', (event) => {
    if (gameStarted === true) {
        // temporary solution 
        if (event.keyCode === 32 && player.getPositionY() + player.getHeight() == floor.getPositionY()) {
            player.velocity.y -= 20
        }
    }
    if(event.keyCode === 32 && gameStarted == false ){
        player.velocity.x += 5;
        gameStarted = true
        document.getElementById("startText").classList.add("hide");
    }
});

