import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export class SceneManager {
  constructor() {
    this.canvas = document.getElementById('webgl');
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.composer = null;
    this.bloomPass = null;
    
    this.init();
  }

  init() {
    // 1. Scene Creation
    this.scene = new THREE.Scene();

    // 2. Camera Setup (cinematic default focal length)
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
    // Start high up in the dawn clouds for the intro sequence
    this.camera.position.set(0, 120, 150);

    // 3. Renderer Config
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio at 2 for performance
    
    // Physical lighting configurations
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // 4. Fog Setup (Dawn initial values)
    this.scene.fog = new THREE.FogExp2('#ffeae0', 0.007); // soft volumetric dawn mist

    // 5. Controls (disabled initially during cinematic camera sweep)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enabled = false; // Enable later in UI transitions
    
    // Constraints to prevent clipping into the island rock base or going underground
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04; // 88 degrees
    this.controls.minDistance = 6;
    this.controls.maxDistance = 65;
    this.controls.target.set(0, 5, 0); // Focus on the cottage

    // 6. Post-processing Chain
    const renderPass = new RenderPass(this.scene, this.camera);
    
    // Magic bloom parameters
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.width, this.height),
      0.65, // strength
      0.6,  // radius
      0.3   // threshold
    );

    // Custom Vignette Shader
    const vignetteShader = {
      uniforms: {
        tDiffuse: { value: null },
        offset: { value: 1.0 },
        darkness: { value: 1.2 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float offset;
        uniform float darkness;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          vec2 uv = vUv - 0.5;
          float dist = length(uv);
          float vigor = smoothstep(0.0, offset, dist);
          color.rgb *= mix(1.0, 1.0 - darkness, vigor);
          gl_FragColor = color;
        }
      `
    };
    const vignettePass = new ShaderPass(vignetteShader);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderPass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(vignettePass);

    // Resize Handler
    window.addEventListener('resize', () => this.onWindowResize());
  }

  onWindowResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
    this.bloomPass.setSize(this.width, this.height);
  }

  update() {
    if (this.controls.enabled) {
      this.controls.update();
    }
  }

  render() {
    this.composer.render();
  }
}
