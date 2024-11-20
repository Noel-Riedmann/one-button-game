const link = new URL("https://lovelyleap-onebutton.deno.dev");
const kv = await Deno.openKv();

// Seed-Generator Funktion
function* randomNumbers(seed) {
  let state = Math.floor(seed * 10000);

  const a = 1103515245;
  const c = 12345;
  const m = 2 ** 31;

  while (true) {
    state = (a * state + c) % m;
    yield state / m;
  }
}

// Spielsimulation für Validierung
function simulateGame(seed, jumpTicks) {
  let randomGen = randomNumbers(seed);
  let tickCount = 0;
  let score = 0;

  // Beispiel: einfache Spielphysik
  let playerY = 0;
  let gravity = 0.98;
  let jumpStrength = -10;
  let velocity = 0;
  let gameOver = false;

  // Set für schnelleren Zugriff auf Sprünge
  const jumpSet = new Set(jumpTicks);

  while (!gameOver) {
    // Simuliere Tick
    if (jumpSet.has(tickCount)) {
      velocity = jumpStrength;
    }

    velocity += gravity;
    playerY += velocity;

    // Score erhöhen, wenn der Spieler im Spiel bleibt
    score++;

    // Spiel-Ende Bedingung (z. B. Spieler fällt zu tief)
    if (playerY > 1000 || playerY < -100) {
      gameOver = true;
    }

    // Nächsten Tick vorbereiten
    tickCount++;

    // Optional: Seed voranschreiten lassen
    randomGen.next();
  }

  return score;
}

// Highscore speichern mit Validierung
const saveGameData = async (request) => {
  const data = await request.json();
  const { seed, jumps, highscore, username } = data;

  console.log("Received data from client:", data);

  // Simuliere das Spiel
  try {
    const calculatedScore = simulateGame(seed, jumps);

    // Validierung
    if (calculatedScore !== highscore) {
      return new Response(
        JSON.stringify({ error: "Invalid highscore." }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Daten speichern, wenn gültig
    const gameID = crypto.randomUUID();
    const gameData = {
      username,
      highscore,
      jumpTimestamps: jumps,
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
    console.error("Simulation error:", error);
    return new Response(
      JSON.stringify({ error: "Server validation error." }),
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

// Highscore-API Handler
const handler = async (request) => {
  const url = new URL(request.url);
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
        const id = url.pathname.split("/").pop();
        return deleteGameData(request, id);
      }
      return new Response("blub");
  }
};

Deno.serve(handler);
