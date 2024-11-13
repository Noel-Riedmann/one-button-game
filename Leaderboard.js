async function getLeaderboard() {
    const response = await fetch("https://lovelyleap.deno.dev/api/leaderboard");
    const leaderboard = await response.json();
    console.log("Leaderboard:", leaderboard);
    return leaderboard;
}

getLeaderboard();
