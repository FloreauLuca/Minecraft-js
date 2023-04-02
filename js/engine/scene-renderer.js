import * as THREE from 'three';

const canvas = document.querySelector('#minecraft');
export default class SceneRenderer {
    constructor(camera) {
        this.renderRequested = false;
        this.camera = camera;
        this.scene = new THREE.Scene();
        this.depthScene = new THREE.Scene();
        console.log(this.scene);
        console.log(this.depthScene);
        this.renderer = new THREE.WebGLRenderer({ canvas });
        this.createRenderTexture();
        this.setupScene(this.scene);
    }

    createRenderTexture() {
        const format = parseFloat(THREE.DepthFormat);
        const type = parseFloat(THREE.UnsignedIntType);
    
        this.renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
        this.renderTarget.texture.minFilter = THREE.NearestFilter;
        this.renderTarget.texture.magFilter = THREE.NearestFilter;
        this.renderTarget.stencilBuffer = (format === THREE.DepthStencilFormat) ? true : false;
        this.renderTarget.depthTexture = new THREE.DepthTexture();
        this.renderTarget.depthTexture.format = format;
        this.renderTarget.depthTexture.type = type;
    }
    
    setupScene(scene)
    {
        scene.background = new THREE.Color(0x87A5FF);
        {
            const selfRenderer = this.renderer;
            const selfScene = scene;
            const loader = new THREE.TextureLoader();
            const texture = loader.load(
              './data/skybox.jpg',
              () => {
                const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
                rt.fromEquirectangularTexture(selfRenderer, texture);
                selfScene.background = rt.texture;
              });
          }
          
    }

    addToDepthScene(object)
    {
        this.depthScene.add(object);
    }
    
    addToScene(object)
    {
        this.scene.add(object);
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
            // render scene into target
            sceneRenderer.renderer.setRenderTarget(sceneRenderer.renderTarget);
            sceneRenderer.renderer.render(sceneRenderer.depthScene, sceneRenderer.camera);
    
            // render scene with water
            sceneRenderer.renderer.setRenderTarget(null);
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