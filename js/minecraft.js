import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import WorldGeneration from './world-generation.js';

class ColorGUIHelper {
    constructor(object, prop) {
        this.object = object;
        this.prop = prop;
    }
    get value() {
        return `#${this.object[this.prop].getHexString()}`;
    }
    set value(hexString) {
        this.object[this.prop].set(hexString);
    }
}

class DegRadHelper {
    constructor(obj, prop) {
        this.obj = obj;
        this.prop = prop;
    }
    get value() {
        return THREE.MathUtils.radToDeg(this.obj[this.prop]);
    }
    set value(v) {
        this.obj[this.prop] = THREE.MathUtils.degToRad(v);
    }
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

const tileCount = 16;
const cellSize = new THREE.Vector3(16, 24, 16);
const cellCount = new THREE.Vector3(16, 1, 16);

class VoxelWorld {
    constructor(options) {
        this.cellSize = options.cellSize;
        this.cells = {};
    }

    computeVoxelOffset(x, y, z) {
        const { cellSize, cellSliceSize } = this;
        const voxelX = THREE.MathUtils.euclideanModulo(x, cellSize.x) | 0;
        const voxelY = THREE.MathUtils.euclideanModulo(y, cellSize.y) | 0;
        const voxelZ = THREE.MathUtils.euclideanModulo(z, cellSize.z) | 0;
        return voxelY * cellSize.x * cellSize.z +
            voxelZ * cellSize.x +
            voxelX;
    }

    computeCellId(x, y, z) {
        const { cellSize } = this;
        const cellX = Math.floor(x / cellSize.x);
        const cellY = Math.floor(y / cellSize.y);
        const cellZ = Math.floor(z / cellSize.z);
        return `${cellX},${cellY},${cellZ}`;
    }

    getCellForVoxel(x, y, z) {
        return this.cells[this.computeCellId(x, y, z)];
    }

    setVoxel(x, y, z, v) {
        let cell = this.getCellForVoxel(x, y, z);
        if (!cell) {
            cell = this.addCellForVoxel(x, y, z);
        }
        const voxelOffset = this.computeVoxelOffset(x, y, z);
        cell[voxelOffset] = v;
    }

    addCellForVoxel(x, y, z) {
        const cellId = this.computeCellId(x, y, z);
        let cell = this.cells[cellId];
        if (!cell) {
            const { cellSize } = this;
            cell = new Uint8Array(cellSize.x * cellSize.y * cellSize.z);
            this.cells[cellId] = cell;
        }
        return cell;
    }

    getVoxel(x, y, z) {
        const cell = this.getCellForVoxel(x, y, z);
        if (!cell) {
            return 0;
        }
        const voxelOffset = this.computeVoxelOffset(x, y, z);
        return cell[voxelOffset];
    }

    generateGeometryDataForCell(cellX, cellY, cellZ) {
        const { cellSize } = this;
        const positions = [];
        const normals = [];
        const indices = [];
        const uvs = [];
        const startX = cellX * cellSize.x;
        const startY = cellY * cellSize.y;
        const startZ = cellZ * cellSize.z;

        for (let y = 0; y < cellSize.y; ++y) {
            const voxelY = startY + y;
            for (let z = 0; z < cellSize.z; ++z) {
                const voxelZ = startZ + z;
                for (let x = 0; x < cellSize.x; ++x) {
                    const voxelX = startX + x;
                    const voxel = this.getVoxel(voxelX, voxelY, voxelZ);
                    if (voxel) {
                        const uvVoxelX = (voxel - 1) % tileCount;  // voxel 0 is sky so for UVs we start at 0
                        const uvVoxelY = Math.floor((voxel - 1) / tileCount);
                        for (const { dir, corners, uvRow } of VoxelWorld.faces) {
                            const neighbor = this.getVoxel(
                                voxelX + dir[0],
                                voxelY + dir[1],
                                voxelZ + dir[2]);
                            if (!neighbor) {
                                // this voxel has no neighbor in this direction so we need a face.
                                const ndx = positions.length / 3;
                                for (const { pos, uv } of corners) {
                                    positions.push(pos[0] + x, pos[1] + y, pos[2] + z);
                                    normals.push(...dir);
                                    uvs.push(
                                        (uvVoxelX + uv[0]) / tileCount,
                                        1 - (uvVoxelY + uv[1]) / tileCount);
                                }
                                indices.push(
                                    ndx, ndx + 1, ndx + 2,
                                    ndx + 2, ndx + 1, ndx + 3,
                                );
                            }
                        }
                    }
                }
            }
        }
        return {
            positions,
            normals,
            uvs,
            indices,
        };
    }

