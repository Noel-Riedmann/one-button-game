const kv = await Deno.openKv();

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

const saveGameData = async (request) => {
  const data = await request.json();
  const gameID = crypto.randomUUID();

  const gameData = {
    highscore: data.highscore,
    iv: data.iv,
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

const getLeaderboard = async () => {
  try {
    const leaderboardEntries = [];
    const passphrase = "my_static_secure_passphrase";

    for await (const entry of kv.list({ prefix: ["gameData"] }, { limit: 10, reverse: true })) {
      const { username, highscore, iv } = entry.value;
      const gameID = entry.key[1];

      let decryptedHighscore = null;

      if (!iv) {
        console.warn("Alte unverschlüsselte Daten erkannt:", highscore);
        decryptedHighscore = typeof highscore === "number" ? highscore : null;
      } 
      else if (iv && !Array.isArray(highscore)) {
        console.error("Fehlerhafte neue unverschlüsselte Daten:", highscore);
        decryptedHighscore = null;
      } 
      else {
        try {
          decryptedHighscore = await decryptHighscore(
            new Uint8Array(highscore),
            new Uint8Array(iv),  
            passphrase
          );
        } catch (error) {
          console.error("Fehler bei der Entschlüsselung:", error);
          decryptedHighscore = null;
        }
      }

      leaderboardEntries.push({
        id: gameID,
        username,
        highscore: decryptedHighscore ?? "N/A",
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
    console.error("Fehler in getLeaderboard:", error);
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

Deno.serve(handler);
