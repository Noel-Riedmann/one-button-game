const link = new URL("https://lovelyleap.deno.dev");
const kv = await Deno.openKv();

const saveGameData = async (request) => {
  const data = await request.json();

  const gameData = {
    highscore: data.highscore,
    username: data.username,
    jumpTimestamps: data.jumps,
  };

  console.log("Saving game data:", gameData);

  await kv.set(["gameData"], gameData);

  return new Response("Game data successfully posted", {
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

    console.log("Leaderboard entry:", gameData.value);

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

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  switch (path) {
    case "/api/leaderboard":
      if (method === "POST") {
        const response = await saveGameData(request);
        return new Response(response.body, {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (method === "GET") {
        const response = await getLeaderboard();
        return new Response(response.body, {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      break;
  }

  return new Response("Not Found", { status: 404, headers: corsHeaders });
};


Deno.serve(handler);
