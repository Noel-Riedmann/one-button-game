import { VirtualGame } from "./objects/Game.js";

const kv = await Deno.openKv();

const saveGameData = async (request) => {
  try {
    const data = await request.json();
    console.log("Empfangene Daten:", data);
    if (!data || typeof data !== "object") {
      throw new Error("Datenformat ungültig oder leer!");
    }
    console.log("Erstelle VirtualGame...");
    const virtualGame = new VirtualGame(data);
    console.log("VirtualGame erfolgreich erstellt!");
    
    // Falls der Anti-Cheat fehlschlägt, fange den Fehler ab
    try {
      console.log("Starte antiCheat");
      virtualGame.init();
      console.log("Anti Cheat bestanden");
    } catch (error) {
      return new Response(JSON.stringify({ error: "Anti-Cheat validation failed" }), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",  
          "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
    

    // Falls der Spieler bestanden hat → Daten speichern
    const gameID = crypto.randomUUID();  
    const gameData = {
      highscore: data.highscore,
      username: data.username,
      jumpTimestamps: data.jumps,
    };

    await kv.set(["gameDataSecure", data.highscore, gameID], gameData);

    return new Response(JSON.stringify({ response: "ok" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",  
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error", details: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",  
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
};


const getLeaderboard = async () => {
  try {
    const leaderboardEntries = [];

    for await (const entry of kv.list(
      { prefix: ["gameDataSecure"] },
      { limit: 10, reverse: true }
    )) {
      const { username, highscore } = entry.value;
      const gameID = entry.key[2];

      leaderboardEntries.push({ id: gameID, username, highscore });
    }

    return new Response(JSON.stringify(leaderboardEntries), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      },
    });
  } catch (error) {
    console.error("Error in getLeaderboard:", error);

    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        },
      }
    );
  }
};

const deleteGameData = async (request, id, deleteKey) => {
  const FIXED_SECURITY_KEY = "oweztrzwuie23453623z6asdf34571234241ewrt";

  if (deleteKey !== FIXED_SECURITY_KEY) {
    return new Response("Invalid security key", {
      status: 403,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      },
    });
  }

  try {
    for await (const entry of kv.list({ prefix: ["gameDataSecure"] })) {
      if (entry.key[2] === id) {
        await kv.delete(entry.key);
        return new Response("Deleted successfully", {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          },
        });
      }
    }

    return new Response("Entry not found", {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      },
    });
  } catch (error) {
    return new Response("Error deleting entry", {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      },
    });
  }
};

const handler = async (request) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      },
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
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        },
      });
  }
};

Deno.serve(handler);
