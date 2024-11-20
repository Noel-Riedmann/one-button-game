import virtualGame from "./virtualGame.js"; // Importiere die virtualGame-Klasse

const link = new URL("https://lovelyleap-onebutton.deno.dev");
const kv = await Deno.openKv();

const saveGameData = async (request) => {
  const data = await request.json();
  const gameID = crypto.randomUUID();

  // Validierungslogik: Prüfen, ob die Daten korrekt sind
  // if (!data.jumps || data.jumps.length < data.highscore) {
  //   return new Response(
  //     JSON.stringify({ error: "Invalid data: jumps do not match highscore" }),
  //     { status: 400, headers: { "Content-Type": "application/json" } }
  //   );
  // }

  try {
    // Starte die Simulation
    const gameSimulator = new virtualGame(data);
    gameSimulator.animate(); // Simuliere das Spiel bis zur Validierung

    // Prüfe, ob die Highscore-Berechnung korrekt war
    if (!gameSimulator.highscoreValidated) {
      throw new Error("Highscore validation failed!");
    }

    // Wenn die Simulation erfolgreich ist, speichere die Daten
    const gameData = {
      highscore: data.highscore,
      username: data.username,
      jumpTimestamps: data.jumps,
    };

    await kv.set(["gameData", data.highscore, gameID], gameData);
    return new Response(JSON.stringify({ response: "ok" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Simulation failed: ${error.message}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
};

const getLeaderboard = async () => {
  const leaderboardEntries = [];

  for await (const entry of kv.list(
    { prefix: ["gameData"] },
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
      "Access-Control-Allow-Headers": "content-type",
    },
  });
};

const deleteGameData = async (request, id) => {
  try {
    for await (const entry of kv.list({ prefix: ["gameData"] })) {
      if (entry.key[2] === id) {
        await kv.delete(entry.key);
        return new Response("Deleted successfully", {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "content-type",
          },
        });
      }
    }
    return new Response("Entry not found", {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type",
      },
    });
  } catch (error) {
    return new Response("Error deleting entry", {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type",
      },
    });
  }
};

const handler = async (request) => {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      },
    });
  }

  switch (url.pathname) {
    case "/api/leaderboard":
      return request.method === "POST"
        ? saveGameData(request)
        : getLeaderboard();

    default:
      if (request.method === "DELETE" && url.pathname.startsWith("/api/leaderboard/")) {
        const id = url.pathname.split("/").pop();
        return deleteGameData(request, id);
      }
      return new Response("Invalid endpoint", { status: 404 });
  }
};

Deno.serve(handler);
