async function fetchLeaderboard() {
    try {
        const response = await fetch("https://lovelyleap.deno.dev/api/leaderboard");
        const data = await response.json();

        // Get the table body element
        const leaderboardTableBody = document.querySelector("#leaderboard-table tbody");
        leaderboardTableBody.innerHTML = ""; // Clear existing content

        // Populate the table with leaderboard data
        data.forEach(({ username, highscore }, index) => {
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

// Call the function to fetch and display the leaderboard
fetchLeaderboard();
