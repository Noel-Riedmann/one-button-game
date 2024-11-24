const kv = await Deno.openKv();

// Entschlüsseln eines Integers mit AES-GCM
async function decryptHighscore(ciphertext, passphrase) {
  const encoder = new TextEncoder();

  // Erstelle denselben SHA-256-Hash des Passworts
  const keyMaterial = await crypto.subtle.digest("SHA-256", encoder.encode(passphrase));
  const key = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  // Base64-decodiere den verschlüsselten Text
  const encryptedBytes = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

  // Extrahiere die IV (erste 12 Bytes) und die verschlüsselten Daten
  const iv = encryptedBytes.slice(0, 12);
  const encryptedData = encryptedBytes.slice(12);

  // Entschlüssele die Daten
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv }, // GCM mit derselben IV
    key,
    encryptedData
  );

  // Gib den entschlüsselten Integer zurück
  return new Uint8Array(plaintext)[0];
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

  let decryptedHighscore;
  try {
    decryptedHighscore = await decryptHighscore(data.highscore, passphrase);
  } catch (error) {
    console.error("Entschlüsselung fehlgeschlagen:", error);
    return new Response(
      JSON.stringify({ error: "Failed to decrypt highscore." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  if (data.jumps.length < decryptedHighscore) {
    return new Response(
      JSON.stringify({ error: "High score is invalid or potentially cheated." }),
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
    highscore: decryptedHighscore,
    username: data.username,
    jumpTimestamps: data.jumps,
  };

  await kv.set(["gameDataSecure", decryptedHighscore, gameID], gameData);

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
      { prefix: ["gameDataSecure"] }, // Anpassung: "gameDataSecure" statt "gameData"
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
    for await (const entry of kv.list({ prefix: ["gameDataSecure"] })) { // Anpassung: "gameDataSecure"
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
