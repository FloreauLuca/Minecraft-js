import * as THREE from 'three';
import PerlinNoise from './perlin-noise.js';
import * as Color from './utility/color-utility.js';
import * as MathUtils from './utility/math-utility.js';
import * as GUIHelper from './utility/gui-helper.js';

let debugPos = { x: 50, y : 10, z: 50 };

class Biome {
    constructor(pos, seed, biomeParameter) {
        this.perlin = new PerlinNoise({
            nodesCount: 4,
            seed: seed,
            persistance: 0.8,
            octaves: 3,
            frequency: 0.05
        })
        this.biomeParameter = biomeParameter;
        const biomeSize = biomeParameter.biomeSize;
        this.pos = pos;
        let noise = this.perlin.clamp_01(this.perlin.int_noise_2d(pos.x, pos.z));
        let cellIndex = Math.floor(noise * (biomeSize.x * biomeSize.y * biomeSize.z));
        const cellIndexPos = new THREE.Vector3(
            cellIndex % biomeSize.x,
            Math.floor(cellIndex / (biomeSize.z * biomeSize.y)),
            Math.floor(cellIndex / biomeSize.y) % biomeSize.z
        );
        const worldIndexPos = new THREE.Vector3(
            cellIndexPos.x + (pos.x * biomeSize.x),
            cellIndexPos.y + (pos.y * biomeSize.y),
            cellIndexPos.z + (pos.z * biomeSize.z)
        );
        this.center = worldIndexPos;
        let frequency = 1;
        this.type = this.perlin.clamp_01(this.perlin.int_noise_2d(pos.x * frequency, pos.z * frequency));
    }

    static computeCellId(pos) {
        return `${pos.x},${pos.y},${pos.z}`;
    }

    static computeBiomes(worldPos, neighbors) {

        const worldPos2D = new THREE.Vector2(
            worldPos.x,
            worldPos.z
        );
        let biomes = neighbors;
        let closeBiome = neighbors[0];
        biomes.forEach(biome => {
            const biomeCenter2D = new THREE.Vector2(
                biome.center.x,
                biome.center.z
            );
            const dist = worldPos2D.distanceTo(biomeCenter2D);
            biome.dist = dist;
            if (biomes.length > 0) {
                if (closeBiome.dist > biome.dist) {
                    closeBiome = biome;
                }
            }
        });

        biomes.sort((a, b) => {
            if (a === closeBiome) {
                return -1;
            }
            if (b === closeBiome) {
                return 1;
            }

            const vecCenter = new THREE.Vector2(closeBiome.center.x - worldPos.x, closeBiome.center.z - worldPos.z);
            const vecA = new THREE.Vector2(closeBiome.center.x - a.center.x, closeBiome.center.z - a.center.z);
            const vecB = new THREE.Vector2(closeBiome.center.x - b.center.x, closeBiome.center.z - b.center.z);
            const dotA = vecCenter.dot(vecA);
            const dotB = vecCenter.dot(vecB);
            // if (worldPos.x === debugPos.x && worldPos.z === debugPos.z)
            // {
            //     console.log(a.center, b.center, worldPos, closeBiome.center);
            //     console.log(a.dist - b.dist, dotA, dotB, a.dist, b.dist);
            //     console.log(closeBiome.center, worldPos, vecCenter, vecA, dotA, vecB, dotB);
            //     console.log(dotA >= 0, dotB >= 0, dotA >= 0 - dotB >= 0);
            // }
            if (dotA >= 0 === dotB >= 0) {
                return a.dist - b.dist;
            }
            else if (dotA >= 0) {
                return -1;
            }
            else if (dotB >= 0) {
                return 1;
            }
        });
        // if (worldPos.x === debugPos.x && worldPos.z === debugPos.z)
        // {
        //     console.log("final", biomes[0].dist, biomes[1].dist, biomes[2].dist, biomes[3].dist, biomes[4].dist);
        // }
        return biomes;
    }