    // from https://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.42.3443&rep=rep1&type=pdf
    intersectRay(start, end) {
        let dx = end.x - start.x;
        let dy = end.y - start.y;
        let dz = end.z - start.z;
        const lenSq = dx * dx + dy * dy + dz * dz;
        const len = Math.sqrt(lenSq);

        dx /= len;
        dy /= len;
        dz /= len;

        let t = 0.0;
        let ix = Math.floor(start.x);
        let iy = Math.floor(start.y);
        let iz = Math.floor(start.z);

        const stepX = (dx > 0) ? 1 : -1;
        const stepY = (dy > 0) ? 1 : -1;
        const stepZ = (dz > 0) ? 1 : -1;

        const txDelta = Math.abs(1 / dx);
        const tyDelta = Math.abs(1 / dy);
        const tzDelta = Math.abs(1 / dz);

        const xDist = (stepX > 0) ? (ix + 1 - start.x) : (start.x - ix);
        const yDist = (stepY > 0) ? (iy + 1 - start.y) : (start.y - iy);
        const zDist = (stepZ > 0) ? (iz + 1 - start.z) : (start.z - iz);

        // location of nearest voxel boundary, in units of t
        let txMax = (txDelta < Infinity) ? txDelta * xDist : Infinity;
        let tyMax = (tyDelta < Infinity) ? tyDelta * yDist : Infinity;
        let tzMax = (tzDelta < Infinity) ? tzDelta * zDist : Infinity;

        let steppedIndex = -1;

        // main loop along raycast vector
        while (t <= len) {
            const voxel = this.getVoxel(ix, iy, iz);
            if (voxel) {
                return {
                    position: [
                        start.x + t * dx,
                        start.y + t * dy,
                        start.z + t * dz,
                    ],
                    normal: [
                        steppedIndex === 0 ? -stepX : 0,
                        steppedIndex === 1 ? -stepY : 0,
                        steppedIndex === 2 ? -stepZ : 0,
                    ],
                    voxel,
                };
            }

            // advance t to next nearest voxel boundary
            if (txMax < tyMax) {
                if (txMax < tzMax) {
                    ix += stepX;
                    t = txMax;
                    txMax += txDelta;
                    steppedIndex = 0;
                } else {
                    iz += stepZ;
                    t = tzMax;
                    tzMax += tzDelta;
                    steppedIndex = 2;
                }
            } else {
                if (tyMax < tzMax) {
                    iy += stepY;
                    t = tyMax;
                    tyMax += tyDelta;
                    steppedIndex = 1;
                } else {
                    iz += stepZ;
                    t = tzMax;
                    tzMax += tzDelta;
                    steppedIndex = 2;
                }
            }
        }
        return null;
    }
}

VoxelWorld.faces = [
    { // left
        dir: [-1, 0, 0,],
        corners: [
            { pos: [0, 1, 0], uv: [0, 1], },
            { pos: [0, 0, 0], uv: [0, 0], },
            { pos: [0, 1, 1], uv: [1, 1], },
            { pos: [0, 0, 1], uv: [1, 0], },
        ],
    },
    { // right
        dir: [1, 0, 0,],
        corners: [
            { pos: [1, 1, 1], uv: [0, 1], },
            { pos: [1, 0, 1], uv: [0, 0], },
            { pos: [1, 1, 0], uv: [1, 1], },
            { pos: [1, 0, 0], uv: [1, 0], },
        ],
    },
    { // bottom
        dir: [0, -1, 0,],
        corners: [
            { pos: [1, 0, 1], uv: [1, 0], },
            { pos: [0, 0, 1], uv: [0, 0], },
            { pos: [1, 0, 0], uv: [1, 1], },
            { pos: [0, 0, 0], uv: [0, 1], },
        ],
    },
    { // top
        dir: [0, 1, 0,],
        corners: [
            { pos: [0, 1, 1], uv: [1, 1], },
            { pos: [1, 1, 1], uv: [0, 1], },
            { pos: [0, 1, 0], uv: [1, 0], },
            { pos: [1, 1, 0], uv: [0, 0], },
        ],
    },
    { // back
        dir: [0, 0, -1,],
        corners: [
            { pos: [1, 0, 0], uv: [0, 0], },
            { pos: [0, 0, 0], uv: [1, 0], },
            { pos: [1, 1, 0], uv: [0, 1], },
            { pos: [0, 1, 0], uv: [1, 1], },
        ],
    },
    { // front
        dir: [0, 0, 1,],
        corners: [
            { pos: [0, 0, 1], uv: [0, 0], },
            { pos: [1, 0, 1], uv: [1, 0], },
            { pos: [0, 1, 1], uv: [0, 1], },
            { pos: [1, 1, 1], uv: [1, 1], },
        ],
    },
];

class Light {
    constructor(scene, gui, callback) {
        const lightFolder = gui.addFolder("Light");
        lightFolder.onChange(callback);
        lightFolder.close();
        {
            const color = 0xFFFFFF;
            const intensity = 0.7;
            const light = new THREE.AmbientLight(color, intensity);
            scene.add(light);
            lightFolder.addColor(new ColorGUIHelper(light, 'color'), 'value').name('color');
            lightFolder.add(light, 'intensity', 0, 2, 0.01);

        }
        function makeXYZGUI(gui, vector3, name, onChangeFn) {
            const folder = gui.addFolder(name);
            folder.add(vector3, 'x', -100, 100);
            folder.add(vector3, 'y', 0, 100);
            folder.add(vector3, 'z', -100, 100);
            folder.open();
        }
        {
            const color = 0xFFFFFF;
            const intensity = 0.7;
            const light = new THREE.DirectionalLight(color, intensity);
            light.position.set(0, 35, 20);
            light.target.position.set(25, 15, 15);
            scene.add(light);
            scene.add(light.target);

            const helper = new THREE.DirectionalLightHelper(light);
            //scene.add(helper);

            lightFolder.addColor(new ColorGUIHelper(light, 'color'), 'value').name('color');
            lightFolder.add(light, 'intensity', 0, 2, 0.01);
            function updateLight() {
                light.target.updateMatrixWorld();
                helper.update();
            }
            makeXYZGUI(lightFolder, light.position, 'position', updateLight);
            makeXYZGUI(lightFolder, light.target.position, 'target', updateLight);
        }
    }
}

let sceneRenderer;
//#region UpdateWorld
const neighborOffsets = [
    [0, 0, 0], // self
    [-1, 0, 0], // left
    [1, 0, 0], // right
    [0, -1, 0], // down
    [0, 1, 0], // up
    [0, 0, -1], // back
    [0, 0, 1], // front
];
class Terrain {
    constructor(gui) {
        this.world = new VoxelWorld({
            cellSize
        });

        this.worldGen = new WorldGeneration({
            cellSize: cellSize,
            seed: Math.random()
        });

        this.cellIdToMesh = {};

        this.create_gui(gui);
        this.create_texture();
    }

