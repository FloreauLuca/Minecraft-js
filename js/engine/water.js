import * as THREE from 'three';
import * as GUIHelper from '../utility/gui-helper.js';

function loadTextFile(url) {
    return fetch(url).then(response => response.text());
}

let shaders = [];
let utilityShaders = [];

const utilityURL = [
    '../../data/shader/utility/unity_nodes.glsl',
    '../../data/shader/utility/water_ref.glsl'
];

const shadersURL = [
    '../../data/shader/water/water_shader_vert.glsl',
    '../../data/shader/water/water_shader_frag.glsl',
];

export async function createWaterShader(camera, canvas, renderTarget) {
    
    // load shaders
    shaders = await Promise.all(shadersURL.map(loadTextFile));
    utilityShaders = await Promise.all(utilityURL.map(loadTextFile));

    const waterShader = new THREE.ShaderMaterial({
        vertexShader: shaders[0],
        fragmentShader: utilityShaders[0] + utilityShaders[1] + shaders[1],
        uniforms: {
            // Depth calculation
            uTexDiffuse: { value: renderTarget.texture },
            uTexDepth: { value: renderTarget.depthTexture },
            uCameraNear: { value: camera.near },
            uCameraFar: { value: camera.far },
            uWidth: { value: canvas.clientWidth },
            uHeight: { value: canvas.clientHeight },

            // Faded Depth
            uDepthMaxDistance: { value: 1.4 },

            // UV Displacement
            uTime: { value: 0.0 },
            uScale: { value: new THREE.Vector2(1.0, 1.0) },
            uSpeed: { value: new THREE.Vector2(0.1, 0.1) },
            uWaveSpeed: { value: new THREE.Vector2(0.05, 0.2) },
            uWaveAmplitude: { value: new THREE.Vector2(1.0, 1.0) },
            uWaveFrequency: { value: new THREE.Vector2(0.0, 0.1) },

            // Deep general
            uDeepThickness: { value: 0.1 },
            uDeepMiddle: { value: 0.5 },
            uDeepWaveSpeed: { value: 0.15 },
            uDeepRange: { value: 0.05 },
            uDeepFadeOut: { value: 0.31 },

            // Foam general
            uFoamThickness: { value: 0.0 },
            uFoamMiddle: { value: 0.4 },
            uFoamWaveSpeed: { value: 0.05 },
            uFoamRange: { value: 0.05 },

            // Coast Foam
            uFoamDistance: { value: 5.0 },
            uSurfaceNoiseCutoff: { value: 0.8 },
            uCoastWaveSpeed: { value: 0.05 },
            uCoastWaveRange: { value: 0.05 },
            uCoastFoamPow: { value: 0.4 },
            uCoastFoamScale: { value: new THREE.Vector2(2.0, 2.0) },

            // Colors
            uWaterColor: { value: new THREE.Color(0.0, 0.4, 0.8) },
            uWaterDeepColor: { value: new THREE.Color(0.0, 0.3, 0.7) },
            uFoamColor: { value: new THREE.Color(0.7, 0.9, 1.0) },
            uDepthGradientShallow: { value: new THREE.Color(0.1, 0.8, 1.0) },
        },
        transparent: true,
        depthTest: true,
        side: THREE.DoubleSide
    });
    return waterShader;
}

