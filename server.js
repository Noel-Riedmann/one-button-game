const kv = await Deno.openKv();

// Funktion zum Entschlüsseln des Highscores
async function decryptHighscore(ciphertext, iv, passphrase) {
  try {
    const encoder = new TextEncoder();

    // Passphrase in einen 256-Bit-Schlüssel umwandeln
    const keyMaterial = await crypto.subtle.digest("SHA-256", encoder.encode(passphrase));
    const key = await crypto.subtle.importKey(
      "raw",
      keyMaterial,
      { name: "AES-CBC" },
      false,
      ["decrypt"]
    );

    // Entschlüsseln des Ciphertexts mit dem IV
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv: new Uint8Array(iv) },
      key,
      new Uint8Array(ciphertext)
    );

    // Den entschlüsselten Wert (Integer) extrahieren
    return new Uint8Array(plaintext)[0];
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt highscore");
  }
}

// Funktion zum Verschlüsseln des Highscores
async function encryptHighscore(highscore, passphrase) {
  const encoder = new TextEncoder();
  const highscoreBytes = new Uint8Array([highscore]);

  // Passphrase in einen 256-Bit-Schlüssel umwandeln
  const keyMaterial = await crypto.subtle.digest("SHA-256", encoder.encode(passphrase));
  const key = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );

  // Initialisierungsvektor (IV) generieren
  const iv = crypto.getRandomValues(new Uint8Array(16));

  // Verschlüsseln des Highscores
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    highscoreBytes
  );

  return { ciphertext: new Uint8Array(ciphertext), iv };
}

// Funktion zum Speichern der Spiel-Daten mit direkter Entschlüsselung
const saveGameData = async (request) => {
  const data = await request.json();
  const gameID = crypto.randomUUID();

  // Verschlüsselung der Highscore-Daten
  const passphrase = "secure_key"; // Sicherstellen, dass der Schlüssel sicher ist
  const { ciphertext, iv } = await encryptHighscore(data.highscore, passphrase);

  // Entschlüsselung der Highscore-Daten
  const decryptedHighscore = await decryptHighscore(ciphertext, iv, passphrase);

  // Spiel-Daten mit entschlüsseltem Highscore speichern
  const gameData = {
    highscore: decryptedHighscore, // Highscore wird im Klartext gespeichert
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
