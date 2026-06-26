import * as THREE from 'three';
import { gsap } from 'gsap';

export class LightingManager {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;

    this.hemiLight = null;
    this.dirLight = null;
    this.cottagePointLight = null; // Warm window/hearth light
    
    // Ambient shadows configuration
    this.shadowBias = -0.0005;

    // Define configuration values for each time of day
    this.states = {
      dawn: {
        skyColor: '#ffebd6',
        groundColor: '#3c5a2c',
        hemiIntensity: 0.55,
        dirColor: '#ffa84d', // warm golden sun
        dirIntensity: 1.4,
        dirPos: { x: -40, y: 15, z: -25 },
        fogColor: '#ffeae0',
        fogDensity: 0.012,
        cottageLightIntensity: 0.3,
        exposure: 1.05
      },
      day: {
        skyColor: '#bde3ff', // bright blue sky dome
        groundColor: '#4f783c',
        hemiIntensity: 0.85,
        dirColor: '#fffff0', // bright daylight
        dirIntensity: 1.8,
        dirPos: { x: 20, y: 60, z: 20 },
        fogColor: '#e3f5ff',
        fogDensity: 0.004,
        cottageLightIntensity: 0.0,
        exposure: 1.0
      },
      dusk: {
        skyColor: '#78508f', // deep purple sunset sky
        groundColor: '#2b3e21',
        hemiIntensity: 0.45,
        dirColor: '#ff4d24', // crimson sunset
        dirIntensity: 1.3,
        dirPos: { x: 40, y: 8, z: -15 },
        fogColor: '#382245',
        fogDensity: 0.014,
        cottageLightIntensity: 2.2,
        exposure: 0.95
      },
      night: {
        skyColor: '#0a0d1a', // starry dark blue sky
        groundColor: '#121921',
        hemiIntensity: 0.18,
        dirColor: '#9bbec7', // pale cool moon light
        dirIntensity: 0.65,
        dirPos: { x: -30, y: 50, z: 15 },
        fogColor: '#070912',
        fogDensity: 0.018,
        cottageLightIntensity: 3.8,
        exposure: 0.85
      }
    };

    this.current = 'dawn';
    this.createLights();
  }

  createLights() {
    const initial = this.states[this.current];

    // 1. Hemisphere Light (fills the shadows with sky dome light)
    this.hemiLight = new THREE.HemisphereLight(
      initial.skyColor,
      initial.groundColor,
      initial.hemiIntensity
    );
    this.scene.add(this.hemiLight);

    // 2. Directional Light (Sun/Moon - casts soft shadows)
    this.dirLight = new THREE.DirectionalLight(initial.dirColor, initial.dirIntensity);
    this.dirLight.position.set(initial.dirPos.x, initial.dirPos.y, initial.dirPos.z);
    
    // Shadow mapping configurations for cinematic quality
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048; // High res shadow map
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 200;
    
    // Adjust shadow frustum to fit the floating island perfectly
    const shadowSize = 35;
    this.dirLight.shadow.camera.left = -shadowSize;
    this.dirLight.shadow.camera.right = shadowSize;
    this.dirLight.shadow.camera.top = shadowSize;
    this.dirLight.shadow.camera.bottom = -shadowSize;
    this.dirLight.shadow.bias = this.shadowBias;
    this.dirLight.shadow.normalBias = 0.05; // minimize shadow acne
    
    this.scene.add(this.dirLight);

    // 3. Cottage point light (warm orange interior lighting glowing through doors/windows)
    // Placed inside the cottage at center
    this.cottagePointLight = new THREE.PointLight('#ff7711', initial.cottageLightIntensity, 25, 1.5);
    this.cottagePointLight.position.set(0, 5.5, 0); // Center height of cottage interior
    this.cottagePointLight.castShadow = true;
    this.cottagePointLight.shadow.bias = -0.002;
    this.cottagePointLight.shadow.mapSize.width = 512;
    this.cottagePointLight.shadow.mapSize.height = 512;
    this.scene.add(this.cottagePointLight);
    
    // Add a tiny glowing helper light on the pathway for dusk/night
    this.pathwayLight = new THREE.PointLight('#ffbb55', 0, 12, 2.0);
    this.pathwayLight.position.set(0, 4, 6); // Just outside the door
    this.scene.add(this.pathwayLight);
  }

  transitionTo(stateName, duration = 2.5) {
    if (!this.states[stateName]) return;
    this.current = stateName;
    const target = this.states[stateName];

    // Helper colors
    const targetSky = new THREE.Color(target.skyColor);
    const targetGround = new THREE.Color(target.groundColor);
    const targetDir = new THREE.Color(target.dirColor);
    const targetFog = new THREE.Color(target.fogColor);

    // Animate light parameters using GSAP
    gsap.killTweensOf([
      this.hemiLight, this.hemiLight.color, this.hemiLight.groundColor,
      this.dirLight, this.dirLight.color, this.dirLight.position,
      this.scene.fog, this.scene.fog.color,
      this.cottagePointLight, this.pathwayLight,
      this.renderer
    ]);

    // Hemi light intensities and colors
    gsap.to(this.hemiLight, { intensity: target.hemiIntensity, duration, ease: 'power2.out' });
    gsap.to(this.hemiLight.color, { r: targetSky.r, g: targetSky.g, b: targetSky.b, duration, ease: 'power2.out' });
    gsap.to(this.hemiLight.groundColor, { r: targetGround.r, g: targetGround.g, b: targetGround.b, duration, ease: 'power2.out' });

    // Directional light intensity, colors and positions (orbiting sun)
    gsap.to(this.dirLight, { intensity: target.dirIntensity, duration, ease: 'power2.out' });
    gsap.to(this.dirLight.color, { r: targetDir.r, g: targetDir.g, b: targetDir.b, duration, ease: 'power2.out' });
    gsap.to(this.dirLight.position, { x: target.dirPos.x, y: target.dirPos.y, z: target.dirPos.z, duration, ease: 'power2.out' });

    // Fog interpolation
    gsap.to(this.scene.fog, { density: target.fogDensity, duration, ease: 'power2.out' });
    gsap.to(this.scene.fog.color, { r: targetFog.r, g: targetFog.g, b: targetFog.b, duration, ease: 'power2.out' });

    // Cottage interior light intensity (bright at night/dusk, dim at day/dawn)
    gsap.to(this.cottagePointLight, { intensity: target.cottageLightIntensity, duration, ease: 'power2.out' });
    
    // Pathway light helper
    const targetPathIntensity = stateName === 'night' ? 1.5 : (stateName === 'dusk' ? 0.8 : 0);
    gsap.to(this.pathwayLight, { intensity: targetPathIntensity, duration, ease: 'power2.out' });

    // Renderer Tone Mapping Exposure Adjustments
    gsap.to(this.renderer, { toneMappingExposure: target.exposure, duration, ease: 'power2.out' });
    
    // Change background of renderer body to match fog color
    gsap.to(document.body.style, { backgroundColor: target.fogColor, duration, ease: 'power2.out' });
  }
}
