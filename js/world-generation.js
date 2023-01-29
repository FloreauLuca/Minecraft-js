import PerlinNoise from './perlin-noise.js';

export default class WorldGeneration {
    constructor(options) {
        this.cellSize = options.cellSize;
        const { cellSize } = this;
        this.cell = new Uint8Array(cellSize.x * cellSize.y * cellSize.z);
        this.perlin = new PerlinNoise({
            nodesCount : 4,
            seed : Math.random(),
            persistance : 0.5,
            octaves : 15,
            frequency : 0.1
        })
    }

    computeBlockIndex(x, y, z) {
        const { cellSize } = this;
        return y * cellSize.x * cellSize.z +
            z * cellSize.x +
            x;
    }

    getBlockTypeFromCoord(x, y, z) {
        return this.cell[this.computeBlockIndex(x, y, z)];
    }

    getBlockTypeFromPos(pos) {
        return this.getBlockTypeFromCoord(pos.x, pos.y, pos.z);
    }

    setBlockTypeFromCoord(x, y, z, type) {
        this.cell[this.computeBlockIndex(x, y, z)] = type;
    }

    setBlockTypeFromPos(pos, type) {
        this.cell[this.computeBlockIndex(pos.x, pos.y, pos.z)] = type;
    }

    async generateWorld(seed) {
        console.log("start_generateWorld");
        const { cellSize } = this;
        for (let y = 0; y < cellSize.y; ++y) {
            for (let z = 0; z < cellSize.z; ++z) {
                for (let x = 0; x < cellSize.x; ++x) {
                    //const height = (Math.sin(x / cellSize.x * Math.PI * 2) + Math.sin(z / cellSize.z * Math.PI * 3)) * (cellSize.y / 6) + (cellSize.y / 2);
                    const height = (1.0-this.perlin.perlin_noise(x, z)) * (cellSize.y * 0.9) + 5;
                    if (y <= height) {
                        if (height < 3)
                        {
                            this.setBlockTypeFromCoord(x, y, z, 16+3);
                        }
                        else if (y >= Math.floor(height))
                        {
                            this.setBlockTypeFromCoord(x, y, z, 1);
                        }
                        else if (y <= height/2)
                        {
                            this.setBlockTypeFromCoord(x, y, z, 2);
                        }
                        else
                        {
                            this.setBlockTypeFromCoord(x, y, z, 3);
                        }
                    }
                    else {
                        this.setBlockTypeFromCoord(x, y, z, 0);
                    }
                }
            }
        }
        console.log("end_generateWorld");
        return Promise.resolve(1);
    }
}
