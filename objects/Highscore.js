const storage = typeof localStorage !== "undefined" ? localStorage : {
    getItem: () => null,
    setItem: () => {},
  };

class Highscore {
    constructor() {
        this.highScore = parseInt(storage.getItem('highScore')) || 0;
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
