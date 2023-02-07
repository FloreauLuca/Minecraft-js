import * as THREE from 'three';
import PerlinNoise from './perlin-noise.js';
import Hash from './hash.js';

export default class WorldGeneration {
    constructor(options) {
        this.cellSize = options.cellSize;
        this.perlin = new PerlinNoise({
            nodesCount: 4,
            seed: options.seed,
            persistance: 0.5,
            octaves: 4,
            frequency: 0.1
        })
        this.mapSize = options.mapSize;
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

    async generateWorld(cx, cy, cz) {
        //console.log("start_generateWorld", cx, cy, cz);
        const { cellSize } = this;
        let cell = Array.apply({ type: 0, color: new THREE.Vector3() }, Array(cellSize.x * cellSize.y * cellSize.z));
        let min = 1;
        let max = 0;
        for (let z = 0; z < cellSize.z; ++z) {
            let worldPosZ = z + cz * cellSize.z;
            for (let x = 0; x < cellSize.x; ++x) {
                let worldPosX = x + cx * cellSize.x;
                //const height = (Math.sin(x / cellSize.x * Math.PI * 2) + Math.sin(z / cellSize.z * Math.PI * 3)) * (cellSize.y / 6) + (cellSize.y / 2);
                //const height = (1.0-this.perlin.perlin_noise(x, z)) * (cellSize.y * 0.9);
                let noise = this.perlin.perlin_noise_01(worldPosX, worldPosZ);
                //noise *= noise;
                let height = noise * (cellSize.y * 0.9);

                let intNoise = this.perlin.perlin_noise_01(worldPosX / 5, worldPosZ / 5);
                //let intNoise = Hash.hash_2d(worldPosX, worldPosZ, 0) / 2147483647;

                min = Math.min(min, intNoise);
                max = Math.max(max, intNoise);

                let type = 0;
                let color = new THREE.Vector3(1, 1, 1);

                const waterLevel = cellSize.y * 0.4;
                const snowLevel = cellSize.y * 0.75;

                for (let y = 0; y < cellSize.y; ++y) {

                    if (y <= height) { // below ground height

                        if (y >= Math.floor(height)) { // on top layer
                            if (height < waterLevel + 2) { // around water level
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
                                    color = new THREE.Vector3(intNoise, 1, 0);
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
                    //     type = 16 * 3 + 0 * 15;
                    // }

                    // color = new THREE.Vector3(noise, noise, noise);

                    let worldPosY = y + cy * cellSize.y;
                    this.setBlockTypeFromCell(cell, x, y, z, { type: type, color: color });
                }
            }
        }
        //console.log(min, max);
        //console.log("end_generateWorld");
        return Promise.resolve(cell);
    }

    create_gui(gui, sceneRenderer)
    {
        const { perlin } = this;
        const { debug_plane } = this;
        const folder = gui.addFolder("WorldGen");
        folder.add(perlin, 'seed', 1, 64);
        folder.add(perlin, 'persistance', 0, 1);
        folder.add(perlin, 'octaves', 1, 16);
        folder.add(perlin, 'frequency', 0, 1);
        const debugFolder = folder.addFolder("DebugPanel");
        debugFolder.add(debug_plane.material, 'opacity', 0, 1);
        folder.add(this, 'draw_debug');
        folder.add(sceneRenderer, 'requestRenderIfNotRequested');
        folder.open();
        return folder;
    }

    draw_debug()
    {
        const width = this.mapSize.x;
        const height = this.mapSize.z;
        
        const size = width * height;
        const data = new Uint8Array( 4 * size );
        
        for (let z = 0; z < height; ++z) {
            for (let x = 0; x < width; ++x) {

                const stride = (x + width * z) * 4;
                let noise = this.perlin.perlin_noise_01(x, z);
                
                const r = Math.floor(noise * 255);
                const g = Math.floor(noise * 255);
                const b = Math.floor(noise * 255);
                data[stride] = r;
                data[stride + 1] = g;
                data[stride + 2] = b;
                data[stride + 3] = 255;
            }
        }
        
        // used the buffer to create a DataTexture
        
        const texture = new THREE.DataTexture( data, width, height );
        texture.needsUpdate = true;
        const geometry = new THREE.PlaneGeometry( width, height );
        const material = new THREE.MeshBasicMaterial( {map : texture, transparent : true, alphaTest : 0.01, side : THREE.DoubleSide} );
        // const material = new THREE.MeshBasicMaterial( { color: Math.random() * 0xffffff });
        this.debug_plane = this.debug_plane ? this.debug_plane : new THREE.Mesh();
        this.debug_plane.geometry = geometry;
        this.debug_plane.material = material;
        this.debug_plane.position.set(width / 2, 100, height / 2);
        this.debug_plane.rotation.set(Math.PI / 2, 0, 0);
        this.debug_plane.material.opacity = 0;

        // const geometry = new THREE.PlaneGeometry(1, 1);
        // const material = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
        // const plane = new THREE.Mesh(geometry, material);
    }
}
