const link = new URL("https://lovelyleap-onebutton.deno.dev");
const kv = await Deno.openKv();

const saveGameData = async (request) => {
  try {
    const data = await request.json();

    if (
      typeof data.username !== "string" || data.username.trim() === "" ||
      typeof data.highscore !== "number" || data.highscore < 0 ||        
      !Array.isArray(data.jumps) ||                                      
      data.jumps.some((jump) => typeof jump !== "number" || jump < 0) || 
      data.jumps.length === 0                                            
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid data: jumpTimestamps array is empty or invalid" }),
        { status: 400 }
      );
    }

    const MAX_HIGHSCORE = 999999;
    if (data.highscore > MAX_HIGHSCORE) {
      return new Response(
        JSON.stringify({ error: "Highscore exceeds limit" }),
        { status: 400 }
      );
    }

    const gameID = crypto.randomUUID();
    const gameData = {
      highscore: data.highscore,
      username: data.username.trim(),
      jumpTimestamps: data.jumps,
    };

    await kv.set(["gameData", data.highscore, gameID], gameData);

    return new Response(
      JSON.stringify({ response: "ok", id: gameID }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error saving game data:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
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
      return new Response("blub");
  }
};

Deno.serve(handler);
