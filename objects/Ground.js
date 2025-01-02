class Ground {
    constructor(canvas, speed) {
        this.canvas = canvas;
        this.speed = speed;
        this.segments = []; 
        this.segmentHeight = 50; 
        this.minGapWidth = 100; 
        this.maxGapWidth = 1500; 
        this.segmentWidth = 100; 
        this.gapChance = 0.1;
        this.initSegments();
    }

    initSegments() {
        const numSegments = Math.ceil(this.canvas.width / this.segmentWidth) + 2;
        let x = 0;
        for (let i = 0; i < numSegments; i++) {
            x = this.addSegment(x);
        }
    }

    addSegment(startX) {
        const isGap = Math.random() < this.gapChance;
        if (isGap) {
            
            const gapWidth = Math.random() * (this.maxGapWidth - this.minGapWidth) + this.minGapWidth;
            this.segments.push({ x: startX, width: gapWidth, isGap: true });
            return startX + gapWidth; 
        } else {
           
            this.segments.push({ x: startX, width: this.segmentWidth, isGap: false });
            return startX + this.segmentWidth;
        }

        
    }

    update() {
        this.segments.forEach(segment => {
            segment.x -= this.speed;
        });

        this.segments = this.segments.filter(segment => segment.x + segment.width > 0);

        const lastSegment = this.segments[this.segments.length - 1];
        if (lastSegment.x + lastSegment.width < this.canvas.width) {
            const nextX = lastSegment.x + lastSegment.width;
            this.addSegment(nextX);
        }
    }

    draw(context) {
        context.fillStyle = 'brown'; 
        const y = this.canvas.height - this.segmentHeight;

        this.segments.forEach(segment => {
            if (!segment.isGap) {
                context.fillRect(segment.x, y, segment.width, this.segmentHeight);
            }
        });
    }

    checkCollision(player) {
        const playerBottom = player.position.y + player.height;

        return this.segments.some(segment => {
            const isWithinSegment =
                player.position.x + player.width > segment.x &&
                player.position.x < segment.x + segment.width;

            const isOnGround = playerBottom >= this.canvas.height - this.segmentHeight;

            return isWithinSegment && !segment.isGap && isOnGround;
        });
    }
}

export default Ground;