export function drawWaterGUI(gui, waterShader) {
    const waterFolder = gui.addFolder("Water");
    waterFolder.close();
    console.log(waterShader);
    const waterFadedDepthFolder = waterFolder.addFolder("Faded Depth");
    waterFadedDepthFolder.add(waterShader.uniforms.uDepthMaxDistance, 'value', 0.0, 5.0, 0.01)
        .name('depthMaxDistance');

    const uvDisplacementFolder = waterFolder.addFolder("UV Displacement");
    GUIHelper.displayVector2(uvDisplacementFolder, waterShader.uniforms.uScale.value, 'Scale', 0.0, 2.0);
    GUIHelper.displayVector2(uvDisplacementFolder, waterShader.uniforms.uSpeed.value, 'Speed', 0.0, 2.0);
    GUIHelper.displayVector2(uvDisplacementFolder, waterShader.uniforms.uWaveSpeed.value, 'WaveSpeed', 0.0, 2.0);
    GUIHelper.displayVector2(uvDisplacementFolder, waterShader.uniforms.uWaveAmplitude.value, 'WaveAmplitude', 0.0, 2.0);
    GUIHelper.displayVector2(uvDisplacementFolder, waterShader.uniforms.uWaveFrequency.value, 'WaveFrequency', 0.0, 2.0);

    const waterDeapFolder = waterFolder.addFolder("Deep general");
    waterDeapFolder.add(waterShader.uniforms.uDeepThickness, 'value', 0.0, 0.5, 0.01)
        .name('DeepThickness');
    waterDeapFolder.add(waterShader.uniforms.uDeepMiddle, 'value', 0.0, 1.0, 0.01)
        .name('DeepMiddle');
    waterDeapFolder.add(waterShader.uniforms.uDeepWaveSpeed, 'value', 0.0, 1.0, 0.01)
        .name('DeepWaveSpeed');
    waterDeapFolder.add(waterShader.uniforms.uDeepRange, 'value', 0.0, 1.0, 0.01)
        .name('DeepRange');
    waterDeapFolder.add(waterShader.uniforms.uDeepFadeOut, 'value', 0.0, 5.0, 0.01)
        .name('DeepFadeOut');

    const waterFoamFolder = waterFolder.addFolder("Foam general");
    waterFoamFolder.add(waterShader.uniforms.uFoamThickness, 'value', 0.0, 0.1, 0.0001)
        .name('FoamThickness');
    waterFoamFolder.add(waterShader.uniforms.uFoamMiddle, 'value', 0.0, 1.0, 0.01)
        .name('FoamMiddle');
    waterFoamFolder.add(waterShader.uniforms.uFoamWaveSpeed, 'value', 0.0, 1.0, 0.01)
        .name('FoamWaveSpeed');
    waterFoamFolder.add(waterShader.uniforms.uFoamRange, 'value', 0.0, 1.0, 0.01)
        .name('FoamRange');

    const waterCoastFoamFolder = waterFolder.addFolder("Coast Foam");
    waterCoastFoamFolder.add(waterShader.uniforms.uFoamDistance, 'value', 0.0, 10.0, 0.01)
        .name('FoamDistance');
    waterCoastFoamFolder.add(waterShader.uniforms.uSurfaceNoiseCutoff, 'value', 0.0, 1.0, 0.01)
        .name('SurfaceNoiseCutoff');
    waterCoastFoamFolder.add(waterShader.uniforms.uCoastWaveSpeed, 'value', 0.0, 1.0, 0.01)
        .name('CoastWaveSpeed');
    waterCoastFoamFolder.add(waterShader.uniforms.uCoastWaveRange, 'value', 0.0, 1.0, 0.01)
        .name('CoastWaveRange');
    waterCoastFoamFolder.add(waterShader.uniforms.uCoastFoamPow, 'value', 0.0, 2.0, 0.01)
        .name('CoastFoamPow');
    GUIHelper.displayVector2(waterCoastFoamFolder, waterShader.uniforms.uCoastFoamScale.value, 'CoastFoamScale', 0.0, 5.0);


    const waterColorsFolder = waterFolder.addFolder("Colors");
    waterColorsFolder.addColor(new GUIHelper.ColorGUIHelper(waterShader.uniforms.uWaterColor, 'value'), 'value')
        .name('WaterColor');
    waterColorsFolder.addColor(new GUIHelper.ColorGUIHelper(waterShader.uniforms.uWaterDeepColor, 'value'), 'value')
        .name('WaterDeepColor');
    waterColorsFolder.addColor(new GUIHelper.ColorGUIHelper(waterShader.uniforms.uFoamColor, 'value'), 'value')
        .name('FoamColor');
    waterColorsFolder.addColor(new GUIHelper.ColorGUIHelper(waterShader.uniforms.uDepthGradientShallow, 'value'), 'value')
        .name('DepthGradientShallow');
}

export default class WaterObj {
    constructor(chunkPos, waterTransform, chunkSize, waterLevel, waterShader) {

        this.topPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(chunkSize.x, chunkSize.z),
            waterShader);
        this.topPlane.renderOrder = 2;
        this.topPlane.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {
            material.uniforms.uTime.value += 0.001;
        };
        this.topPlane.position.set(chunkPos.x * chunkSize.x + chunkSize.x / 2.0, chunkPos.y * chunkSize.y + waterLevel - 0.2, chunkPos.z * chunkSize.z + chunkSize.z / 2.0);
        this.topPlane.rotation.set(Math.PI / 2, 0, 0);
        waterTransform.add(this.topPlane);

        this.rightPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(chunkSize.x, waterLevel - 0.2),
            waterShader);
        this.rightPlane.position.set(chunkPos.x * chunkSize.x + 0.1, chunkPos.y * chunkSize.y + (waterLevel - 0.2) / 2.0, chunkPos.z * chunkSize.z + chunkSize.z / 2.0);
        this.rightPlane.rotation.set(0, Math.PI / 2, 0);
        waterTransform.add(this.rightPlane);

        this.leftPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(chunkSize.x, waterLevel - 0.2),
            waterShader);
        this.leftPlane.position.set(chunkPos.x * chunkSize.x + chunkSize.x - 0.1, chunkPos.y * chunkSize.y + (waterLevel - 0.2) / 2.0, chunkPos.z * chunkSize.z + chunkSize.z / 2.0);
        this.leftPlane.rotation.set(0, Math.PI / 2, 0);
        waterTransform.add(this.leftPlane);

        this.backwardPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(chunkSize.x, waterLevel - 0.2),
            waterShader);
        this.backwardPlane.position.set(chunkPos.x * chunkSize.x + chunkSize.x / 2.0, chunkPos.y * chunkSize.y + (waterLevel - 0.2) / 2.0, chunkPos.z * chunkSize.z + 0.1);
        waterTransform.add(this.backwardPlane);

        this.forwardPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(chunkSize.x, waterLevel - 0.2),
            waterShader);
        this.forwardPlane.position.set(chunkPos.x * chunkSize.x + chunkSize.x / 2.0, chunkPos.y * chunkSize.y + (waterLevel - 0.2) / 2.0, chunkPos.z * chunkSize.z + chunkSize.z - 0.1);
        waterTransform.add(this.forwardPlane);
    }

    updateWaterGeometry(right, left, backward, forward) {
        this.rightPlane.visible = right;
        this.leftPlane.visible = left;
        this.backwardPlane.visible = backward;
        this.forwardPlane.visible = forward;
    }

}