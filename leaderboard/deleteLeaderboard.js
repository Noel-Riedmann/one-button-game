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
    let DELETE_KEY = null;

    try {
        const response = await fetch('deleteKey.txt');
        if (!response.ok) {
            throw new Error('File not found or no access to deleteKey.txt');
        }
        DELETE_KEY = await response.text();
    } catch (error) {
        console.error('Error fetching delete key:', error.message);
        if (error.message.includes('deleteKey.txt')) {
            console.error('Ensure that the deleteKey.txt file exists and has the correct permissions.');
        }
        return;
    }

    try {
        const response = await fetch(`https://lovelyleap-onebutton.deno.dev/api/leaderboard/${id}/${DELETE_KEY}`, {
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
