import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import {GUI} from 'three/addons/libs/lil-gui.module.min.js';
// Turns both axes and grid visible on/off
// lil-gui requires a property that returns a bool
// to decide to make a checkbox so we make a setter
// and getter for `visible` which we can tell lil-gui
// to look at.
class AxisGridHelper {
    constructor(node, units = 10) {
        const axes = new THREE.AxesHelper();
        axes.material.depthTest = false;
        axes.renderOrder = 2;  // after the grid
        node.add(axes);

        const grid = new THREE.GridHelper(units, units);
        grid.material.depthTest = false;
        grid.renderOrder = 1;
        node.add(grid);

        this.grid = grid;
        this.axes = axes;
        this.visible = false;
    }
    get visible() {
        return this._visible;
    }
    set visible(v) {
        this._visible = v;
        this.grid.visible = v;
        this.axes.visible = v;
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

  class StringToNumberHelper {
    constructor(obj, prop) {
      this.obj = obj;
      this.prop = prop;
    }
    get value() {
      return this.obj[this.prop];
    }
    set value(v) {
      this.obj[this.prop] = parseFloat(v);
    }
  }

export default function main() {

    const canvas = document.querySelector('#three-demo');
    const renderer = new THREE.WebGLRenderer({ canvas });
    // camera
    const fov = 50;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    camera.position.set(5, 1, 0);
    camera.up.set(0, 1, 0);
    camera.lookAt(-50, 0, 0);

    const scene = new THREE.Scene();
    //scene.background = new THREE.Color(0xAAAAAA);

    // {
    //     //box
    //     function makeInstance(geometry, color, x) {
    //         const material = new THREE.MeshPhongMaterial({ color });

    //         const cube = new THREE.Mesh(geometry, material);
    //         scene.add(cube);

    //         cube.position.x = x;

    //         return cube;
    //     }
    //     const boxWidth = 1;
    //     const boxHeight = 1;
    //     const boxDepth = 1;
    //     const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
    //     const cubes = [
    //         makeInstance(geometry, 0x44aa88, 0),
    //         makeInstance(geometry, 0x8844aa, -2),
    //         makeInstance(geometry, 0xaa8844, 2),
    //     ];

    //     const objects = [];
    //     const spread = 15;

    //     function addObject(x, y, obj) {
    //       obj.position.x = x * spread;
    //       obj.position.y = y * spread;

    //       scene.add(obj);
    //       objects.push(obj);
    //     }

    //     function createMaterial() {
    //         const material = new THREE.PointsMaterial({

    //     color: 'red',
    //     size: 0.2,     // in world units
    //         });

    //         const hue = Math.random();
    //         const saturation = 1;
    //         const luminance = .5;
    //         material.color.setHSL(hue, saturation, luminance);

    //         return material;
    //       }

    //       function addSolidGeometry(x, y, geometry) {
    //         const mesh = new THREE.Mesh(geometry, createMaterial());
    //         addObject(x, y, mesh);
    //       }

    //       function addLineGeometry(x, y, geometry) {
    //         const material = new THREE.LineBasicMaterial({color: 0x000000});
    //         const mesh = new THREE.LineSegments(geometry, material);
    //         addObject(x, y, mesh);
    //       }

    //       { // box
    //         const width = 8;
    //         const height = 8;
    //         const depth = 8;
    //         addSolidGeometry(-2, 2, new THREE.BoxGeometry(width, height, depth));
    //       }
    //       { // circle
    //         const radius = 7;
    //         const segments = 24;
    //         addSolidGeometry(-1, 2, new THREE.CircleGeometry(radius, segments));
    //       }
    //       { // cone
    //         const radius = 6;
    //         const height = 8;
    //         const segments = 16;
    //         addSolidGeometry(0, 2, new THREE.ConeGeometry(radius, height, segments));
    //       }
    //       {
    //         const radiusTop = 4;
    //         const radiusBottom = 4;
    //         const height = 8;
    //         const radialSegments = 12;
    //         addSolidGeometry(1, 2, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments));
    //       }
    //       {
    //         const radius = 7;
    //         addSolidGeometry(2, 2, new THREE.DodecahedronGeometry(radius));
    //       }
    //       {
    //         const shape = new THREE.Shape();
    //         const x = -2.5;
    //         const y = -5;
    //         shape.moveTo(x + 2.5, y + 2.5);
    //         shape.bezierCurveTo(x + 2.5, y + 2.5, x + 2, y, x, y);
    //         shape.bezierCurveTo(x - 3, y, x - 3, y + 3.5, x - 3, y + 3.5);
    //         shape.bezierCurveTo(x - 3, y + 5.5, x - 1.5, y + 7.7, x + 2.5, y + 9.5);
    //         shape.bezierCurveTo(x + 6, y + 7.7, x + 8, y + 4.5, x + 8, y + 3.5);
    //         shape.bezierCurveTo(x + 8, y + 3.5, x + 8, y, x + 5, y);
    //         shape.bezierCurveTo(x + 3.5, y, x + 2.5, y + 2.5, x + 2.5, y + 2.5);

    //         const extrudeSettings = {
    //           steps: 2,
    //           depth: 2,
    //           bevelEnabled: true,
    //           bevelThickness: 1,
    //           bevelSize: 1,
    //           bevelSegments: 2,
    //         };

    //         addSolidGeometry(-2, 1, new THREE.ExtrudeGeometry(shape, extrudeSettings));
    //       }
    //       {
    //         const radius = 7;
    //         addSolidGeometry(-1, 1, new THREE.IcosahedronGeometry(radius));
    //       }

    //     // lights
    //     {
    //         const color = 0xFFFFFF;
    //         const intensity = 1;
    //         const light = new THREE.DirectionalLight(color, intensity);
    //         light.position.set(-1, 2, 4);
    //         scene.add(light);
    //     }
    // }

    // resize 

    // an array of objects whose rotation to update

    // {
    // const objects = [];

    // const solarSystem = new THREE.Object3D();
    // scene.add(solarSystem);
    // objects.push(solarSystem);

    // // use just one sphere for everything
    // const radius = 1;
    // const widthSegments = 6;
    // const heightSegments = 6;
    // const sphereGeometry = new THREE.SphereGeometry(
    //     radius, widthSegments, heightSegments);

    // const sunMaterial = new THREE.MeshPhongMaterial({ emissive: 0xFFFF00 });
    // const sunMesh = new THREE.Mesh(sphereGeometry, sunMaterial);
    // sunMesh.scale.set(5, 5, 5);  // make the sun large
    // solarSystem.add(sunMesh);
    // objects.push(sunMesh);

    // const earthOrbit = new THREE.Object3D();
    // earthOrbit.position.x = 10;
    // solarSystem.add(earthOrbit);
    // objects.push(earthOrbit);

    // const earthMaterial = new THREE.MeshPhongMaterial({ color: 0x2233FF, emissive: 0x112244 });
    // const earthMesh = new THREE.Mesh(sphereGeometry, earthMaterial);
    // earthOrbit.add(earthMesh);
    // objects.push(earthMesh);

    // const moonOrbit = new THREE.Object3D();
    // moonOrbit.position.x = 2;
    // earthOrbit.add(moonOrbit);

    // const moonMaterial = new THREE.MeshPhongMaterial({ color: 0x888888, emissive: 0x222222 });
    // const moonMesh = new THREE.Mesh(sphereGeometry, moonMaterial);
    // moonMesh.scale.set(.5, .5, .5);
    // moonOrbit.add(moonMesh);
    // objects.push(moonMesh);
    // }

    // // add an AxesHelper to each node
    // objects.forEach((node) => {
    //     const axes = new THREE.AxesHelper();
    //     axes.material.depthTest = false;
    //     axes.renderOrder = 1;
    //     node.add(axes);
    // });

    // function makeAxisGrid(node, label, units) {
    //     const helper = new AxisGridHelper(node, units);
    //     gui.add(helper, 'visible').name(label);
    //   }

    //   makeAxisGrid(solarSystem, 'solarSystem', 25);
    //   makeAxisGrid(sunMesh, 'sunMesh');
    //   makeAxisGrid(earthOrbit, 'earthOrbit');
    //   makeAxisGrid(earthMesh, 'earthMesh');
    //   makeAxisGrid(moonOrbit, 'moonOrbit');
    //   makeAxisGrid(moonMesh, 'moonMesh');

    // {
    //     const color = 0xFFFFFF;
    //     const intensity = 3;
    //     const light = new THREE.PointLight(color, intensity);
    //     scene.add(light);
    //   }

    { // light
      // function makeXYZGUI(gui, vector3, name, onChangeFn) {
      //     const folder = gui.addFolder(name);
      //     folder.add(vector3, 'x', -10, 10).onChange(onChangeFn);
      //     folder.add(vector3, 'y', 0, 10).onChange(onChangeFn);
      //     folder.add(vector3, 'z', -10, 10).onChange(onChangeFn);
      //     folder.open();
      // }


      // const gui = new GUI();
      // gui.onChange(requestRenderIfNotRequested);

      // // {
      // //     const color = 0xFFFFFF;
      // //     const intensity = 1;
      // //     const light = new THREE.AmbientLight(color, intensity);
      // //     scene.add(light);
      // //     gui.addColor(new ColorGUIHelper(light, 'color'), 'value').name('color').onChange(requestRenderIfNotRequested);
      // //     gui.add(light, 'intensity', 0, 2, 0.01).onChange(requestRenderIfNotRequested);

      // // }

      // // {
      // //     const skyColor = 0xB1E1FF;  // light blue
      // //     const groundColor = 0xB97A20;  // brownish orange
      // //     const intensity = 1;
      // //     const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
      // //     scene.add(light);
      // //     gui.addColor(new ColorGUIHelper(light, 'color'), 'value').name('color').onChange(requestRenderIfNotRequested);
      // //     gui.addColor(new ColorGUIHelper(light, 'groundColor'), 'value').name('color').onChange(requestRenderIfNotRequested);
      // //     gui.add(light, 'intensity', 0, 2, 0.01).onChange(requestRenderIfNotRequested);
      // // }


      // // {
      // //     const color = 0xFFFFFF;
      // //     const intensity = 1;
      // //     const light = new THREE.DirectionalLight(color, intensity);
      // //     light.position.set(0, 10, 0);
      // //     light.target.position.set(-5, 0, 0);
      // //     scene.add(light);
      // //     scene.add(light.target);
      
      // //     const helper = new THREE.DirectionalLightHelper(light);
      // //     scene.add(helper);

      // //     gui.addColor(new ColorGUIHelper(light, 'color'), 'value').name('color');
      // //     gui.add(light, 'intensity', 0, 2, 0.01);
      // //     gui.onChange(requestRenderIfNotRequested);
      // //     function updateLight() {
      // //         light.target.updateMatrixWorld();
      // //         helper.update();
      // //     }
      // //     makeXYZGUI(gui, light.position, 'position', updateLight);
      // //     makeXYZGUI(gui, light.target.position, 'target', updateLight);
      // // }

      // // {
      // //     const color = 0xFFFFFF;
      // //     const intensity = 1;
      // //     const light = new THREE.PointLight(color, intensity);
      // //     light.position.set(0, 10, 0);
      // //     scene.add(light);

      // //     const helper = new THREE.PointLightHelper(light);
      // //     scene.add(helper);


      // //     function updateLight() {
      // //         helper.update();
      // //     }
      // //     gui.addColor(new ColorGUIHelper(light, 'color'), 'value').name('color');
      // //     gui.add(light, 'intensity', 0, 2, 0.01);
      // //     makeXYZGUI(gui, light.position, 'position', updateLight);
      // // }

      // {
      //     const color = 0xFFFFFF;
      //     const intensity = 1;
      //     const light = new THREE.SpotLight(color, intensity);
      //     light.position.set(0, 10, 0);
      //     light.target.position.set(-5, 0, 0);
      //     scene.add(light);
      //     scene.add(light.target);

      //     const helper = new THREE.SpotLightHelper(light);
      //     scene.add(helper);

      //     function updateLight() {
      //         helper.update();
      //     }
      //     gui.addColor(new ColorGUIHelper(light, 'color'), 'value').name('color');
      //     gui.add(light, 'intensity', 0, 2, 0.01);
      //     gui.onChange(requestRenderIfNotRequested);
      //     makeXYZGUI(gui, light.position, 'position', updateLight);
      //     makeXYZGUI(gui, light.target.position, 'position', updateLight);
      //     gui.add(new DegRadHelper(light, 'angle'), 'value', 0, 90).name('angle').onChange(updateLight);
      // }            
  }



    const cubes = [];
    const width = 1;
    const height = 1;
    const depth = 1;
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const loadManager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(loadManager);
    // loader.load('../data/wall.jpg', (texture) => {
    //     const material = new THREE.MeshBasicMaterial({
    //         map: texture,
    //     });
    //     for (let index = 0; index < 50; index++) {
    //         const cube = new THREE.Mesh(geometry, material);
    //         cube.position.x -= index;
    //         cube.position.z += 1;
    //         scene.add(cube);
    //         cubes.push(cube);  // add to our list of cubes to rotate
    //     }
    // });
    // loader.load('../data/mip-low-res-enlarged.png', (texture) => {
    //     for (let index = 0; index < 50; index++) {
    //         const xOffset = 0.02*index;   // offset by half the texture
    //         const yOffset = 0.02*index;  // offset by 1/4 the texture
    //         texture.offset.set(xOffset, yOffset);
    //         const material = new THREE.MeshBasicMaterial({
    //             map: texture,
    //         });
    //         const cube = new THREE.Mesh(geometry, material);
    //         cube.position.x -= index;
    //         scene.add(cube);
    //         cubes.push(cube);  // add to our list of cubes to rotate
    //     }
    // });

    const texture = loader.load('../data/mip-low-res-enlarged.png');
    const material = new THREE.MeshBasicMaterial({
        map: texture,
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    cubes.push(cube);  // add to our list of cubes to rotate

    const materials = [
        new THREE.MeshBasicMaterial({ map: loader.load('../data/flower-2.jpg') }),
        new THREE.MeshBasicMaterial({ map: loader.load('../data/flower-1.jpg') }),
        new THREE.MeshBasicMaterial({ map: loader.load('../data/flower-3.jpg') }),
        new THREE.MeshBasicMaterial({ map: loader.load('../data/flower-4.jpg') }),
        new THREE.MeshBasicMaterial({ map: loader.load('../data/flower-5.jpg') }),
        new THREE.MeshBasicMaterial({ map: loader.load('../data/flower-6.jpg') }),
    ];
    const loadingElem = document.querySelector('#loading');
    const progressBarElem = loadingElem.querySelector('.progressbar');
    // loadManager.onLoad = () => {

    //     loadingElem.style.display = 'none';
    //     const cube = new THREE.Mesh(geometry, materials);
    //     scene.add(cube);
    //     cubes.push(cube);  // add to our list of cubes to rotate
    // };

    loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
        const progress = itemsLoaded / itemsTotal;
        progressBarElem.style.transform = `scaleX(${progress})`;
    };

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

    const wrapModes = {
        'ClampToEdgeWrapping': THREE.ClampToEdgeWrapping,
        'RepeatWrapping': THREE.RepeatWrapping,
        'MirroredRepeatWrapping': THREE.MirroredRepeatWrapping,
      };
       
      function updateTexture() {
        texture.needsUpdate = true;
      }
       
      const gui = new GUI();
      gui.add(new StringToNumberHelper(texture, 'wrapS'), 'value', wrapModes)
        .name('texture.wrapS')
        .onChange(updateTexture);
      gui.add(new StringToNumberHelper(texture, 'wrapT'), 'value', wrapModes)
        .name('texture.wrapT')
        .onChange(updateTexture);
      gui.add(texture.repeat, 'x', 0, 5, .01).name('texture.repeat.x');
      gui.add(texture.repeat, 'y', 0, 5, .01).name('texture.repeat.y');
      gui.add(texture.offset, 'x', -2, 2, .01).name('texture.offset.x');
      gui.add(texture.offset, 'y', -2, 2, .01).name('texture.offset.y');
      gui.add(texture.center, 'x', -.5, 1.5, .01).name('texture.center.x');
      gui.add(texture.center, 'y', -.5, 1.5, .01).name('texture.center.y');
      gui.add(new DegRadHelper(texture, 'rotation'), 'value', -360, 360)
        .name('texture.rotation');

    // render
    function render(time) {
        time *= 0.001;  // convert time to seconds

        // resize
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        // rotate
        // cubes.forEach((cube, ndx) => {
        //     const speed = 1 + ndx * .1;
        //     const rot = time * speed;
        //     cube.rotation.x = rot;
        //     cube.rotation.y = rot;
        // });

        // objects.forEach((obj) => {
        //     obj.rotation.y = time;
        // });
        // cubes.forEach((cube) => {
        //     cube.rotation.y = time;
        //     cube.rotation.x = time;
        // });
        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}