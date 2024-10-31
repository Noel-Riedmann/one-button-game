const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 8001;

app.use(cors());
app.use(bodyParser.json());

let gameID = 1;
const gameData = {};

app.post('/api/log-game', (req, res) => {
  const { highscore, jumpTimestamps } = req.body;

  gameData[gameID] = {
    highscore,
    jumpTimestamps
  };

  console.log(`Game ${gameID}:`, gameData[gameID]);

  gameID++;
  res.send(`Game logged with gameID ${gameID - 1}`);
});

app.get('/api/get-action', (req, res) => {
  res.json(gameData);
});

app.listen(port, () => {
  console.log(`HTTP webserver running. Access it at: http://localhost:${port}/`);
});