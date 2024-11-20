async function fetchLeaderboard() {
    try {
        const response = await fetch("https://lovelyleap-onebutton.deno.dev/api/leaderboard");
        const data = await response.json();

        const leaderboardTableBody = document.querySelector("#leaderboard-table tbody");
        leaderboardTableBody.innerHTML = "";

        data.forEach(({ id, username, highscore }, index) => {
            const row = document.createElement("tr");

            const rankCell = document.createElement("td");
            rankCell.textContent = index + 1;

            const usernameCell = document.createElement("td");
            usernameCell.textContent = username;

            const highscoreCell = document.createElement("td");
            highscoreCell.textContent = highscore;

            const actionCell = document.createElement("td");
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", () => deleteLeaderboardEntry(id, row));

            actionCell.appendChild(deleteButton);
            row.appendChild(rankCell);
            row.appendChild(usernameCell);
            row.appendChild(highscoreCell);
            row.appendChild(actionCell);

            leaderboardTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching leaderboard data:", error);
    }
}

async function deleteLeaderboardEntry(id, row) {
    try {
        const response = await fetch(`https://lovelyleap-onebutton.deno.dev/api/leaderboard/${id}`, {
            method: "DELETE",
        });

        if (response.ok) {
            row.remove();
            console.log(`Entry with ID ${id} deleted successfully`);
        } else {
            console.error(`Failed to delete entry with ID ${id}`);
        }
    } catch (error) {
        console.error("Error deleting leaderboard entry:", error);
    }
}

fetchLeaderboard();
