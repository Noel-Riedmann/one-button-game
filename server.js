const link = new URL("https://lovelyleap-onebutton.deno.dev");
const kv = await Deno.openKv();

const saveGameData = async (request) => {
  const data = await request.json();
  const gameID = crypto.randomUUID();

  if (!data.highscore || !data.username || !Array.isArray(data.jumps) || !data.iv) {
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

  const key = /* Der gleiche Schlüssel wie beim Client. Dies könnte entweder ein fester Wert oder durch einen sicheren Key-Austausch bereitgestellt werden. */;
  const iv = new Uint8Array(data.iv);
  const encryptedHighscore = new Uint8Array(data.highscore);

  try {
      const decryptedHighscore = await crypto.subtle.decrypt(
          { name: "AES-CBC", iv },
          key,
          encryptedHighscore
      );

      const decodedHighscore = new TextDecoder().decode(decryptedHighscore);

      if (isNaN(decodedHighscore)) {
          return new Response(
              JSON.stringify({ error: "Highscore decryption failed." }),
              {
                  status: 400,
                  headers: {
                      "Content-Type": "application/json",
                      "Access-Control-Allow-Origin": "*",
                  },
              }
          );
      }

      const highscore = parseInt(decodedHighscore, 10);

      if (data.jumps.length < highscore) {
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
      console.error("Error decrypting highscore:", error);
      return new Response(
          JSON.stringify({ error: "Highscore decryption failed." }),
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
