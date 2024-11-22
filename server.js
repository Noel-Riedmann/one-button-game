const link = new URL("https://lovelyleap-onebutton.deno.dev");
const kv = await Deno.openKv();

const saveGameData = async (request) => {
  const data = await request.json();
  const gameID = crypto.randomUUID();

  // Hardcodierter privater RSA-Schlüssel im pkcs8-Format
  const rsaPrivateKey = Uint8Array.from([
    100, 56, 205, 17, 23, 203, 193, 194, 129, 45, 116, 251, 59, 54, 98, 34,
    89, 44, 14, 183, 9, 22, 116, 163, 77, 238, 240, 103, 54, 160, 121, 53
    // Füge den vollständigen Schlüssel hier ein...
  ]);

  if (
    !data.highscore ||
    !data.username ||
    !Array.isArray(data.jumps) ||
    !data.aesKey ||
    !data.iv
  ) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid fields in the data." }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  try {
    // Importiere Private Key
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      rsaPrivateKey.buffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"]
    );

    // Entschlüssele AES-Schlüssel
    const encryptedAesKey = new Uint8Array(data.aesKey);
    const aesKeyRaw = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedAesKey
    );

    const aesKey = await crypto.subtle.importKey(
      "raw",
      aesKeyRaw,
      { name: "AES-CBC" },
      false,
      ["decrypt"]
    );

    // Entschlüssele Highscore
    const iv = new Uint8Array(data.iv);
    const encryptedHighscore = new Uint8Array(data.highscore);
    const decryptedHighscore = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv },
      aesKey,
      encryptedHighscore
    );

    const decodedHighscore = new TextDecoder().decode(decryptedHighscore);
    const highscore = parseInt(decodedHighscore, 10);

    if (isNaN(highscore) || data.jumps.length < highscore) {
      return new Response(
        JSON.stringify({
          error: "Invalid highscore or data tampering detected.",
        }),
        { status: 400 }
      );
    }

    // Speichere Spiel-Daten
    const gameData = {
      highscore,
      username: data.username,
      jumpTimestamps: data.jumps,
    };

    await kv.set(["gameData", highscore, gameID], gameData);

    return new Response(JSON.stringify({ response: "ok" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error processing game data:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred while processing the data." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
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
