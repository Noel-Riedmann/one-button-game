const port = 8000;
const kv = await Deno.openKv();

let gameIDCounter = 1;

const prefs = {
  username: "ada",
  theme: "dark",
  language: "en-US",
};

await kv.set(["preferences", "ada"], prefs);

const saveGameData = async (request) => {
  const data = await request.json();
  
  const gameID = gameIDCounter;
  gameIDCounter++;
  
  const gameData = { ...data, gameID };

  await kv.set(["gameData", gameID.toString()], gameData);

  let response = new Response(JSON.stringify({ status: "success", gameID }));
  return addCORSHeaders(response);
};

const getLeaderboard = async () => {
  const leaderboardEntries = [];

  for await (const entry of kv.list({ prefix: ["gameData"] })) {
    const gameData = await kv.get(entry.key);
    leaderboardEntries.push(gameData.value);
  }

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
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    let response = new Response(null, { status: 204 });
    return addCORSHeaders(response);
  }

  switch (url.pathname) {
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

console.log(`HTTP webserver running. Access it at: http://localhost:${port}/`);
Deno.serve({ port }, handler);
