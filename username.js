document.addEventListener('DOMContentLoaded', () => {
    const usernameInput = document.getElementById('usernameInput');
    const savedUsername = localStorage.getItem('username');
    
    if (savedUsername) {
        usernameInput.placeholder = savedUsername;
    }

    const form = document.getElementById('usernameForm');
    form.addEventListener('submit', function (event) {
        event.preventDefault();
        
        const username = usernameInput.value;
        if (username) {
            localStorage.setItem('username', username);
            window.location.href = 'index.html';
        }
    });
});
