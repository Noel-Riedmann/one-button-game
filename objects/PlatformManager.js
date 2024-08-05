import Platform from "./Platform.js";

class PlatformManager {
    constructor(canvas) {
    }

    createPlatforms() {
        return [
        

        ];
    }

    update() {
        this.platforms.forEach(platform => {
            platform.update();
            platform.draw();  
        });
    }

    getPlatforms(){
       
        this.update()
        return this.platforms;

    }

     
}

export default PlatformManager;
