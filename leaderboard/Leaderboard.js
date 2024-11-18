async function fetchLeaderboard() {
    try {
        const response = await fetch("https://lovelyleap.deno.dev/api/leaderboard");
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

            const deleteButtonCell = document.createElement("td");
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Löschen";
            deleteButton.addEventListener("click", async () => {
                await deleteEntry(id); // Ruft die Löschfunktion auf
                await fetchLeaderboard(); // Aktualisiert die Tabelle nach dem Löschen
            });

            deleteButtonCell.appendChild(deleteButton);

            row.appendChild(rankCell);
            row.appendChild(usernameCell);
            row.appendChild(highscoreCell);
            row.appendChild(deleteButtonCell);

            leaderboardTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching leaderboard data:", error);
    }
}

async function deleteEntry(id) {
    try {
        const response = await fetch(`https://lovelyleap.deno.dev/api/leaderboard/${id}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error("Failed to delete entry");
        }

        console.log(`Entry with ID ${id} deleted successfully`);
    } catch (error) {
        console.error("Error deleting entry:", error);
    }
}

fetchLeaderboard();
