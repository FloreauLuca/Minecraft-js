import * as THREE from 'three';
import PerlinNoise from './perlin-noise.js';
import Hash from './hash.js';
import * as Color from './utility/color-utility.js';
import * as MathUtils from './utility/math-utility.js';
import * as GUIHelper from './utility/gui-helper.js';

export default class WorldGeneration {
    constructor(options) {
        //options.seed =  0.5162588570048592;
        // options.seed =  0.08634629368839941;
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
        type:'BiomeDist' 
        }
        this.biomeParameter = {
            biomeSize: new THREE.Vector3(64, 1, 64)
        }
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
        const cellSize = this.biomeParameter.biomeSize;
        const cellPos = new THREE.Vector3(
            Math.floor(worldPos.x / cellSize.x),
            Math.floor(worldPos.y / cellSize.y),
            Math.floor(worldPos.z / cellSize.z));
        const worldPos2D = new THREE.Vector2(
            worldPos.x,
            worldPos.z
        );
        let biomes = [];
        const frequency = 1;
        for (let cz = cellPos.z - 1; cz <= cellPos.z + 1; cz++) {
            for (let cx = cellPos.x - 1; cx <= cellPos.x + 1; cx++) {
                let noise = this.perlin.int_noise_2d(cx, cz) * 0.5;
                noise = this.perlin.clamp_01(noise);
                let cellIndex = Math.floor(noise * (cellSize.x * cellSize.y * cellSize.z));
                const cellIndexPos = new THREE.Vector3(
                    cellIndex % cellSize.x,
                    Math.floor(cellIndex / (cellSize.z * cellSize.y)),
                    Math.floor(cellIndex / cellSize.z) % cellSize.y
                );
                const worldIndexPos = new THREE.Vector2(
                    cellIndexPos.x + (cx * cellSize.x),
                    cellIndexPos.z + (cz * cellSize.z)
                );
                const type = this.perlin.clamp_01(this.perlin.int_noise_2d(cx * frequency, cz * frequency));
                const dist = worldPos2D.distanceTo(worldIndexPos);
                const biome = {coord : new THREE.Vector2(cx, cz), center : worldIndexPos, type : type, dist : dist};
                if (biomes.length > 0)
                {
                    if (biomes[0].dist > dist)
                    {
                        biomes.unshift(biome);
                        continue;
                    }
                }
                biomes.push(biome);
            }
        }

