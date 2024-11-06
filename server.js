const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 8001;

// MySQL-Verbindung konfigurieren
const db = mysql.createConnection({
    host: "localhost",
    user: "root", // Dein MySQL-Benutzername
    password: "", // Dein MySQL-Passwort, leer lassen für XAMPP Standard
    database: "game_logs",
});

db.connect((err) => {
    if (err) throw err;
    console.log("MySQL connected...");
});

app.use(cors());
app.use(bodyParser.json());

// API zum Speichern der Spieldaten
app.post("/api/log-action", (req, res) => {
    const { game_id, highscore, jumpTimestamps } = req.body;

    const query = `INSERT INTO logs (game_id, highscore, jump_timestamps) VALUES (?, ?, ?)`;
    const values = [game_id, highscore, JSON.stringify(jumpTimestamps)];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error("Fehler beim Speichern der Aktion:", err);
            return res.status(500).send("Fehler beim Speichern der Aktion");
        }
        console.log("Daten gespeichert:", { game_id, highscore, jumpTimestamps });
        res.send("Aktion erfolgreich gespeichert");
    });
});

// API zum Abrufen der Spieldaten
app.get("/api/get-actions", (req, res) => {
    db.query("SELECT * FROM logs", (err, results) => {
        if (err) {
            console.error("Fehler beim Abrufen der Daten:", err);
            return res.status(500).send("Fehler beim Abrufen der Daten");
        }
        res.json(results);
    });
});

app.listen(port, () => {
    console.log(`Server läuft auf: http://localhost:${port}`);
});