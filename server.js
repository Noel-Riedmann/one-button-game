const link = new URL("https://lovelyleap.deno.dev");
const kv = await Deno.openKv();

const saveGameData = async (request) => {
  const data = await request.json();
  console.log("Received game data:", data); // Debugging-Log

  const gameData = {
    highscore: data.highscore,
    username: data.username,
    jumpTimestamps: data.jumps,
  };

  await kv.set([`gameData:${data.username}`], gameData); // Verwende einen eindeutigen Schlüssel
  console.log("Game data successfully saved:", gameData); // Debugging-Log

  return new Response("Data saved", {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

const getLeaderboard = async () => {
  const leaderboardEntries = [];

  try {
    // Durchlaufe alle gespeicherten Spiel-Daten
    for await (const entry of kv.list({ prefix: ["gameData:"] })) {
      const gameData = await kv.get(entry.key);
      console.log("Fetched game data for leaderboard:", gameData.value); // Debugging-Log

      const { username, highscore } = gameData.value;
      leaderboardEntries.push({ username, highscore });
    }

    // Sortiere die Einträge nach Highscore
    leaderboardEntries.sort((a, b) => b.highscore - a.highscore);
    console.log("Sorted leaderboard:", leaderboardEntries); // Debugging-Log

    return new Response(JSON.stringify(leaderboardEntries), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return new Response("Failed to fetch leaderboard", { status: 500 });
  }
};

const handler = async (request) => {
  const { method, url } = request;
  const path = new URL(url).pathname;

  if (method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  switch (path) {
    case "/api/leaderboard":
      if (method === "POST") {
        return saveGameData(request); // POST-Request
      }
      if (method === "GET") {
        return getLeaderboard(); // GET-Request
      }
      break;
  }

  return new Response("Not Found", { status: 404 });
};

Deno.serve(handler);
