const link = "https://lovelyleap.deno.dev";
const kv = await Deno.openKv();

let gameIDCounter = 1;

const saveGameData = async (request) => {
  const data = await request.json();

  const gameID = gameIDCounter++;
  
  const gameData = {
    gameID,
    highscore: data.highscore,
    username: data.username,
    jumpTimestamps: data.jumps,
  };

  await kv.set(["gameData", gameID.toString()], gameData);

  let response = new Response(JSON.stringify({ status: "success", gameID }));
  return addCORSHeaders(response);
};

const getLeaderboard = async () => {
  const leaderboardEntries = [];

  for await (const entry of kv.list({ prefix: ["gameData"] })) {
    const gameData = await kv.get(entry.key);

    const { gameID, username, highscore } = gameData.value;
    leaderboardEntries.push({ gameID, username, highscore });
  }

  leaderboardEntries.sort((a, b) => b.highscore - a.highscore);

  let response = new Response(JSON.stringify(leaderboardEntries));
  return addCORSHeaders(response);
};

const addCORSHeaders = (response) => {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
};

const handler = async (request) => {

  if (request.method === "OPTIONS") {
    return addCORSHeaders(new Response(null, { status: 204 }));
  }

  switch (link.pathname) {
    case "/":
      return addCORSHeaders(new Response("Welcome to Deno API Server", { status: 200 }));

    case "/api/gameData":
      if (request.method === "POST") {
        return saveGameData(request);
      }
      break;

    case "/api/leaderboard":
      return getLeaderboard();

    default:
      return addCORSHeaders(new Response("Not Found", { status: 404 }));
  }
};
Deno.serve({ link }, handler);
