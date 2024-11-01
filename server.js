const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = 8001;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'game_data'
});

db.connect((err) => {
    if (err) {
        console.error('Fehler bei der Datenbankverbindung:', err);
        return;
    }
    console.log('Mit MySQL-Datenbank verbunden.');
});

app.post('/api/log-jump', (req, res) => {
    const { highscore, timestamp, gameId } = req.body;

    if (highscore == null || timestamp == null || gameId == null) { 
        return res.status(400).json({ error: 'Daten fehlen' });
    }

    const query = 'INSERT INTO jump_logs (game_id, timestamp, highscore) VALUES (?, ?, ?)';
    db.query(query, [gameId, timestamp, highscore], (err, result) => {
        if (err) {
            console.error('Fehler beim Einfügen in die Datenbank:', err);
            return res.status(500).json({ error: 'Fehler beim Speichern der Daten' });
        }
        res.json({ message: 'Jump erfolgreich protokolliert' });
    });
});

app.post('/api/log-game', (req, res) => {
    const { highscore, jumpTimestamps, created_at } = req.body;

    if (!highscore || !jumpTimestamps || !created_at) {
        return res.status(400).json({ error: 'Daten fehlen' });
    }

    const gameQuery = 'INSERT INTO game_logs (highscore) VALUES (?)';
    db.query(gameQuery, [highscore, created_at], (err, result) => {
        if (err) {
            console.error('Fehler beim Speichern der Spiel-Daten:', err);
            return res.status(500).json({ error: 'Fehler beim Speichern der Spiel-Daten' });
        }

        const gameId = result.insertId;

        jumpTimestamps.forEach(({ timestamp, highscore }) => {
            const jumpQuery = 'INSERT INTO jump_logs (game_id, timestamp, highscore) VALUES (?, ?, ?)';
            db.query(jumpQuery, [gameId, timestamp, highscore], (err) => {
                if (err) {
                    console.error('Fehler beim Speichern der Jump-Daten:', err);
                }
            });
        });

        res.json({ message: 'Spielsession erfolgreich protokolliert', gameId });
    });
});

app.get('/api/jump-logs', (req, res) => {
    const query = 'SELECT * FROM jump_logs'; 
    db.query(query, (err, results) => {
        if (err) {
            console.error('Fehler beim Abrufen der Sprungdaten:', err);
            return res.status(500).json({ error: 'Fehler beim Abrufen der Daten' });
        }
        res.json(results);
    });
});

app.get('/api/game-logs', (req, res) => {
    const query = 'SELECT * FROM game_logs';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Fehler beim Abrufen der Spieldaten:', err);
            return res.status(500).json({ error: 'Fehler beim Abrufen der Daten' });
        }
        res.json(results);
    });
});

app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});