    static computeBlendedBlock(worldPos, worldGen) {
        const biomeSize = worldGen.biomeParameter.biomeSize;
        const cellPos = new THREE.Vector3(
            Math.floor(worldPos.x / biomeSize.x),
            Math.floor(worldPos.y / biomeSize.y),
            Math.floor(worldPos.z / biomeSize.z));
        let biomes = [];
        for (let cz = cellPos.z - 1; cz <= cellPos.z + 1; cz++) {
            for (let cx = cellPos.x - 1; cx <= cellPos.x + 1; cx++) {
                const biomePos = new THREE.Vector3(cx, 0, cz);
                const cellId = Biome.computeCellId(biomePos);
                let biome = worldGen.biomes[cellId];
                if (!biome) {
                    biome = new Biome(biomePos, worldGen.perlin.seed, worldGen.biomeParameter);
                    worldGen.biomes[cellId] = biome;
                }
                biomes.push(biome);
            }
        }

        biomes = Biome.computeBiomes(worldPos, biomes);

        let sum = 0;
        biomes.forEach(biome => {
            sum += 1 / biome.dist;
        });
        // let height = biomes[0].computeBlockHeight(worldPos);
        // let color = biomes[0].computeBiomeTint(worldPos);
        // let type = biomes[0].computeBlockType(worldPos);
        const biomeDist = biomes[0].dist / biomes[1].dist;
        //console.log(biomeDist, biomes[0].dist, biomes[1].dist);
        let height = MathUtils.lerp(biomes[0].computeBlockHeight(worldPos), biomes[1].computeBlockHeight(worldPos),biomeDist);
        let color = new THREE.Color(0, 0, 0);
        let type = biomes[0].computeBlockType(worldPos);
        const color1 = Color.hsbToRgb(biomes[0].type * 360.0, 100.0, 100.0);
        const color2 = Color.hsbToRgb(biomes[1].type * 360.0, 100.0, 100.0);
        color = new THREE.Color(MathUtils.lerp(color1[0], color2[0], biomeDist)/255, 1, 0);
        if (type != 16 * 2 + 6)
        {
            color = new THREE.Color(1, 1, 1);
        }
        
        // ================================= TODO Add dot check
        // let sumWeight = 0;
        // biomes.forEach(biome => {
        //     const biomeWeight = (1 / biome.dist)  / sum;
        //     sumWeight += biomeWeight;
        //     height += biome.computeBlockHeight(worldPos) * biomeWeight;
        //     if (worldPos.x === debugPos.x && worldPos.z === debugPos.z) {
        //         // if (worldPos.y === 0) {
        //         //     for (let index = 0; index < 10; index++) {
        //         //         const biomeWeight = biome.dist / biomes[0].dist;
        //         //         console.log("Weight ", index, sum, biomeWeight)
        //         //     }
        //         // }
        //         console.log("Weight ", biome.dist, sum, biomeWeight, sumWeight)
        //         console.log("Height ", biome.computeBlockHeight(worldPos), biome.computeBlockHeight(worldPos) * biomeWeight, height)
        //     }
        //     color.add(biome.computeBiomeTint(worldPos).multiplyScalar(biomeWeight));
        // });
        return { height: height, color: color, type: type, biomes: biomes };
    }

    computeBlockHeight(worldPos) {
        let height = 0;
        //height = this.type;
        // height = this.perlin.perlin_noise_01(worldPos.x, worldPos.z) * 0.25 + this.type * 0.75;
         height = this.perlin.perlin_noise_01(worldPos.x, worldPos.z);
        height = height * (this.biomeParameter.biomeSize.y * 0.9);
        return height;
    }

    computeBlockType(worldPos) {
        let type = 0;
        const height = this.computeBlockHeight(worldPos);
        const waterLevel = this.biomeParameter.waterLevel;
        const snowLevel = this.biomeParameter.biomeSize.y * 0.75;
        const y = worldPos.y;
        if (y <= height) { // below ground height

            if (y >= Math.floor(height)) { // on top layer
                if (height < waterLevel + 1) { // around water level
                    // sand
                    type = 11;
                }
                else {
                    if (height > snowLevel && false) {
                        // snow
                        //type = 16 * 2 + 15;
                        // stone
                        type = 2;
                    }
                    else {
                        // grass
                        type = 16 * 2 + 6;
                    }
                }
            }
            else if (y <= height / 2) {
                // stone
                type = 2;
            }
            else {
                // dirt
                type = 3;
            }
        }
        else { // above ground height
            if (y <= waterLevel) { // below water level
                // water
                //type = 16 * 2 + 14;
            }
            else {
                // air
                type = 0;
            }
        }
        return type;
    }

    computeBiomeTint(worldPos) {
        let color = new THREE.Color(1, 1, 1);
        return color
    }
}

export default class WorldGeneration {
    constructor(options, biomeParameter) {
        this.cellSize = options.cellSize;
        this.perlin = new PerlinNoise({
            nodesCount: 4,
            seed: options.seed,
            persistance: 0.8,
            octaves: 3,
            frequency: 0.05
        })
        this.mapSize = options.mapSize;
        this.debugParameter = {
            type: 'Height'
        }
        this.biomeParameter = biomeParameter;
        this.biomes = {};
    }

    computeBlockIndex(x, y, z) {
        const { cellSize } = this;
        return y * cellSize.x * cellSize.z +
            z * cellSize.x +
            x;
    }

    getBlockTypeFromCell(cell, x, y, z) {
        return cell[this.computeBlockIndex(x, y, z)];
    }

    setBlockTypeFromCell(cell, x, y, z, block) {
        cell[this.computeBlockIndex(x, y, z)] = block;
    }

