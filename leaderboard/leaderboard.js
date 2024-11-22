async function fetchLeaderboard() {
    try {
        const response = await fetch("https://lovelyleap-onebutton.deno.dev/api/leaderboard");

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Unexpected server response format");
        }

        const leaderboardTableBody = document.querySelector("#leaderboard-table tbody");
        leaderboardTableBody.innerHTML = "";

        data.forEach(({ username, highscore }, index) => {
            if (highscore === "Error" || typeof highscore !== "number") {
                console.warn(`Skipping invalid entry: ${username}, Highscore: ${highscore}`);
                return;
            }

            const row = document.createElement("tr");

            const rankCell = document.createElement("td");
            rankCell.textContent = index + 1;

            const usernameCell = document.createElement("td");
            usernameCell.textContent = username;

            const highscoreCell = document.createElement("td");
            highscoreCell.textContent = highscore;

            row.appendChild(rankCell);
            row.appendChild(usernameCell);
            row.appendChild(highscoreCell);

            leaderboardTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching leaderboard data:", error);        
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchLeaderboard();
    setInterval(fetchLeaderboard, 15000);
});
