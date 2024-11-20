class Ground {
        constructor(imageSrc, speed, game) {
            this.image = new Image();
            this.image.src = imageSrc;
            this.speed = speed;
            this.game = game;
    
            this.x1 = 0;
            this.x2 = 0;
    
            this.gaps = [];
    
            this.image.onload = () => {
                this.x2 = this.image.width;
            };
    
            this.gapInterval = Math.random() * 3000 + 2000; 
            setInterval(() => this.addGap(), this.gapInterval);
        }
    
        addGap() {
            const gapWidth = Math.random() * 500 + 20; 
            const startPosition = this.game.canvas.width + Math.random() * 600; 
            this.gaps.push({ x: startPosition, width: gapWidth });
        }

        drawSegment(c, x, y) {
            let start = x;
            const end = x + this.image.width;
    
            while (start < end) {
                const gap = this.gaps.find(gap => start >= gap.x && start < gap.x + gap.width);
    
                if (gap) {
                    const gapStart = gap.x;
                    c.drawImage(this.image, start, y, gapStart - start, this.image.height, start, y, gapStart - start, this.image.height);
    
                    start = gap.x + gap.width;
                } else {
                    const chunkWidth = Math.min(end - start, this.image.width);
                    c.drawImage(this.image, 0, 0, chunkWidth, this.image.height, start, y, chunkWidth, this.image.height);
    
                    start += chunkWidth;
                }
            }
        }
    
        update() {
            this.x1 -= this.speed;
            this.x2 -= this.speed;
    
            if (this.x1 <= -this.image.width) {
                this.x1 = this.x2 + this.image.width;
            }
            if (this.x2 <= -this.image.width) {
                this.x2 = this.x1 + this.image.width;
            }
    
            this.gaps.forEach(gap => {
                gap.x -= this.speed;
            });
    
            this.gaps = this.gaps.filter(gap => gap.x + gap.width > 0);
        }
    
        draw(c) {
            if (this.image.complete) {
                const yPosition = this.game.canvas.height - this.image.height;
    
                this.drawSegment(c, this.x1, yPosition);
                this.drawSegment(c, this.x2, yPosition);
            }
        }
}

export default Ground;
