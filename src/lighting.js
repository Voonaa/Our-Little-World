import * as THREE from 'three';
import { gsap } from 'gsap';
import { audioInstance } from './audio.js';

export class LightingManager {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;

    this.hemiLight = null;
    this.dirLight = null;
    this.cottagePointLight = null;
    this.pathwayLight = null;
    
    this.shadowBias = -0.0005;

    // Define 7 total configurations (dawn + 6 requested weather states)
    this.states = {
      dawn: {
        skyColor: '#ffe6cc',
        groundColor: '#3c5a2c',
        hemiIntensity: 0.6,
        dirColor: '#ffa500', // warm gold sun
        dirIntensity: 1.3,
        dirPos: { x: -45, y: 15, z: -25 },
        fogColor: '#ffeae0',
        fogDensity: 0.012,
        cottageLightIntensity: 0.4,
        exposure: 1.05
      },
      sunny: {
        skyColor: '#bde3ff', // bright blue sky dome
        groundColor: '#4f783c',
        hemiIntensity: 0.9,
        dirColor: '#fffff5', // bright daylight
        dirIntensity: 1.9,
        dirPos: { x: 20, y: 65, z: 20 },
        fogColor: '#e3f5ff',
        fogDensity: 0.003,
        cottageLightIntensity: 0.0,
        exposure: 1.05
      },
      golden: {
        skyColor: '#7a3e7a', // deep sunset purple sky dome
        groundColor: '#2b3e21',
        hemiIntensity: 0.5,
        dirColor: '#ff4500', // deep red-orange sun rays
        dirIntensity: 1.6,
        dirPos: { x: 45, y: 8, z: -15 },
        fogColor: '#482452',
        fogDensity: 0.014,
        cottageLightIntensity: 2.5,
        exposure: 0.98
      },
      rain: {
        skyColor: '#334455', // dark overcast blue-grey
        groundColor: '#1c281a',
        hemiIntensity: 0.35,
        dirColor: '#8899aa', // dim flat sunlight
        dirIntensity: 0.5,
        dirPos: { x: 10, y: 50, z: 10 },
        fogColor: '#242f3d',
        fogDensity: 0.038, // dense dark rainy mist
        cottageLightIntensity: 3.0, // warm glow pops in rain
        exposure: 0.8
      },
      fog: {
        skyColor: '#ccdbe0', // flat white-grey mist sky dome
        groundColor: '#2a3528',
        hemiIntensity: 0.45,
        dirColor: '#aabbcc',
        dirIntensity: 0.6,
        dirPos: { x: -10, y: 40, z: 5 },
        fogColor: '#dbe7eb',
        fogDensity: 0.048, // thick white fog sheet
        cottageLightIntensity: 2.2,
        exposure: 0.9
      },
      night: {
        skyColor: '#0a0d1a', // starry midnight
        groundColor: '#10151c',
        hemiIntensity: 0.2,
        dirColor: '#90b4bd', // cool moon reflection
        dirIntensity: 0.7,
        dirPos: { x: -30, y: 48, z: 15 },
        fogColor: '#070912',
        fogDensity: 0.018,
        cottageLightIntensity: 4.2,
        exposure: 0.88
      },
      stars: {
        skyColor: '#02030a', // pitch black sky dome to show emissive stars
        groundColor: '#0a0d12',
        hemiIntensity: 0.15,
        dirColor: '#7799aa', // soft blue star starlight
        dirIntensity: 0.55,
        dirPos: { x: -40, y: 55, z: 20 },
        fogColor: '#020308',
        fogDensity: 0.01, // extremely clear for stars viewing
        cottageLightIntensity: 4.5,
        exposure: 0.95
      }
    };

