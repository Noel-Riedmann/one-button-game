const kv = await Deno.openKv();

// Highscore entschlüsseln
async function decryptHighscore(ciphertext, iv, passphrase) {
  try {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.digest("SHA-256", encoder.encode(passphrase));
    const key = await crypto.subtle.importKey("raw", keyMaterial, { name: "AES-CBC" }, false, ["decrypt"]);

    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv: new Uint8Array(iv) },
      key,
      new Uint8Array(ciphertext)
    );

    const value = new Uint8Array(plaintext)[0];
    if (isNaN(value)) throw new Error("Invalid decrypted value");
    return value;
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
}

// Spiel-Daten speichern
const saveGameData = async (request) => {
  const data = await request.json();
  const gameID = crypto.randomUUID();

  const gameData = {
    highscore: data.highscore, // Bereits verschlüsselt vom Client
    iv: data.iv,              // Bereits verschlüsselt vom Client
    username: data.username,
    jumpTimestamps: data.jumps,
  };

  await kv.set(["gameData", gameID], gameData);
  return new Response(JSON.stringify({ response: "ok" }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

// Leaderboard abrufen
const getLeaderboard = async () => {
  try {
    const leaderboardEntries = [];
    const passphrase = "my_static_secure_passphrase"; // Übereinstimmung mit dem Client

    for await (const entry of kv.list({ prefix: ["gameData"] }, { limit: 10, reverse: true })) {
      const { username, highscore, iv } = entry.value;
      const gameID = entry.key[1];

      const decryptedHighscore = await decryptHighscore(
        highscore,
        iv,
        passphrase
      );

      leaderboardEntries.push({
        id: gameID,
        username,
        highscore: decryptedHighscore ?? "N/A", // Fehlerhafte Werte behandeln
      });
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

// Eintrag löschen
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
      if (entry.key[1] === id) {
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

// Haupt-Handler
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
      if (request.method === "DELETE" && url.pathname.startsWith("/api/leaderboard/")) {
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