    create_gui(gui) {
        const { worldGen } = this;
        // const folder = gui.addFolder("World Gen");
        // folder.add(worldGen.cellSize, 'x', 0, 2048).onFinishChange(this.generate_world);
        // folder.add(worldGen.cellSize, 'y', 0, 128).onFinishChange(this.generate_world);
        // folder.add(worldGen.cellSize, 'z', 0, 2048).onFinishChange(this.generate_world);
        // folder.open();
    }

    create_texture() {
        const loader = new THREE.TextureLoader();
        const texture = loader.load('./data/minecraft-texture.png', this.generate_world.bind(this));
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;

        this.material = new THREE.MeshLambertMaterial({
            map: texture,
            side: THREE.FrontSide,
            alphaTest: 0.1,
            transparent: true,
        });
    }

    updateVoxelGeometry(x, y, z) {
        // console.log("start_updateVoxelGeometry");
        const updatedCellIds = {};
        for (const offset of neighborOffsets) {
            const ox = x + offset[0];
            const oy = y + offset[1];
            const oz = z + offset[2];
            const cellId = this.world.computeCellId(ox, oy, oz);
            if (!updatedCellIds[cellId]) {
                updatedCellIds[cellId] = true;
                this.updateCellGeometry(ox, oy, oz);
            }
        }
        // console.log("end_updateVoxelGeometry");
    }

