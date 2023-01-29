import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

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

export default function main() {
    const canvas = document.querySelector('#instancing-demo');
    const renderer = new THREE.WebGLRenderer({ canvas });

    const fov = 45;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(50, 50, 50);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0, 0);
    // controls.enableDamping = true;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    // scene.background = new THREE.Color('lightblue');

    const gui = new GUI();
    gui.onChange(requestRenderIfNotRequested);
    gui.close();

    //#region Light
    { // light
        const lightFolder = gui.addFolder("Light");
        lightFolder.close();
        { // ambient light
            const color = 0xFFFFFF;
            const intensity = 0.7;
            const light = new THREE.AmbientLight(color, intensity);
            scene.add(light);
            lightFolder.addColor(new ColorGUIHelper(light, 'color'), 'value').name('color');
            lightFolder.add(light, 'intensity', 0, 2, 0.01);

        }
        { // directional light
            function makeXYZGUI(gui, vector3, name, onChangeFn) {
                const folder = gui.addFolder(name);
                folder.add(vector3, 'x', -100, 100).onChange(onChangeFn);
                folder.add(vector3, 'y', 0, 100).onChange(onChangeFn);
                folder.add(vector3, 'z', -100, 100).onChange(onChangeFn);
                folder.open();
            }
            const color = 0xFFFFFF;
            const intensity = 0.7;
            const light = new THREE.DirectionalLight(color, intensity);
            light.position.set(0, 35, 20);
            light.target.position.set(25, 15, 15);
            scene.add(light);
            scene.add(light.target);

            const helper = new THREE.DirectionalLightHelper(light);
            scene.add(helper);
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
    //#endregion

    //#region Render
    function resizeRendererToDisplaySize(renderer) {
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
    let renderRequested = false;
    let lastTime = 0;
    function render(time) {
        console.log(time - lastTime);
        lastTime = time;
        renderRequested = false;

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
        controls.update();

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    render();

    function requestRenderIfNotRequested() {
        if (!renderRequested) {
            renderRequested = true;
        }
    }

    controls.addEventListener('change', requestRenderIfNotRequested);
    window.addEventListener('resize', requestRenderIfNotRequested);
    //#endregion Render

    const size = 256 * 256;
    // const myGeom = new THREE.BoxGeometry();
    // const myMaterial = new THREE.MeshPhongMaterial();
    // const myGroup = new THREE.Group();
    // for (let i = 0; i < size; i++) {
    //     const myMesh = new THREE.Mesh(myGeom, myMaterial);
    //     myGroup.add(myMesh);
    //     myMesh.frustumCulled = true;
    //     const pos = [Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50];
    //     myMesh.position.set(pos[0],pos[1],pos[2])
    // }
    // scene.add(myGroup);

    const geometry = new THREE.PlaneGeometry()
    const mesh = new THREE.Mesh(geometry)
    const geom = new THREE.BoxGeometry()
    const material = new THREE.MeshBasicMaterial()
    const mergedGeometry = new THREE.BufferGeometry()
    for ( let i = 0 ; i < size ; i ++ ) {
       const nodeGeometry = geom.clone()        
       const pos = [Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50];
       nodeGeometry.translate(pos[0],pos[1],pos[2])
       mergedGeometry.merge(nodeGeometry)
    }
    const myCluster = new THREE.Mesh( mergedGeometry, material)

    requestRenderIfNotRequested();
}