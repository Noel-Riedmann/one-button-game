class Highscore {
    constructor() {
        this.highScore = parseInt(localStorage.getItem('highScore'))
        this.currentScore = 0;
    }

    update() {
        if (this.currentScore > this.highScore) {
            this.highScore = this.currentScore;
            localStorage.setItem('highScore', this.highScore);
        }
    }

    increment() {
        this.currentScore++;
    }

    resetCurrentScore() {
        this.currentScore = 0;
    }

    getCurrentScore() {
        return this.currentScore;
    }

    getHighScore() {
        return this.highScore;
    }
}

export default Highscore;
