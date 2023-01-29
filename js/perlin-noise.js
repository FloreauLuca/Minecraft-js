const X_NOISE_GEN = 31;
const Y_NOISE_GEN = 211;
const SEED_NOISE_GEN = 1009;

export default class PerlinNoise {
    constructor(options) {
        this.nodesCount = options.nodesCount;
        this.seed = options.seed;
        this.persistance = options.persistance;
        this.octaves = options.octaves;
        this.frequency = options.frequency;
    }

    lerp(a, b, t) {
        return (1.0 - t) * a + t * b;
    }

    int_noise(x) {
        let n = (x * 8192) ^ x;
        let nn = (n * (n * n * 60493 + 19990303) + 1376312589);
        let nnn = (nn % 2147483647) / 2147483647;
        return nnn;
    }

    int_noise_2d(x, y) {
        let n = (
            X_NOISE_GEN * x
            + Y_NOISE_GEN * y
            + SEED_NOISE_GEN * this.seed);
            n = n % 2147483647;
        // console.log("int_noise_2d",x, y, n, this.int_noise(n));
        return this.int_noise(n);
    }

    smooth_noise(x, y) {
        //Beetween -1/4 1/4
        let corners = (
            this.int_noise_2d(x - 1, y - 1) + this.int_noise_2d(x + 1, y - 1) + this.int_noise_2d(x - 1, y + 1) + this.int_noise_2d(x + 1, y + 1)
        ) / 16;
        //Beetween -1/2 1/2
        let sides = (
            this.int_noise_2d(x - 1, y) + this.int_noise_2d(x + 1, y) + this.int_noise_2d(x, y - 1) + this.int_noise_2d(x, y + 1)
        ) / 8;
        //Beetween -1/4 1/4
        let center = this.int_noise_2d(x, y) / 4;
        // console.log("smooth_noise",x, y, corners + sides + center);
        return corners + sides + center;
    }

    interpolate_noise(x, y) {
        const intX = Math.floor(x);
        const fracX = x - intX;

        const intY = Math.floor(y);
        const fracY = y - intY;

        const x0y0 = this.smooth_noise(intX, intY);
        const x1y0 = this.smooth_noise(intX + 1, intY);
        const x0y1 = this.smooth_noise(intX, intY + 1);
        const x1y1 = this.smooth_noise(intX + 1, intY + 1);

        const y0 = this.lerp(x0y0, x1y0, fracX);
        const y1 = this.lerp(x0y1, x1y1, fracX);
        // console.log("interpolate_noise",x, y, this.lerp(y0, y1, fracY));
        return this.lerp(y0, y1, fracY);
    }

    perlin_noise(x, y) {
        let total = 0;
        for (let i = 0; i < this.octaves; ++i) {
            let frequency = Math.pow(2, i);
            let amplitude = Math.pow(this.persistance, i);
            total += this.interpolate_noise(x * this.frequency * frequency, y * this.frequency * frequency) * amplitude;
        }
        // console.log("perlin_noise",x, y, total);
        return total;
    }
}