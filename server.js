const link = new URL("https://lovelyleap-onebutton.deno.dev");
const kv = await Deno.openKv();

const saveGameData = async (request) => {
  const data = await request.json();
  const gameID = crypto.randomUUID();

  // Hardcodierter privater RSA-Schlüssel (pkcs8-Format, Base64-Daten als Uint8Array)
  const rsaPrivateKey = Uint8Array.from([
      // Dein private key in Base64 dekodiert, hier als Beispiel:
      48, 130, 2, 92, 2, 1, 0, 2, 129, 129, 0, 176, 110, 35, 177, 203,
      // Füge den vollständigen Schlüssel als Byte-Array hinzu
  ]);

  if (!data.highscore || !data.username || !Array.isArray(data.jumps) || !data.aesKey || !data.iv) {
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
      // 1. Importiere den Private Key für RSA
      const privateKey = await crypto.subtle.importKey(
          "pkcs8",
          rsaPrivateKey.buffer, // ArrayBuffer des Schlüssels
          { name: "RSA-OAEP", hash: "SHA-256" },
          false,
          ["decrypt"]
      );

      // 2. AES-Schlüssel entschlüsseln
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

      // 3. Highscore entschlüsseln
      const iv = new Uint8Array(data.iv);
      const encryptedHighscore = new Uint8Array(data.highscore);
      const decryptedHighscore = await crypto.subtle.decrypt(
          { name: "AES-CBC", iv },
          aesKey,
          encryptedHighscore
      );

      const decodedHighscore = new TextDecoder().decode(decryptedHighscore);
      const highscore = parseInt(decodedHighscore, 10);

      // 4. Validierung des Highscores
      if (isNaN(highscore) || data.jumps.length < highscore) {
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

      // 5. Spiel-Daten speichern
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
