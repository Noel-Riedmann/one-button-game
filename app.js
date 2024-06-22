import Player from "./objects/Player.js"
import Floor from "./objects/Floor.js"
import Enemy from "./objects/Enemy.js"



const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = innerWidth
canvas.height = innerHeight


    const player = new Player();

    const floor = new Floor();

    const enemy = new Enemy();


function animate() {
    requestAnimationFrame(animate)
    c.clearRect(0, 0, canvas.width, canvas.height)
    player.update()
    floor.draw()
    enemy.draw()

    if (player.getPositionY() + player.getHeight() >= floor.getPositionY()) {
        player.velocity.y = 0
        player.setPosition(player.getPositionX(), innerHeight - 200) //get floor height + player
    }
    
}

animate();

document.addEventListener('keydown', (event) => {
    // temporary solution 
    if (event.keyCode === 32 && player.getPositionY() + player.getHeight() == floor.getPositionY()) {
        player.velocity.y -= 20
    }
    console.log(player.getPositionY(), player.getHeight(), "=", floor.getPositionY());
    console.log(canvas.height);
    console.log("Space bar pressed");
});