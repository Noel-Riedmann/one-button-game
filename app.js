import Game from "./objects/Game.js";

const canvas = document.querySelector('canvas');
let game;

function init() {
  game = new Game(canvas);
  game.init()
  checkOrientation();
}

function onResize() {
  const PADDING = 16;

  const factorX = (window.innerWidth - PADDING * 2) / canvas.width;
  const factorY = (window.innerHeight - PADDING * 2) / canvas.height;
  const scaleFactor = Math.min(factorX, factorY);

  document.body.style.setProperty('--canvas-scale', scaleFactor)
}

function checkOrientation() {
  if (window.matchMedia("(orientation: portrait)").matches) {
    alert("Please rotate your device for the best experience.");
  }
}




window.addEventListener("orientationchange", checkOrientation);

window.addEventListener("resize", onResize)
init();
onResize();

