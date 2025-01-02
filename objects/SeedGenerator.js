class SeedGenerator {
    constructor() {
    }

    *randomNumbers(seed) {
        let state =  Math.floor(seed * 10000);

        const a = 1103515245;
        const c = 12345;
        const m = 2 ** 31;

        while (true) {
            state = (a * state + c) % m;
            yield state / m;
        }
  
    }
}


export default SeedGenerator;
