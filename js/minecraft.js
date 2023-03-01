import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';

import World from './engine/world.js';
import Light from './engine/light.js';
import WorldGeneration from './world-generation.js';
import SceneRenderer from './engine/scene-renderer.js';

const cellSize = new THREE.Vector3(16, 32, 16);
const cellCount = new THREE.Vector3(8, 1, 8);
const biomeParameter = 
{
    biomeSize : new THREE.Vector3(32, 32, 32),
    waterLevel : 7
};
const debugParameter = {
    type: 'Height',
    opacity : 0.0,
    height : 50
}
const mapSize = new THREE.Vector3(cellSize.x * cellCount.x, cellSize.y * cellCount.y, cellSize.z * cellCount.z);
const seed = Math.random();
// const seed = 0;


export default function main() {
    const stats = new Stats();
    const canvas = document.querySelector('#minecraft');
    const container = document.querySelector('#container');
    container.appendChild(stats.dom);

    const fov = 45;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 100000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 64, 0);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(cellSize.x * cellCount.x * 0.5, 0, cellSize.z * cellCount.z * 0.5);
    // controls.target.set(0, 0, 0);
    // controls.enableDamping = true;

    // const controls = new FirstPersonControls( camera, renderer.domElement );
    // controls.movementSpeed = 150;
    // controls.lookSpeed = 0.1;

    const gui = new GUI();
    gui.close();

    const sceneRenderer = new SceneRenderer(camera);
    const renderScene = sceneRenderer.requestRenderIfNotRequested(sceneRenderer);

    controls.addEventListener('change', renderScene);
    window.addEventListener('resize', renderScene);

    function update() {
        if (sceneRenderer.resizeRendererToDisplaySize()) {
            const canvas = sceneRenderer.renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
        controls.update();
        stats.update();
        renderScene();
        requestAnimationFrame(update);
    }

    update();

    const light = new Light(gui, renderScene);
    sceneRenderer.scene.add(light.ambientLight);
    sceneRenderer.scene.add(light.directionalLight);
    sceneRenderer.scene.add(light.directionalLight.target);

    const worldGen = new WorldGeneration({
        cellSize: cellSize,
        seed: seed,
        mapSize: mapSize,
        debugParameter : debugParameter
    },
    biomeParameter,
    debugParameter);

    const worldParameters =
    {
        cellSize: cellSize,
        cellCount: cellCount
    }
    const world = new World(worldGen, worldParameters, gui, renderScene);
    sceneRenderer.scene.add(world.worldGen.debugPlane);
    sceneRenderer.scene.add(world.terrainTransform);
    sceneRenderer.scene.add(world.waterTransform);
    console.log("generate_terrain");
}