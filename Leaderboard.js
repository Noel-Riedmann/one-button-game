async function getLeaderboard() {
    const response = await fetch("https://lovelyleap.deno.dev/api/leaderboard");
    const leaderboard = await response.json();
    console.log("Leaderboard:", leaderboard);
    return leaderboard;
}

async function loadGame() {
    const response = await fetch("https://lovelyleap.deno.dev/api/gameData");
    const gameData = await response.json();
    console.log("Loaded Game Data:", gameData);
    return gameData;
}

getLeaderboard();
loadGame();
