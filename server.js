const link = new URL("https://lovelyleap.deno.dev");
const kv = await Deno.openKv();



const saveGameData = async (request) => {
  const data = await request.json();
  const gameID = crypto.randomUUID();

  
  const gameData = {
    highscore: data.highscore,
    username: data.username,
    jumpTimestamps: data.jumps,
  };

  await kv.set(["gameData", data.highscore, gameID], gameData);
  return new Response(JSON.stringify({response: "ok"}), { status: 200, headers: { "Content-Type": "application/json","Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"content-type"} });
};

const getLeaderboard = async () => {
  const leaderboardEntries = [];

  for await (const entry of kv.list({ prefix: ["gameData"]}, {limit: 10, reverse: true })) {
    const {username, highscore } = entry.value;
    leaderboardEntries.push({username, highscore });
  }

  return new Response(JSON.stringify(leaderboardEntries), { status: 200, headers: { "Content-Type": "application/json","Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"content-type"} });
};

const handler = async (request) => {
const url = new URL(request.url)
if (request.method === 'OPTIONS'){
    return new Response(null, {headers: {"Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"content-type"}})
}
  switch (url.pathname) {
    case "/api/leaderboard":
      return request.method === 'POST'?saveGameData(request):      
      getLeaderboard();

    default:
        return new Response("blub");
  }
};

Deno.serve(handler);