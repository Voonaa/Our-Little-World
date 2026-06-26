import * as THREE from 'three';
import { SceneManager } from './scene.js';
import { LightingManager } from './lighting.js';
import { IslandEnvironment } from './island.js';
import { FlowingRiver } from './water.js';
import { FlowerGarden } from './garden.js';
import { AtmosphereParticles } from './particles.js';
import { UIManager } from './ui.js';

// AAA Application Orchestrator
class Application {
  constructor() {
    this.sceneManager = null;
    this.lightingManager = null;
    this.islandEnv = null;
    this.river = null;
    this.garden = null;
    this.particles = null;
    this.uiManager = null;

    this.startTime = performance.now();
    this.lastTime = performance.now();
    
    this.init();
  }

  init() {
    // 1. Core Scene Engine
    this.sceneManager = new SceneManager();

    // 2. Lighting Rig
    this.lightingManager = new LightingManager(
      this.sceneManager.scene,
      this.sceneManager.renderer
    );

    // 3. 3D Elements (Agus's Island, Cesya's Island, 60% Bridge, Porch details)
    this.islandEnv = new IslandEnvironment(this.sceneManager.scene);

    // 4. Procedural Water System (Flowing River)
    this.river = new FlowingRiver(this.sceneManager.scene);

    // 5. Instanced Greenery & Flower Fields (Swaying garden + 7 Monthly Flowers)
    this.garden = new FlowerGarden(this.sceneManager.scene);

    // 6. Atmospheric Effects (Clouds, Fireflies, Blossoms, Smoke, Butterflies, Birds, Rain, Steam, Sparks, Constellations)
    this.particles = new AtmosphereParticles(
      this.sceneManager.scene,
      this.islandEnv.smokeWorldPos,
      this.islandEnv.coffeeWorldPositions,
      this.islandEnv.bridgeParticlesPos
    );

    // 7. Interactive UI Overlay, Raycasting & Synthesized Sounds
    this.uiManager = new UIManager(
      this.sceneManager,
      this.lightingManager,
      this.particles,
      this.garden
    );

    // Start rendering tick loop
    this.tick();
  }

  tick() {
    const now = performance.now();
    const elapsedTime = (now - this.startTime) / 1000;
    const delta = Math.min((now - this.lastTime) / 1000, 0.1); // cap delta
    this.lastTime = now;

    // Update river surface animations
    if (this.river) this.river.update(elapsedTime);

    // Update grass/flower swaying values
    if (this.garden) this.garden.update(elapsedTime);

    // Update moving curtains inside cottage
    if (this.islandEnv) this.islandEnv.update(elapsedTime);

    // Update floating clouds, cherry blossoms, fireflies, butterflies, smoke, birds, rain, steam, sparks, constellations
    if (this.particles) this.particles.update(elapsedTime, delta);

    // Update camera controls
    if (this.sceneManager) this.sceneManager.update();

    // Update UI raycaster intersections
    if (this.uiManager) this.uiManager.updateRaycast();

    // Render postprocessing composition stack
    if (this.sceneManager) this.sceneManager.render();

    // Loop
    requestAnimationFrame(() => this.tick());
  }
}

// Instantiate and start application on document load
window.addEventListener('DOMContentLoaded', () => {
  new Application();
});