    updateCellGeometry(x, y, z) {
        const { world } = this;
        const cellX = Math.floor(x / cellSize.x);
        const cellY = Math.floor(y / cellSize.y);
        const cellZ = Math.floor(z / cellSize.z);
        const cellId = world.computeCellId(x, y, z);
        let mesh = this.cellIdToMesh[cellId];
        const geometry = mesh ? mesh.geometry : new THREE.BufferGeometry();

        const { positions, normals, uvs, indices } = world.generateGeometryDataForCell(cellX, cellY, cellZ);
        const positionNumComponents = 3;
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
        const normalNumComponents = 3;
        geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
        const uvNumComponents = 2;
        geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents));
        geometry.setIndex(indices);
        geometry.computeBoundingSphere();

        if (!mesh) {
            mesh = new THREE.Mesh(geometry, this.material);
            mesh.name = cellId;
            this.cellIdToMesh[cellId] = mesh;
            scene.add(mesh);
            mesh.position.set(cellX * cellSize.x, cellY * cellSize.y, cellZ * cellSize.z);
        }
    }

    async generate_world() {
        console.log("start_generate_world");
        const { worldGen } = this;
        const { world } = this;
        const self = this;

        const loadingElem = document.querySelector('#loading');
        loadingElem.style.display = 'flex';
        const progressBarElem = loadingElem.querySelector('.progressbar');
        for (let cy = 0; cy < cellCount.y; cy++) {
            for (let cz = 0; cz < cellCount.z; cz++) {
                for (let cx = 0; cx < cellCount.x; cx++) {
                    setTimeout(function () {
                        let cell = worldGen.generateWorld(cx, cy, cz).then(
                            function (value) {
                                for (let y = 0; y < cellSize.y; ++y) {
                                    for (let z = 0; z < cellSize.z; ++z) {
                                        for (let x = 0; x < cellSize.x; ++x) {
                                            let type = worldGen.getBlockTypeFromCell(value, x, y, z);
                                            world.setVoxel(x + cx * cellSize.x, y + cy * cellSize.y, z + cz * cellSize.z, type);
                                        }
                                    }
                                }
                                self.updateVoxelGeometry(cx * cellSize.x, cy * cellSize.y, cz * cellSize.z);
                                let cellProgress = cy * cellCount.x * cellCount.z + cz * cellCount.x + cx;
                                cellProgress /= (cellCount.x * cellCount.z * cellCount.y);
                                progressBarElem.style.transform = `scaleX(${cellProgress})`;
                                if (cellProgress > 0.95) {
                                    loadingElem.style.display = 'none';
                                }
                            });
                        sceneRenderer.render();
                    }, 100);
                }
            }
        }
    }
}

let scene;

export default function main() {
    const canvas = document.querySelector('#minecraft');

    //#region Camera
    const fov = 45;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 128, 0);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(cellSize.x * cellCount.x * 0.5, 0, cellSize.z * cellCount.z * 0.5);
    // controls.enableDamping = true;
    //#endregion Camera

    const gui = new GUI();
    gui.close();

    let renderRequested = false;
    const renderer = new THREE.WebGLRenderer({ canvas });

    //#region Render
    class SceneRenderer {
        constructor() {
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x222222);
            // scene.background = new THREE.Color('lightblue');
        }

        resizeRendererToDisplaySize(renderer) {
            const canvas = renderer.domElement;
            const pixelRatio = window.devicePixelRatio;
            const width = canvas.clientWidth * pixelRatio | 0;
            const height = canvas.clientHeight * pixelRatio | 0;
            const needResize = canvas.width !== width || canvas.height !== height;
            if (needResize) {
                renderer.setSize(width, height, false);
            }
            return needResize;
        }

        render() {
            renderRequested = false;

            if (sceneRenderer.resizeRendererToDisplaySize(renderer)) {
                const canvas = renderer.domElement;
                camera.aspect = canvas.clientWidth / canvas.clientHeight;
                camera.updateProjectionMatrix();
            }
            controls.update();
            renderer.render(scene, camera);
        }

        requestRenderIfNotRequested() {
            if (!renderRequested) {
                renderRequested = true;
                requestAnimationFrame(sceneRenderer.render);
            }
        }
    }
    sceneRenderer = new SceneRenderer(gui);

    controls.addEventListener('change', sceneRenderer.requestRenderIfNotRequested);
    window.addEventListener('resize', sceneRenderer.requestRenderIfNotRequested);
    //#endregion Render

    const light = new Light(scene, gui, sceneRenderer.requestRenderIfNotRequested);

    const terrain = new Terrain(gui);

    console.log("generate_terrain");
    //terrain.generate_world();
}