        biomes.sort((a, b) => {
            if (a === biomes[0])
            {
                return -1;
            }
            if (b === biomes[0])
            {
                return 1;
            }
            
            const vecCenter = new THREE.Vector2(biomes[0].center.x - worldPos2D.x, biomes[0].center.y - worldPos2D.y);
            const vecA = new THREE.Vector2(biomes[0].center.x - a.center.x, biomes[0].center.y - a.center.y);
            const vecB = new THREE.Vector2(biomes[0].center.x - b.center.x, biomes[0].center.y - b.center.y);
            const dotA = vecCenter.dot(vecA);
            const dotB = vecCenter.dot(vecB);

            // if (worldPos.x === 20 && worldPos.z === 20)
            // {   console.log(a.center, b.center, worldPos2D, biomes[0].center);
            //     console.log(a.dist - b.dist,dotA,dotB, a.dist, b.dist);
            //     console.log(biomes[0].center, worldPos2D, vecCenter, vecA, dotA,vecB,  dotB);
            //     console.log(dotA >= 0, dotB >= 0, dotA >= 0 - dotB >= 0);
            // }
            if (dotA >= 0 === dotB >= 0)
            {
                return a.dist - b.dist;
            }
            else if (dotA >= 0)
            {
                return -1;
            } 
            else if (dotB >= 0)
            {
                return 1;
            } 
        });
        // if (worldPos.x === 20 && worldPos.z === 20)
        // {
        //     console.log(biomes);
        // }
        //biomeDist = MathUtils.inverseLerp(0, 0.75, MathUtils.clamp(biomeDist, 0, 0.75));
        return biomes;
    }

    calculate_height(worldPos)
    {
        let noise = this.perlin.perlin_noise_01(worldPos.x, worldPos.z);
        let biome = this.calculate_biome(worldPos);
        const biomeDist = Math.pow(biome[0].dist / biome[1].dist, 5) * 0.5;
        const biomeBlend = MathUtils.lerp(biome[0].type, biome[1].type, biomeDist) * 0.75;
        let height = biomeBlend + noise * 0.5 * biomeBlend;
        height = Math.min(height, 1.0);
        return height;
    }

    async generateWorld(cx, cy, cz) {
        //console.log("start_generateWorld", cx, cy, cz);
        const { cellSize } = this;
        let cell = Array.apply({ type: 0, color: new THREE.Vector3() }, Array(cellSize.x * cellSize.y * cellSize.z));
        let min = 1;
        let max = 0;
        for (let z = 0; z < cellSize.z; ++z) {
            for (let x = 0; x < cellSize.x; ++x) {
                let worldPos = new THREE.Vector3(x + cx * cellSize.x, 0, z + cz * cellSize.z);

                let height = this.calculate_height(worldPos);
                let biome = this.calculate_biome(worldPos);
                height = height * (cellSize.y * 0.9);

                // min = Math.min(min, intNoise);
                // max = Math.max(max, intNoise);

                let type = 0;
                let color = new THREE.Vector3(1, 1, 1);

                const waterLevel = cellSize.y * 0.3;
                const snowLevel = cellSize.y * 0.75;
                const biomeDist = Math.pow(biome[0].dist / biome[1].dist, 5) * 0.5;
                const biomeBlend = MathUtils.lerp(biome[0].type, biome[1].type, biomeDist)

                for (let y = 0; y < cellSize.y; ++y) {

                    if (y <= height) { // below ground height

                        if (y >= Math.floor(height)) { // on top layer
                            if (height < waterLevel + 1) { // around water level
                                // sand
                                type = 11;
                            }
                            else {
                                if (height > snowLevel && false)
                                {
                                    // snow
                                    //type = 16 * 2 + 15;
                                    // stone
                                    type = 2;
                                }
                                else{
                                    // grass
                                    type = 16 * 2 + 6;
                                    color = new THREE.Vector3(biomeBlend, 1, 0);
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
                            type = 16 * 2 + 14;
                        }
                        else {
                            // air
                            type = 0;
                        }
                    }

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
                    this.setBlockTypeFromCell(cell, x, y, z, { type: type, color: color });
                }
            }
        }
        //console.log(min, max);
        //console.log("end_generateWorld");
        return Promise.resolve(cell);
    }

    create_gui(gui, renderScene)
    {
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
        debugFolder.add(this.debugParameter, 'type', [ 'All','Height', 'Biome', 'Perlin', 'Interpo', 'Smooth', 'IntNoise', 'BiomeDist', 'BiomeBlend' ] )
        folder.add(this, 'draw_debug').on;
        folder.add({ reload : renderScene }, 'reload');
        folder.open();
        return folder;
    }

    draw_debug()
    {
        const width = this.mapSize.x;
        const height = this.mapSize.z;

        const size = width * height;
        if (this.debugPlane == undefined)
        {
            this.debugPlane = new THREE.Mesh();
            this.debugPlane.geometry = new THREE.PlaneGeometry(width, height);
            this.debugPlane.material = new THREE.MeshBasicMaterial( {transparent : true, alphaTest : 0.01, side : THREE.DoubleSide, opacity : 0} );
            this.debugPlane.position.set(width / 2, 50, height / 2);
            this.debugPlane.rotation.set(Math.PI / 2, 0, 0);
        }
        let minNoise = 25;
        let maxNoise = -25;
        let datas = new Uint8Array(4 * size);
        for (let z = 0; z < height; ++z) {
            for (let x = 0; x < width; ++x) {
                let worldPos = new THREE.Vector3(x, 0, z);
                let color = {r:0, g:0, b:0};
                if (this.debugParameter.type == 'Height') {
                    let noise = this.calculate_height(worldPos);
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
                    let biome = this.calculate_biome(worldPos)[0].dist / this.calculate_biome(worldPos)[1].dist;
                    color.r = 1;
                    color.g = biome;
                    color.b = biome;
                    // if (worldPos.x === 96 && worldPos.z === 16)
                    // {
                    //     console.log(biomes[0].dist, biomes[1].dist, biomes[0].dist / biomes[1].dist, Math.pow(biomes[0].dist / biomes[1].dist, 5), Math.pow(biomes[0].dist / biomes[1].dist, 5) * 0.5)
                    // }   
                }
                else if (this.debugParameter.type == 'BiomeBlend') {
                    let biomes = this.calculate_biome(worldPos);
                    const biomeDist = Math.pow(biomes[0].dist / biomes[1].dist, 5) * 0.5;
                    const biomeBlend = MathUtils.lerp(biomes[0].type, biomes[1].type, biomeDist)
                    const color1 = Color.hsbToRgb(biomes[0].type*360.0, 100.0, 100.0);
                    const color2 = Color.hsbToRgb(biomes[1].type*360.0, 100.0, 100.0);
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

                if (worldPos.x === 96 && worldPos.z === 16)
                {
                    color.r = 1;
                    color.g = 1;
                    color.b = 1;
                }

                const stride = (x + width * z) * 4;
                const r = Math.floor(color.r * 255);
                const g = Math.floor(color.g * 255);
                const b = Math.floor(color.b * 255);
                datas[stride] = r;
                datas[stride + 1] = g;
                datas[stride + 2] = b;
                datas[stride + 3] = 255;
            }
        }

        const texture = new THREE.DataTexture(datas, width, height);
        texture.needsUpdate = true;
        this.debugPlane.material.map = texture;
        // console.log(this.debugPlane);
    }
}
