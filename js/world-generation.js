import * as THREE from 'three';
import PerlinNoise from './perlin-noise.js';
import * as Color from './utility/color-utility.js';
import * as MathUtils from './utility/math-utility.js';
import * as GUIHelper from './utility/gui-helper.js';

let debugPos = { x: 50, y : 10, z: 50 };
// if (worldPos.x === debugPos.x && worldPos.z === debugPos.z) {
//     if (worldPos.y === 0) {
//         console.log("Weight ", sum, biomeWeight, biome.dist / biomeSize.x);
//         console.log("Weight ", biome.dist, sum, biomeWeight, sumWeight)
//         console.log("Height ", biome.computeBlockHeight(worldPos), biome.computeBlockHeight(worldPos) * biomeWeight, height)
//     }
// }

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
        this.type = Math.floor(this.perlin.clamp_01(this.perlin.int_noise_2d(pos.x * frequency, pos.z * frequency)) * 10);
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
            sum += (1.0 / Math.pow(biome.dist / biomeSize.x, 5.0));
        });
        let height = 0;
        let color = new THREE.Color(0, 0, 0);
        let sumWeight = 0;
        
        if (biomes[0].dist < 1)
        {
            height = biomes[0].computeBlockHeight(worldPos);
            color.add(biomes[0].computeBiomeTint(worldPos));
        }
        else {
            biomes.forEach(biome => {
                if (biome.dist < 1) {
                    height = biome.computeBlockHeight(worldPos);
                    return;
                }
                const biomeWeight = (1.0 / Math.pow(biome.dist / biomeSize.x, 5.0)) / sum;
                sumWeight += biomeWeight;
                //console.log(biomeWeight);
                if (biomeWeight > 0.001)
                {
                    height += biome.computeBlockHeight(worldPos) * biomeWeight;
                    color.add(biome.computeBiomeTint(worldPos).multiplyScalar(biomeWeight));
                }
            });
        }
        // if (worldPos.x === debugPos.x && worldPos.z === debugPos.z) {
        //     if (worldPos.y === 0) {
        //         console.log("color ", color);    
        //     }
        // }
        let type = biomes[0].computeBlockType(worldPos, height);
        return { height: height, color: color, type: type, biomes: biomes };
    }

    computeBlockHeight(worldPos) {
        let height = 0;
        switch(this.type)
        {
            case 0:
                {
                    height = this.perlin.perlin_noise_01(worldPos.x * 1, worldPos.z * 1) *0.1;
                    break;
                }
            case 1:
                {
                    height = this.perlin.perlin_noise_01(worldPos.x * 1, worldPos.z * 1) *0.2;
                    break;
                }
            case 2:
                {
                    height = this.perlin.perlin_noise_01(worldPos.x * 1, worldPos.z * 1) *0.1 + 0.1;
                    break;
                }
            case 3:
                {
                    height = this.perlin.perlin_noise_01(worldPos.x * 1, worldPos.z * 1) *0.1 + 0.2;
                    break;
                }
            case 4:
                {
                    height = this.perlin.perlin_noise_01(worldPos.x * 2, worldPos.z * 2) *0.25 + 0.2;
                    break;
                }
            case 5:
                {
                    height = this.perlin.perlin_noise_01(worldPos.x * 2, worldPos.z * 2) *0.5 + 0.2;
                    break;
                }
            case 6:
                {
                    height = this.perlin.perlin_noise_01(worldPos.x * 2, worldPos.z * 2) *0.75 + 0.2;
                    break;
                }
            case 7:
                {
                    height = this.perlin.perlin_noise_01(worldPos.x * 3, worldPos.z * 3) + 0.2;
                    break;
                }
            case 8:
                {
                    height = this.perlin.perlin_noise_01(worldPos.x * 2, worldPos.z * 2) *0.5 + 0.5;
                    break;
                }
            case 9:
                {
                    height = this.perlin.perlin_noise_01(worldPos.x * 2, worldPos.z * 2) *0.25 + 0.75;
                    break;
                }
        }
        height = height * (this.biomeParameter.biomeSize.y * 0.9);
        return height;
    }

    computeBlockType(worldPos, height) {
        let type = 0;
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
                    if (this.type == 7) {
                        if (height > snowLevel)
                        {
                            // snow
                            type = 16 * 2 + 15;
                        }
                        else if (height > snowLevel - 5){
                            // stone
                            type = 2;
                        }
                    }
                    else if (this.type == 9)
                    {
                        // stone
                        type = 2;
                    }
                    else if (this.type == 2)
                    {
                        // sand
                        type = 11;
                    }
                    else {
                        // grass
                        type = 16 * 2 + 6;
                    }
                }
            }
            else if (y <= height / 2 || this.type == 7 || this.type == 9) {
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
        switch(this.type)
        {
            case 0:
                {
                    color = new THREE.Color(0, 1, 0);
                    break;
                }
            case 1:
                {
                    color = new THREE.Color(0, 1, 0);
                    break;
                }
            case 2:
                {
                    color = new THREE.Color(1, 1, 1);
                    break;
                }
            case 3:
                {
                    color = new THREE.Color(0.5, 0.75, 0);
                    break;
                }
            case 4:
                {
                    color = new THREE.Color(1, 1, 0);
                    break;
                }
            case 5:
                {
                    color = new THREE.Color(0, 0.75, 0.25);
                    break;
                }
            case 6:
                {
                    color = new THREE.Color(0.5, 1, 0);
                    break;
                }
            case 7:
                {
                    color = new THREE.Color(1, 1, 1);
                    break;
                }
            case 8:
                {
                    color = new THREE.Color(0, 1, 0);
                    break;
                }
            case 9:
                {
                    color = new THREE.Color(1, 1, 1);
                    break;
                }
        }
        return color
    }
}

