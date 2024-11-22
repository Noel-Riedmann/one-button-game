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
    return "Error"; // Rückgabe bei Fehler
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

// Funktion zum Speichern der Spiel-Daten mit Verschlüsselung des Highscores
const saveGameData = async (request) => {
  const data = await request.json();
  const gameID = crypto.randomUUID();

  // Highscore verschlüsseln, bevor es gespeichert wird
  const passphrase = "this.highscore.getCurrentScore()"; // Sicherstellen, dass der Schlüssel sicher ist
  const { ciphertext, iv } = await encryptHighscore(data.highscore, passphrase);

  const gameData = {
    highscore: Array.from(ciphertext), // Umwandeln in ein speicherbares Array
    iv: Array.from(iv), // Umwandeln in ein speicherbares Array
    username: data.username,
    jumpTimestamps: data.jumps,
  };

  await kv.set(["gameData", data.highscore, gameID], gameData);
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
    const passphrase = "this.highscore.getCurrentScore()"; // Sicherstellen, dass der Schlüssel sicher ist

    for await (const entry of kv.list(
      { prefix: ["gameData"] },
      { limit: 10, reverse: true }
    )) {
      const { username, highscore, iv } = entry.value;
      const gameID = entry.key[2];

      // Highscore entschlüsseln, bevor es angezeigt wird
      let decryptedHighscore;
      try {
        // Sicherstellen, dass highscore und iv als Uint8Array verarbeitet werden
        decryptedHighscore = await decryptHighscore(
          new Uint8Array(highscore), // Umwandlung in Uint8Array
          new Uint8Array(iv),        // Umwandlung in Uint8Array
          passphrase
        );
      } catch (decryptionError) {
        console.error("Decryption failed for entry:", entry, decryptionError);
        decryptedHighscore = "Error"; // Falls Entschlüsselung fehlschlägt
      }

      leaderboardEntries.push({ id: gameID, username, highscore: decryptedHighscore });
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
