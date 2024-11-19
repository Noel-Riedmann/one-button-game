const link = new URL("https://lovelyleap-onebutton.deno.dev");
const kv = await Deno.openKv();
const API_KEY = Deno.env.get("API_KEY");

if (!API_KEY) {
  console.error("API key missing!");
  Deno.exit(1);
};

async function verifySignature(data, clientSignature) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SHARED_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const message = JSON.stringify(data);
  const decodedSignature = Uint8Array.from(
    atob(clientSignature),
    char => char.charCodeAt(0)
  );

  return await crypto.subtle.verify(
    "HMAC",
    key,
    decodedSignature,
    encoder.encode(message)
  );
}

const saveGameData = async (request) => {
  try {
    const data = await request.json();
    const clientSignature = request.headers.get("x-signature");

    if (!clientSignature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const isValid = await verifySignature(data, clientSignature);

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!data.jumps || data.jumps.length < data.highscore) {
      return new Response(
        JSON.stringify({ error: "Invalid data" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const gameID = crypto.randomUUID();
    const gameData = {
      highscore: data.highscore,
      username: data.username,
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
