const link = new URL("https://lovelyleap-onebutton.deno.dev");
const kv = await Deno.openKv();

const crypto = globalThis.crypto;

// Geheimer Schlüssel (dieser sollte sicher gespeichert werden, z.B. als Umgebungsvariable)
const secretKey = "oweztrzwuie23453623z6asdf34571234241ewrt"; // Beispiel-Schlüssel (32 Bytes für AES-256)
const algorithm = "aes-256-cbc"; // AES mit CBC-Modus

// Funktion zum Erzeugen eines AES-Schlüssels aus einem geheimen String
const getKey = async () => {
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "AES-CBC" },
    false,
    ["encrypt", "decrypt"]
  );
};

// Funktion zum Entschlüsseln des Highscores
const decryptHighscore = async (encryptedData, iv) => {
  const key = await getKey();
  
  // Umwandeln des Base64-Strings in ArrayBuffer
  const encryptedBuffer = new Uint8Array(atob(encryptedData).split("").map(c => c.charCodeAt(0)));
  const ivBuffer = new Uint8Array(atob(iv).split("").map(c => c.charCodeAt(0)));

  // Entschlüsseln der Daten
  const decryptedData = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv: ivBuffer },
    key,
    encryptedBuffer
  );

  return new TextDecoder().decode(decryptedData);
};

const saveGameData = async (request) => {
  const data = await request.json();
  const gameID = crypto.randomUUID();

  // Entschlüsselung des Highscores
  const decryptedHighscore = await decryptHighscore(data.highscore, data.iv);

  const gameData = {
    highscore: decryptedHighscore, // Hier speichern wir den entschlüsselten Highscore
    username: data.username,
    jumpTimestamps: data.jumps,
  };

  await kv.set(["gameData", data.highscore, gameID], gameData);

  return new Response(JSON.stringify({ response: "ok" }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "content-type",
    },
  });
};


const getLeaderboard = async () => {
  const leaderboardEntries = [];

  for await (const entry of kv.list({ prefix: ["gameData"] }, { limit: 10, reverse: true })) {
    const { username, highscore, iv } = entry.value;
    const gameID = entry.key[2];

    const decryptedHighscore = await decryptHighscore(highscore, new Uint8Array(iv));

    leaderboardEntries.push({ id: gameID, username, highscore: decryptedHighscore });
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


const deleteGameData = async (request, id, deleteKey) => {
  const FIXED_SECURITY_KEY = "oweztrzwuie23453623z6asdf34571234241ewrt";

  if (deleteKey !== FIXED_SECURITY_KEY) {
    return new Response("Invalid security key", {
      status: 403,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type",
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
      return new Response("blub");
  }
};

Deno.serve(handler);