    calculate_biome(worldPos) {
        return Biome.computeBlendedBlock(worldPos, this).biomes;
    }

    calculate_height(worldPos) {
        return Biome.computeBlendedBlock(worldPos, this).height;
    }

    generateWorld(cx, cy, cz) {
        //console.log("start_generateWorld", cx, cy, cz);
        const { cellSize } = this;
        let cell = Array(cellSize.x * cellSize.y * cellSize.z);
        let min = 1;
        let max = 0;
        for (let z = 0; z < cellSize.z; ++z) {
            for (let x = 0; x < cellSize.x; ++x) {
                let worldPos = new THREE.Vector3(x + cx * cellSize.x, 0, z + cz * cellSize.z);



                // // min = Math.min(min, intNoise);
                // // max = Math.max(max, intNoise);

                // let type = 0;
                // let color = new THREE.Color(1, 1, 1);

                const waterLevel = cellSize.y * 0.3;
                const snowLevel = cellSize.y * 0.75;
                // const biomeDist = Math.pow(biome[0].dist / biome[1].dist, 5) * 0.5;
                // const biomeBlend = MathUtils.lerp(biome[0].type, biome[1].type, biomeDist)

                for (let y = 0; y < cellSize.y; ++y) {

                    // if (type != 0)
                    // {
                    //     type = 16 * 4 + biome.type[0] * 15;
                    // }

                    // type = Math.floor(type);

                    // if (type != 0)
                    // {
                    //     type = 16 * 3 + 0 * 15;
                    // }

                    //color = new THREE.Vector3(noise, noise, noise);
                    // color = new THREE.Vector3(1, 1, 1);

                    // const color1 = Color.hsbToRgb(biome[0].type*360.0, 100.0, 100.0);
                    // const color2 = Color.hsbToRgb(biome[1].type*360.0, 100.0, 100.0);
                    // color = new THREE.Vector3(MathUtils.lerp(color1[0], color2[0], biomeDist), MathUtils.lerp(color1[1], color2[1], biomeDist), MathUtils.lerp(color1[2], color2[2], biomeDist));
                    // color = color.divideScalar(255.0);
                    worldPos.y = y + cy * cellSize.y;
                    let blockInfos = Biome.computeBlendedBlock(worldPos, this);
                    if (worldPos.x === debugPos.x && worldPos.z === debugPos.z)
                    {
                        console.log(blockInfos);
                    }
                    this.setBlockTypeFromCell(cell, x, y, z, { type: blockInfos.type, color: blockInfos.color });
                }
            }
        }
        //console.log(min, max);
        //console.log("end_generateWorld");
        return Promise.resolve(cell);
    }

    create_gui(gui, renderScene) {
        const { perlin } = this;
        const { debugPlane } = this;
        const folder = gui.addFolder("World Generation");
        const noiseFolder = folder.addFolder("Perlin Noise");
        noiseFolder.add(perlin, 'seed', 1, 64).listen();
        noiseFolder.add(perlin, 'persistance', 0, 1);
        noiseFolder.add(perlin, 'octaves', 1, 16);
        noiseFolder.add(perlin, 'frequency', 0, 1);
        const biomeFolder = folder.addFolder("Biome");
        GUIHelper.displayVector(biomeFolder, this.biomeParameter.biomeSize, "biomeSize", 0, 100);
        const debugFolder = folder.addFolder("Debug Panel");
        debugFolder.add(debugPlane.material, 'opacity', 0, 1).listen();
        debugFolder.add(debugPlane.position, 'y', 0, 200);
        debugFolder.add(this.debugParameter, 'type', ['All', 'Height', 'Biome', 'Perlin', 'Interpo', 'Smooth', 'IntNoise', 'BiomeDist', 'BiomeBlend'])
        debugFolder.onChange(renderScene);
        folder.add(this, 'draw_debug').onChange(renderScene);
        folder.open();
        return folder;
    }

