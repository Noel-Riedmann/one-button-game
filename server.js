const link = new URL("https://lovelyleap-onebutton.deno.dev");
const kv = await Deno.openKv();

const decryptData = async (encryptedData, ivBase64, secretKey) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Hashen des geheimen Schlüssels auf 256 bits mit SHA-256
  const keyHash = await crypto.subtle.digest("SHA-256", encoder.encode(secretKey));

  // Erstellen des AES-Schlüssels aus dem gehashten Wert
  const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyHash, // Verwenden des SHA-256-gehashten Schlüssels
      { name: "AES-GCM" },
      false,
      ["decrypt"]
  );

  // IV und verschlüsselten Text dekodieren
  const iv = new Uint8Array(atob(ivBase64).split('').map(c => c.charCodeAt(0)));
  const encrypted = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));

  // Daten entschlüsseln
  const decryptedData = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      cryptoKey,
      encrypted
  );

  // Entschlüsselte Daten in Text umwandeln
  return decoder.decode(decryptedData);
};

const saveGameData = async (request) => {
  const data = await request.json();
  const gameID = crypto.randomUUID();

  // Überprüfen, ob der verschlüsselte Highscore vorhanden ist
  if (!data.encryptedHighscore || !data.username || !Array.isArray(data.jumps)) {
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

  // Geheimen Schlüssel verwenden (muss der gleiche sein wie auf dem Client)
  const secretKey = "yourSecretKey";

  // Entschlüsselung des Highscores
  let decryptedHighscore;
  try {
      // Der Highscore wird aus den Base64-codierten Teilen (iv und data) entpackt
      const [ivBase64, encryptedHighscore] = data.encryptedHighscore.split(':');
      decryptedHighscore = await decryptData(encryptedHighscore, ivBase64, secretKey);
      decryptedHighscore = parseInt(decryptedHighscore); // Umwandeln in eine Zahl
  } catch (error) {
      return new Response(
          JSON.stringify({ error: "Error decrypting highscore." }),
          {
              status: 500,
              headers: {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*",
              },
          }
      );
  }

  // Überprüfen des Highscores
  if (!decryptedHighscore || !data.username || !Array.isArray(data.jumps)) {
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

  // Game-Daten speichern
  const gameData = {
      highscore: decryptedHighscore, // Entschlüsselter Highscore wird gespeichert
      username: data.username,
      jumpTimestamps: data.jumps,
  };

  // GameData in der Datenbank speichern
  await kv.set(["gameData", decryptedHighscore, gameID], gameData);
  
  // Erfolg zurückgeben
  return new Response(JSON.stringify({ response: "ok" }), {
      status: 200,
      headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
      },
  });
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
