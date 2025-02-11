import { VirtualGame } from "./objects/Game.js";

const kv = await Deno.openKv();

// CORS-Header für alle Responses
const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const saveGameData = async (request) => {
  try {
    console.log("saveGameData gestartet");
    console.log("Request-Method:", request.method);
    console.log("Header:", JSON.stringify([...request.headers], null, 2));

    // Daten aus dem Request-Body extrahieren
    const data = await request.json();
    console.log("Raw input data:", JSON.stringify(data, null, 2));

    // Validierung der Eingabedaten
    if (!data || typeof data !== "object") {
      throw new Error("Datenformat ungültig oder leer!");
    }
    if (!data.seed || !data.highscore || !data.username || !data.jumps) {
      throw new Error("Fehlende erforderliche Felder in den Daten!");
    }

    // VirtualGame erstellen
    console.log("Creating VirtualGame with seed:", data.seed);
    try {
      const virtualGame = new VirtualGame(data);
      console.log("VirtualGame erfolgreich erstellt!");
    } catch (error) {
      console.error("Fehler beim Erstellen von VirtualGame:", error);
      throw new Error("Fehler beim Erstellen des Spiels: " + error.message);
    }

    // Anti-Cheat-Überprüfung
    console.log("Starte antiCheat");
    try {
      virtualGame.init();
      console.log("Anti Cheat bestanden");
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Anti-Cheat validation failed" }),
        {
          status: 403,
          headers: CORS_HEADERS,
        }
      );
    }

    // Spielerdaten speichern
    const gameID = crypto.randomUUID();
    const gameData = {
      highscore: data.highscore,
      username: data.username,
      jumpTimestamps: data.jumps,
    };

    await kv.set(["gameDataSecure", gameID], gameData);

    return new Response(JSON.stringify({ response: "ok" }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error("Fehler in saveGameData:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: error.message }),
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
};

const getLeaderboard = async () => {
  try {
    const leaderboardEntries = [];

    // Alle Einträge aus dem KV-Store abrufen
    for await (const entry of kv.list({ prefix: ["gameDataSecure"] })) {
      const { username, highscore } = entry.value;
      const gameID = entry.key[1]; // gameID ist der zweite Teil des Keys

      leaderboardEntries.push({ id: gameID, username, highscore });
    }

    // Nach Highscore sortieren (absteigend)
    leaderboardEntries.sort((a, b) => b.highscore - a.highscore);

    // Nur die Top 10 Einträge zurückgeben
    return new Response(JSON.stringify(leaderboardEntries.slice(0, 10)), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error("Error in getLeaderboard:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: error.message }),
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
};

const deleteGameData = async (request, id, deleteKey) => {
  const FIXED_SECURITY_KEY = "oweztrzwuie23453623z6asdf34571234241ewrt";

  // Sicherheitsüberprüfung
  if (deleteKey !== FIXED_SECURITY_KEY) {
    return new Response("Invalid security key", {
      status: 403,
      headers: CORS_HEADERS,
    });
  }

  try {
    // Eintrag im KV-Store löschen
    await kv.delete(["gameDataSecure", id]);
    return new Response("Deleted successfully", {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error("Error deleting entry:", error);
    return new Response("Error deleting entry", {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
};

const handler = async (request) => {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split("/");

    // CORS-Preflight-Anfrage behandeln
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: CORS_HEADERS,
      });
    }

    // Routing
    switch (url.pathname) {
      case "/api/leaderboard":
        return request.method === "POST" ? saveGameData(request) : getLeaderboard();
      default:
        if (
          request.method === "DELETE" &&
          url.pathname.startsWith("/api/leaderboard/")
        ) {
          const key = segments[4];
          const id = segments[3];
          return deleteGameData(request, id, key);
        }
        return new Response("Endpoint not found", {
          status: 404,
          headers: CORS_HEADERS,
        });
    }
  } catch (error) {
    console.error("Handler error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
};

// Server starten
Deno.serve(handler);