export default class WorldGeneration {
    constructor(options, biomeParameter, debugParameter) {
        this.cellSize = options.cellSize;
        this.perlin = new PerlinNoise({
            nodesCount: 4,
            seed: options.seed,
            persistance: 0.8,
            octaves: 3,
            frequency: 0.05
        })
        this.mapSize = options.mapSize;
        this.debugParameter = debugParameter;
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
                for (let y = 0; y < cellSize.y; ++y) {
                    // const color = Color.hsbToRgb(biome[0].height*360.0, 100.0, 100.0);
                    worldPos.y = y + cy * cellSize.y;
                    let blockInfos = Biome.computeBlendedBlock(worldPos, this);
                    if (blockInfos.type < 16 * 2 || blockInfos.type > 16 * 2 + 8)
                    {
                        blockInfos.color = new THREE.Color(1, 1, 1);
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
        const {debugParameter} = this;

        const size = width * height;
        if (this.debugPlane == undefined) {
            this.debugPlane = new THREE.Mesh();
            this.debugPlane.geometry = new THREE.PlaneGeometry(width, height);
            this.debugPlane.material = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.01, side: THREE.DoubleSide, opacity: debugParameter.opacity });
            this.debugPlane.position.set(width / 2, debugParameter.height, height / 2);
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
                if (debugParameter.type == 'Height') {
                    // let noise = MathUtils.clamp(this.calculate_height(worldPos), 0, 1);
                    let noise = this.calculate_height(worldPos) / (this.biomeParameter.biomeSize.y * 0.9);
                    minNoise = Math.min(minNoise, noise);
                    maxNoise = Math.max(maxNoise, noise);
                    color.r = noise;
                    color.g = noise;
                    color.b = 1;
                }
                else if (debugParameter.type == 'Perlin') {
                    let noise = this.perlin.perlin_noise(worldPos.x, worldPos.z);
                    minNoise = Math.min(minNoise, noise);
                    maxNoise = Math.max(maxNoise, noise);
                    noise = this.perlin.clamp_01(noise);
                    color.r = noise;
                    color.g = noise;
                    color.b = noise;
                }
                else if (debugParameter.type == 'Interpo') {
                    let noise = this.perlin.interpolate_noise(worldPos.x * this.perlin.frequency, worldPos.z * this.perlin.frequency);
                    minNoise = Math.min(minNoise, noise);
                    maxNoise = Math.max(maxNoise, noise);
                    noise = this.perlin.clamp_01(noise);
                    color.r = noise;
                    color.g = noise;
                    color.b = noise;
                }
                else if (debugParameter.type == 'Smooth') {
                    let noise = this.perlin.smooth_noise(worldPos.x * this.perlin.frequency, worldPos.z * this.perlin.frequency);
                    minNoise = Math.min(minNoise, noise);
                    maxNoise = Math.max(maxNoise, noise);
                    noise = this.perlin.clamp_01(noise);
                    color.r = noise;
                    color.g = noise;
                    color.b = noise;
                }
                else if (debugParameter.type == 'IntNoise') {
                    let noise = this.perlin.int_noise_2d(worldPos.x * this.perlin.frequency, worldPos.z * this.perlin.frequency);
                    minNoise = Math.min(minNoise, noise);
                    maxNoise = Math.max(maxNoise, noise);
                    noise = this.perlin.clamp_01(noise);
                    color.r = noise;
                    color.g = noise;
                    color.b = noise;
                }
                else if (debugParameter.type == 'Biome') {
                    let biome = this.calculate_biome(worldPos)[0].type;
                    color.r = biome;
                    color.g = 1;
                    color.b = biome;
                }
                else if (debugParameter.type == 'BiomeDist') {
                    let biomes = this.calculate_biome(worldPos);
                    let biome = biomes[0].dist / this.biomeParameter.biomeSize.x;
                    color.r = 1;
                    color.g = biome;
                    color.b = biome;
                }
                else if (debugParameter.type == 'BiomeBlend') {
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
                else if (debugParameter.type == 'All') {
                    let biome = this.calculate_biome(worldPos)[0];
                    let height = this.calculate_height(worldPos);
                    color.r = biome.dist;
                    color.g = biome.type[0];
                    color.b = height;
                }

                if (worldPos.x === debugPos.x && worldPos.z === debugPos.z)
                {
                    let biomes = this.calculate_biome(worldPos);
                    console.log(biomes[0].dist, biomes[1].dist, biomes[0].dist / biomes[1].dist, Math.pow(biomes[0].dist / biomes[1].dist, 5), Math.pow(biomes[0].dist / biomes[1].dist, 5) * 0.5)
                    color.r = 0;
                    color.g = 0;
                    color.b = 0;
                }   

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
