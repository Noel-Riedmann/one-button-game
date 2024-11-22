const link = new URL("https://lovelyleap-onebutton.deno.dev");
const kv = await Deno.openKv();

const decryptData = async (encryptedScore, encryptedIV, publicKey) => {
  const encryptedBytes = Uint8Array.from(atob(encryptedScore), char =>
    char.charCodeAt(0)
  );
  const ivBytes = Uint8Array.from(atob(encryptedIV), char =>
    char.charCodeAt(0)
  );

  const encodedKey = new TextEncoder().encode(publicKey);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encodedKey,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivBytes,
    },
    cryptoKey,
    encryptedBytes
  );

  return new TextDecoder().decode(decrypted);
};

const saveGameData = async (request) => {
  const data = await request.json();
  const gameID = crypto.randomUUID();

  if (!data.highscore || !data.username || !Array.isArray(data.jumps)) {
  if (!data.encryptedScore || !data.encryptedIV || !data.username) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid encrypted data." }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  let decryptedData;
  const publicKey = "highscore.getCurrentScore()";

  try {
    decryptedData = await decryptData(data.encryptedScore, data.encryptedIV, publicKey);
    console.log("Entschlüsselte Daten:", decryptedData);
  } catch (error) {
    console.error("Fehler bei der Entschlüsselung:", error);
    return new Response(
      JSON.stringify({ error: "Failed to decrypt the data." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  const [highscore, key] = decryptedData.split("-");
  if (!highscore || !key || key !== publicKey) {
    return new Response(
      JSON.stringify({ error: "Decrypted data is invalid or tampered." }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  const gameData = {
    highscore: parseInt(highscore, 10),
    username: data.username,
    jumpTimestamps: data.jumps,
  };

  await kv.set(["gameData", gameData.highscore, gameID], gameData);
  return new Response(JSON.stringify({ response: "ok" }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
}

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
    },
  });
};

const deleteGameData = async (request, id, deleteKey) => {
  const FIXED_SECURITY_KEY = "oweztrzwuie23453623z6asdf34571234241ewrt";

  if (deleteKey !== FIXED_SECURITY_KEY) {
    return new Response("Invalid security key", {
      status: 403,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    for await (const entry of kv.list({ prefix: ["gameData"] })) {
      if (entry.key[2] === id) {
        await kv.delete(entry.key);
        return new Response("Deleted successfully", {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }

    return new Response("Entry not found", {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response("Error deleting entry", {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};

const handler = async (request) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");

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
      if (
        request.method === "DELETE" &&
        url.pathname.startsWith("/api/leaderboard/")
      ) {
        const key = segments[4];
        const id = segments[3];
        return deleteGameData(request, id, key);
      }
      return new Response("Endpoint not found", {
        status: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
  }
};

Deno.serve(handler);
