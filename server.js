const kv = await Deno.openKv();

// Funktion zum Entschlüsseln des Highscores
async function decryptHighscore(ciphertext, iv, passphrase) {
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.digest("SHA-256", encoder.encode(passphrase));
  const key = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv: new Uint8Array(iv) },
    key,
    new Uint8Array(ciphertext)
  );

  return new Uint8Array(plaintext)[0];
}

// Funktion zum Verschlüsseln des Highscores
async function encryptHighscore(highscore, passphrase) {
  const encoder = new TextEncoder();
  const highscoreBytes = new Uint8Array([highscore]);

  const keyMaterial = await crypto.subtle.digest("SHA-256", encoder.encode(passphrase));
  const key = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(16));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    highscoreBytes
  );

  return { ciphertext: new Uint8Array(ciphertext), iv };
}

// Funktion zum Speichern der Spiel-Daten
const saveGameData = async (request) => {
  const data = await request.json();
  const gameID = crypto.randomUUID();

  if (!data.highscore || !data.username || !Array.isArray(data.jumps)) {
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

  const passphrase = "secure_passphrase";
  const { ciphertext, iv } = await encryptHighscore(data.highscore, passphrase);

  let decryptedHighscore;
  try {
    decryptedHighscore = await decryptHighscore(ciphertext, iv, passphrase);
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to encrypt or decrypt highscore." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  const gameData = {
    highscore: decryptedHighscore,
    username: data.username,
    jumpTimestamps: data.jumps,
  };

  await kv.set(["gameData", decryptedHighscore, gameID], gameData);

  return new Response(JSON.stringify({ response: "ok" }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

// Funktion zum Abrufen des Leaderboards
const getLeaderboard = async () => {
  try {
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
  } catch (error) {
    console.error("Error in getLeaderboard:", error);

    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: error.message }),
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

// Funktion zum Löschen eines Eintrags
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

// Haupt-Handler für die API
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

// Server starten
Deno.serve(handler);
