import * as THREE from 'three';
import * as GUIHelper from '../utility/gui-helper.js';

export default class Light {
    constructor(gui, callback) {
        const lightFolder = gui.addFolder("Light");
        lightFolder.onChange(callback);
        lightFolder.close();
        // ambient light
        {
            const color = 0xFFFFFF;
            const intensity = 0.7;
            this.ambientLight = new THREE.AmbientLight(color, intensity);
            lightFolder.addColor(new GUIHelper.ColorGUIHelper(this.ambientLight, 'color'), 'value').name('color');
            lightFolder.add(this.ambientLight, 'intensity', 0, 2, 0.01);

        }
        // directional light
        {
            const color = 0xFFFFFF;
            const intensity = 0.7;
            this.directionalLight = new THREE.DirectionalLight(color, intensity);
            this.directionalLight.position.set(0, 35, 20);
            this.directionalLight.target.position.set(25, 15, 15);

            const helper = new THREE.DirectionalLightHelper(this.directionalLight);
            //scene.add(helper);

            lightFolder.addColor(new GUIHelper.ColorGUIHelper(this.directionalLight, 'color'), 'value').name('color');
            lightFolder.add(this.directionalLight, 'intensity', 0, 2, 0.01);
            function updateLight() {
                this.directionalLight.target.updateMatrixWorld();
                helper.update();
            }
            GUIHelper.displayVector(lightFolder, this.directionalLight.position, 'position', -100, 100);
            GUIHelper.displayVector(lightFolder, this.directionalLight.target.position, 'target', -100, 100);
        }
    }
}
