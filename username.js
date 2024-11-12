const form = document.getElementById('usernameForm');

ommform.addEventListener('submit', function (event) {
    event.preventDefault(); 

    const username = document.getElementById('usernameInput').value;
    if (username) {
        localStorage.setItem('username', username);
        window.location.href = 'index.html'; 
    }
});