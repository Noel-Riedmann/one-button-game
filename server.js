const link = new URL("https://lovelyleap.deno.dev");
const kv = await Deno.openKv();

const saveGameData = async (request) => {
  const data = await request.json();

  const gameData = {
    highscore: data.highscore,
    username: data.username,
    jumpTimestamps: data.jumps,
  };

  await kv.set(["gameData"], gameData);

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

  for await (const entry of kv.list({ prefix: ["gameData"] })) {
    const gameData = await kv.get(entry.key);

    const { gameID, username, highscore } = gameData.value;
    leaderboardEntries.push({ gameID, username, highscore });
  }

  leaderboardEntries.sort((a, b) => b.highscore - a.highscore);

  return new Response(JSON.stringify(leaderboardEntries), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
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
      if (method === "POST") return saveGameData(request);
      if (method === "GET") return getLeaderboard();
      break;
  }

  return new Response("Not Found", { status: 404 });
};

Deno.serve(handler);
