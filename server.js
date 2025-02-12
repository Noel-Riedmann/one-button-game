import { VirtualGame } from "./objects/Game.js";

const kv = await Deno.openKv();

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

    const data = await request.json();
    console.log("Raw input data:", JSON.stringify(data, null, 2));

    if (!data || typeof data !== "object") {
      throw new Error("Datenformat ungültig oder leer!");
    }
    if (!data.seed || !data.highscore || !data.username || !data.jumps) {
      throw new Error("Fehlende erforderliche Felder in den Daten!");
    }

    console.log("Creating VirtualGame with seed:", data.seed);
    let virtualGame;
    try {
      virtualGame = new VirtualGame(data);
      console.log("VirtualGame erfolgreich erstellt!");
    } catch (error) {
      console.error("Fehler beim Erstellen von VirtualGame:", error);
      throw new Error("Fehler beim Erstellen des Spiels: " + error.message);
    }

    console.log("Starte antiCheat-Simulation");
    try {
      virtualGame.animate();
      console.log("Anti Cheat bestanden");
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Anti-Cheat validation failed", details: error.message }),
        {
          status: 403,
          headers: CORS_HEADERS,
        }
      );
    }

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

    for await (const entry of kv.list({ prefix: ["gameDataSecure"] })) {
      const { username, highscore } = entry.value;
      const gameID = entry.key[1];

      leaderboardEntries.push({ id: gameID, username, highscore });
    }

    leaderboardEntries.sort((a, b) => b.highscore - a.highscore);

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

  if (deleteKey !== FIXED_SECURITY_KEY) {
    return new Response("Invalid security key", {
      status: 403,
      headers: CORS_HEADERS,
    });
  }

  try {
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

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: CORS_HEADERS,
      });
    }

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

Deno.serve(handler);
