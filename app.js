import Player from "./objects/Player.js"

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')




canvas.width = innerWidth
canvas.height = innerHeight

const player = new Player()
player.draw()

function animate() {
    requestAnimationFrame(animate)
    c.clearRect(0, 0, canvas.width, canvas.height)
    player.update()
}
animate()


document.addEventListener('keydown', (event) => {
    // temporary solution 
    if (event.keyCode === 32 && player.getPositionY() == canvas.height - player.getHeight() + 0.5) {
        player.velocity.y -= 20
    }
    console.log("Space bar pressed");
});

