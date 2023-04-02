import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';

import World from './engine/world.js';
import Light from './engine/light.js';
import WorldGeneration from './world-generation.js';
import SceneRenderer from './engine/scene-renderer.js';
import * as Water from './engine/water.js';

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
//const seed = 0.1633981300688041;
//const seed = 0;

function drawCommonGUI(gui, controls) {
    const controlFolder = gui.addFolder("Controls");
    controlFolder.add(controls, 'autoRotate');
    controlFolder.add(controls, 'autoRotateSpeed');
}

export default async function main() {
    const stats = new Stats();
    const canvas = document.querySelector('#minecraft');
    const container = document.querySelector('#container');
    container.appendChild(stats.dom);

    const gui = new GUI();
    gui.close();

    const fov = 45;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 100000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 64, 0);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(cellSize.x * cellCount.x * 0.5, 0, cellSize.z * cellCount.z * 0.5);
    drawCommonGUI(gui, controls);

    const sceneRenderer = new SceneRenderer(camera);
    const renderScene = sceneRenderer.requestRenderIfNotRequested(sceneRenderer);

    controls.addEventListener('change', renderScene);
    window.addEventListener('resize', renderScene);

    const waterShader = await Water.createWaterShader(camera, canvas, sceneRenderer.renderTarget);
    Water.drawWaterGUI(gui, waterShader);

    function update() {
        if (sceneRenderer.resizeRendererToDisplaySize()) {
            const canvas = sceneRenderer.renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
            waterShader.uniforms.uWidth.value = canvas.clientWidth;
            waterShader.uniforms.uHeight.value = canvas.clientHeight;
        }
        controls.update();
        stats.update();
        renderScene();
        requestAnimationFrame(update);
    }

    update();

    const light = new Light(gui, renderScene);
    sceneRenderer.addToScene(light.ambientLight);
    sceneRenderer.addToScene(light.directionalLight);
    sceneRenderer.addToScene(light.directionalLight.target);

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
    const world = new World(worldGen, worldParameters, gui, renderScene, waterShader);
    sceneRenderer.addToScene(world.worldGen.debugPlane);
    sceneRenderer.addToDepthScene(world.depthTransform);
    sceneRenderer.addToScene(world.terrainTransform);
    sceneRenderer.addToScene(world.waterTransform);
    console.log("generate_terrain");
}