    draw_debug() {
        const width = this.mapSize.x;
        const height = this.mapSize.z;

        const size = width * height;
        if (this.debugPlane == undefined) {
            this.debugPlane = new THREE.Mesh();
            this.debugPlane.geometry = new THREE.PlaneGeometry(width, height);
            this.debugPlane.material = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.01, side: THREE.DoubleSide, opacity: 0 });
            this.debugPlane.position.set(width / 2, 50, height / 2);
            this.debugPlane.rotation.set(Math.PI / 2, 0, 0);
        }
        let minNoise = 25;
        let maxNoise = -25;
        let datas = new Uint8Array(4 * size);
        for (let z = 0; z < height; ++z) {
            for (let x = 0; x < width; ++x) {
                // setTimeout(function () {
                let worldPos = new THREE.Vector3(x, 0, z);
                let color = { r: 0, g: 0, b: 0 };
                if (this.debugParameter.type == 'Height') {
                    let noise = this.calculate_height(worldPos) / this.biomeParameter.biomeSize.y;
                    minNoise = Math.min(minNoise, noise);
                    maxNoise = Math.max(maxNoise, noise);
                    color.r = noise;
                    color.g = noise;
                    color.b = 1;
                }
                else if (this.debugParameter.type == 'Perlin') {
                    let noise = this.perlin.perlin_noise(worldPos.x, worldPos.z);
                    minNoise = Math.min(minNoise, noise);
                    maxNoise = Math.max(maxNoise, noise);
                    noise = this.perlin.clamp_01(noise);
                    color.r = noise;
                    color.g = noise;
                    color.b = noise;
                }
                else if (this.debugParameter.type == 'Interpo') {
                    let noise = this.perlin.interpolate_noise(worldPos.x * this.perlin.frequency, worldPos.z * this.perlin.frequency);
                    minNoise = Math.min(minNoise, noise);
                    maxNoise = Math.max(maxNoise, noise);
                    noise = this.perlin.clamp_01(noise);
                    color.r = noise;
                    color.g = noise;
                    color.b = noise;
                }
                else if (this.debugParameter.type == 'Smooth') {
                    let noise = this.perlin.smooth_noise(worldPos.x * this.perlin.frequency, worldPos.z * this.perlin.frequency);
                    minNoise = Math.min(minNoise, noise);
                    maxNoise = Math.max(maxNoise, noise);
                    noise = this.perlin.clamp_01(noise);
                    color.r = noise;
                    color.g = noise;
                    color.b = noise;
                }
                else if (this.debugParameter.type == 'IntNoise') {
                    let noise = this.perlin.int_noise_2d(worldPos.x * this.perlin.frequency, worldPos.z * this.perlin.frequency);
                    minNoise = Math.min(minNoise, noise);
                    maxNoise = Math.max(maxNoise, noise);
                    noise = this.perlin.clamp_01(noise);
                    color.r = noise;
                    color.g = noise;
                    color.b = noise;
                }
                else if (this.debugParameter.type == 'Biome') {
                    let biome = this.calculate_biome(worldPos)[0].type;
                    color.r = biome;
                    color.g = 1;
                    color.b = biome;
                }
                else if (this.debugParameter.type == 'BiomeDist') {
                    let biomes = this.calculate_biome(worldPos);
                    let biome = biomes[0].dist / biomes[1].dist;
                    color.r = 1;
                    color.g = biome;
                    color.b = biome;
                }
                else if (this.debugParameter.type == 'BiomeBlend') {
                    let biomes = this.calculate_biome(worldPos);
                    const biomeDist = Math.pow(biomes[0].dist / biomes[1].dist, 5) * 0.5;
                    const biomeBlend = MathUtils.lerp(biomes[0].type, biomes[1].type, biomeDist)
                    const color1 = Color.hsbToRgb(biomes[0].type * 360.0, 100.0, 100.0);
                    const color2 = Color.hsbToRgb(biomes[1].type * 360.0, 100.0, 100.0);
                    let blendColor = new THREE.Vector3(MathUtils.lerp(color1[0], color2[0], biomeDist), MathUtils.lerp(color1[1], color2[1], biomeDist), MathUtils.lerp(color1[2], color2[2], biomeDist));
                    blendColor = blendColor.divideScalar(255.0);
                    color.r = blendColor.x;
                    color.g = blendColor.y;
                    color.b = blendColor.z;
                }
                else if (this.debugParameter.type == 'All') {
                    let biome = this.calculate_biome(worldPos)[0];
                    let height = this.calculate_height(worldPos);
                    color.r = biome.dist;
                    color.g = biome.type[0];
                    color.b = height;
                }

                // if (worldPos.x === debugPos.x && worldPos.z === debugPos.z)
                // {
                //     let biomes = this.calculate_biome(worldPos);
                //     console.log(biomes[0].dist, biomes[1].dist, biomes[0].dist / biomes[1].dist, Math.pow(biomes[0].dist / biomes[1].dist, 5), Math.pow(biomes[0].dist / biomes[1].dist, 5) * 0.5)
                //     color.r = 0;
                //     color.g = 0;
                //     color.b = 0;
                // }   

                const stride = (x + width * z) * 4;
                const r = Math.floor(color.r * 255);
                const g = Math.floor(color.g * 255);
                const b = Math.floor(color.b * 255);
                datas[stride] = r;
                datas[stride + 1] = g;
                datas[stride + 2] = b;
                datas[stride + 3] = 255;
                // }, 100);
            }
        }

        const texture = new THREE.DataTexture(datas, width, height);
        texture.needsUpdate = true;
        this.debugPlane.material.map = texture;
        // console.log(this.debugPlane);
    }
}
