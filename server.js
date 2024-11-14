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

  await kv.set(["gameData", highscore, gameID], gameData);
};

const getLeaderboard = async () => {
  const leaderboardEntries = [];

  for await (const entry of kv.list({ prefix: ["gameData"]}, {limit: 10, reverse: true })) {
    const {username, highscore } = entry.value;
    leaderboardEntries.push({username, highscore });
  }

  return new Response(JSON.stringify(leaderboardEntries), { status: 200, headers: { "Content-Type": "application/json" } });
};

const handler = async (request) => {

  switch (link.pathname) {
    case "/api/leaderboard":
      return request.method === 'POST'?saveGameData(request):      
      getLeaderboard();
  }
};

Deno.serve(handler);