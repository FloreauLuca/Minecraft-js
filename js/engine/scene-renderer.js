import * as THREE from 'three';

const canvas = document.querySelector('#minecraft');
export default class SceneRenderer {
    constructor(camera) {
        this.renderRequested = false;
        this.camera = camera;
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ canvas });
        console.log(this.scene);
        this.scene.background = new THREE.Color(0x222222);
        // scene.background = new THREE.Color('lightblue');
    }

    resizeRendererToDisplaySize() {
        const canvas = this.renderer.domElement;
        const pixelRatio = window.devicePixelRatio;
        const width = canvas.clientWidth * pixelRatio | 0;
        const height = canvas.clientHeight * pixelRatio | 0;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            this.renderer.setSize(width, height, false);
        }
        return needResize;
    }

    render(sceneRenderer) {
        return function () {
            sceneRenderer.renderRequested = false;
            sceneRenderer.renderer.render(sceneRenderer.scene, sceneRenderer.camera);
        }
    }

    requestRenderIfNotRequested(sceneRenderer) {
        return function () {
            if (!sceneRenderer.renderRequested) {
                sceneRenderer.renderRequested = true;
                requestAnimationFrame(sceneRenderer.render(sceneRenderer));
            }
        }
    }
}