const link = new URL("https://lovelyleap-onebutton.deno.dev");
const kv = await Deno.openKv();

import { crypto } from "https://deno.land/std@0.201.0/crypto/mod.ts";

const SECRET_KEY = "supersecretkey1234567890";

async function createKey(secret) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    return await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encrypt(data) {
    const key = await createKey(SECRET_KEY);
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encodedData
    );
    return {
        iv: Array.from(iv),
        encryptedData: Array.from(new Uint8Array(encrypted)),
    };
}

async function decrypt(encryptedData, iv) {
    const key = await createKey(SECRET_KEY);
    const ivArray = new Uint8Array(iv);
    const dataArray = new Uint8Array(encryptedData);
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: ivArray },
        key,
        dataArray
    );
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}


const saveGameData = async (request) => {
  const data = await request.json();

  // Highscore verschlüsseln
  const encryptedHighscore = await encrypt(data.highscore);

  const gameID = crypto.randomUUID();
  const gameData = {
      username: data.username,
      highscore: encryptedHighscore.encryptedData, // Verschlüsselter Hash
      iv: encryptedHighscore.iv, // Initialisierungsvektor
      jumpTimestamps: data.jumps,
  };

  await kv.set(["gameData", gameID], gameData);

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
      const gameID = entry.key[1];

      // Highscore entschlüsseln
      const decryptedHighscore = await decrypt(highscore, iv);

      leaderboardEntries.push({
          id: gameID,
          username,
          highscore: decryptedHighscore, // Entschlüsselter Highscore
      });
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