    this.current = 'dawn';
    this.createLights();
  }

  createLights() {
    const initial = this.states[this.current];

    this.hemiLight = new THREE.HemisphereLight(
      initial.skyColor,
      initial.groundColor,
      initial.hemiIntensity
    );
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(initial.dirColor, initial.dirIntensity);
    this.dirLight.position.set(initial.dirPos.x, initial.dirPos.y, initial.dirPos.z);
    
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 200;
    
    const shadowSize = 35;
    this.dirLight.shadow.camera.left = -shadowSize;
    this.dirLight.shadow.camera.right = shadowSize;
    this.dirLight.shadow.camera.top = shadowSize;
    this.dirLight.shadow.camera.bottom = -shadowSize;
    this.dirLight.shadow.bias = this.shadowBias;
    this.dirLight.shadow.normalBias = 0.04;
    
    this.scene.add(this.dirLight);

    // Warm orange hearth light inside cottage on Agus's island
    this.cottagePointLight = new THREE.PointLight('#ff7711', initial.cottageLightIntensity, 25, 1.5);
    // Placed in Agus's cottage (will adjust coordinates in island.js update relative to new island centers)
    // For now we set default position at center, will offset inside island.js relative placement
    this.cottagePointLight.position.set(-16.0, 5.5, -8.0); 
    this.cottagePointLight.castShadow = true;
    this.cottagePointLight.shadow.bias = -0.002;
    this.scene.add(this.cottagePointLight);
    
    // Tiny path light
    this.pathwayLight = new THREE.PointLight('#ffbb55', 0, 12, 2.0);
    this.pathwayLight.position.set(-16.0, 4.2, -2.0);
    this.scene.add(this.pathwayLight);
  }

  // Trigger lightning flashes during rain weather state
  triggerLightningFlash() {
    if (this.current !== 'rain') return;

    const flashIntensity = 4.0 + Math.random() * 3.0;
    const tl = gsap.timeline();
    
    // Quick double flash
    tl.to(this.dirLight, { intensity: flashIntensity, duration: 0.05, ease: 'power4.out' })
      .to(this.dirLight, { intensity: 0.5, duration: 0.08 })
      .to(this.dirLight, { intensity: flashIntensity - 1.0, duration: 0.04, ease: 'power4.out' })
      .to(this.dirLight, { intensity: 0.5, duration: 0.35, ease: 'power2.in' });
  }

  transitionTo(stateName, duration = 2.5) {
    if (!this.states[stateName]) return;
    this.current = stateName;
    const target = this.states[stateName];

    // Trigger procedural synthesizer ambiance crossfade
    audioInstance.fadeAmbiance(stateName);

    const targetSky = new THREE.Color(target.skyColor);
    const targetGround = new THREE.Color(target.groundColor);
    const targetDir = new THREE.Color(target.dirColor);
    const targetFog = new THREE.Color(target.fogColor);

    gsap.killTweensOf([
      this.hemiLight, this.hemiLight.color, this.hemiLight.groundColor,
      this.dirLight, this.dirLight.color, this.dirLight.position,
      this.scene.fog, this.scene.fog.color,
      this.cottagePointLight, this.pathwayLight,
      this.renderer
    ]);

    gsap.to(this.hemiLight, { intensity: target.hemiIntensity, duration, ease: 'power2.out' });
    gsap.to(this.hemiLight.color, { r: targetSky.r, g: targetSky.g, b: targetSky.b, duration, ease: 'power2.out' });
    gsap.to(this.hemiLight.groundColor, { r: targetGround.r, g: targetGround.g, b: targetGround.b, duration, ease: 'power2.out' });

    gsap.to(this.dirLight, { intensity: target.dirIntensity, duration, ease: 'power2.out' });
    gsap.to(this.dirLight.color, { r: targetDir.r, g: targetDir.g, b: targetDir.b, duration, ease: 'power2.out' });
    gsap.to(this.dirLight.position, { x: target.dirPos.x, y: target.dirPos.y, z: target.dirPos.z, duration, ease: 'power2.out' });

    gsap.to(this.scene.fog, { density: target.fogDensity, duration, ease: 'power2.out' });
    gsap.to(this.scene.fog.color, { r: targetFog.r, g: targetFog.g, b: targetFog.b, duration, ease: 'power2.out' });

    gsap.to(this.cottagePointLight, { intensity: target.cottageLightIntensity, duration, ease: 'power2.out' });
    
    const targetPathIntensity = (stateName === 'night' || stateName === 'stars') ? 1.8 : (stateName === 'dusk' || stateName === 'golden' ? 0.8 : 0);
    gsap.to(this.pathwayLight, { intensity: targetPathIntensity, duration, ease: 'power2.out' });

    gsap.to(this.renderer, { toneMappingExposure: target.exposure, duration, ease: 'power2.out' });
    gsap.to(document.body, { backgroundColor: target.fogColor, duration, ease: 'power2.out' });
  }
}
