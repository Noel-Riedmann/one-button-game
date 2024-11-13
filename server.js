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
};

const getLeaderboard = async () => {
  const leaderboardEntries = [];

  for await (const entry of kv.list({ prefix: ["gameData"] })) {
    const gameData = await kv.get(entry.key);

    const { gameID, username, highscore } = gameData.value;
    leaderboardEntries.push({ gameID, username, highscore });
  }

  leaderboardEntries.sort((a, b) => b.highscore - a.highscore);
  return new Response(JSON.stringify(leaderboardEntries), { status: 200, headers: { "Content-Type": "application/json" } });
};

const handler = async (request) => {

  switch (link.pathname) {
    case "/api/leaderboard":
      return getLeaderboard();
  }
};

Deno.serve({ link }, handler);
