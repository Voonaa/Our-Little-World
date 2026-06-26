import * as THREE from 'three';

export class FlowingRiver {
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;
    this.normalMap1 = null;
    this.normalMap2 = null;
    
    this.createRiver();
  }

  // Generates a high-quality water ripple normal map procedurally
  createWaterNormalMap() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Render a high-frequency heightmap first, then calculate normals
    const heightMap = new Uint8Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Overlay sine/cosine waves at different scales to simulate water waves
        const nx = x / size * Math.PI * 2;
        const ny = y / size * Math.PI * 2;
        
        let val = Math.sin(nx * 4) * Math.cos(ny * 4) * 0.4;
        val += Math.sin(nx * 12 + ny * 6) * 0.2;
        val += Math.cos(nx * 20 - ny * 15) * 0.1;
        val = (val + 1) * 0.5 * 255; // Normalize to 0-255

        heightMap[y * size + x] = val;
      }
    }

    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    // Sobel filter to generate normal map from heightmap
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const xLeft = (x - 1 + size) % size;
        const xRight = (x + 1) % size;
        const yUp = (y - 1 + size) % size;
        const yDown = (y + 1) % size;

        const hL = heightMap[y * size + xLeft];
        const hR = heightMap[y * size + xRight];
        const hU = heightMap[yUp * size + x];
        const hD = heightMap[yDown * size + x];

        // Normal vectors (x, y, z)
        const dx = (hR - hL) / 255.0;
        const dy = (hD - hU) / 255.0;
        const dz = 0.15; // Controls wave steepness/reflection strength

        // Normalize
        const len = Math.sqrt(dx*dx + dy*dy + dz*dz);
        const nx = dx / len;
        const ny = dy / len;
        const nz = dz / len;

        // Map normals to RGB colors (0.0 - 1.0 maps to 0 - 255)
        const idx = (y * size + x) * 4;
        data[idx] = ((nx + 1) * 0.5) * 255;     // R (x-normal)
        data[idx+1] = ((ny + 1) * 0.5) * 255;   // G (y-normal)
        data[idx+2] = ((nz + 1) * 0.5) * 255;   // B (z-normal)
        data[idx+3] = 255;                      // Alpha
      }
    }

    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  createRiver() {
    // 1. Create a winding river plane
    // Winding geometry is hard with a simple plane, but we can shape it
    // like a long curved ribbon or use a displaced narrow plane.
    // Let's create a narrow curved river plane.
    const width = 3.5;
    const length = 55;
    
    // Generates a path that snakes slightly beside the pathway
    const points = [];
    for (let i = 0; i <= 40; i++) {
      const t = (i / 40);
      const z = -25 + t * 50; // from back to front
      
      // Snaking math: river winds around the center
      const x = Math.sin(t * Math.PI * 2.5) * 3.5 - 6; // offset to the left of the cottage
      const y = 3.8 + Math.cos(t * Math.PI * 1.5) * 0.05; // slight height waves
      points.push(new THREE.Vector3(x, y, z));
    }

    // Extrude geometry along a path to make a 3D curved river mesh
    const curve = new THREE.CatmullRomCurve3(points);
    const riverGeometry = new THREE.TubeGeometry(curve, 100, width/2, 8, false);

    // Generate normal maps for dual-scroll wave animation
    this.normalMap1 = this.createWaterNormalMap();
    this.normalMap2 = this.createWaterNormalMap();

    // Repeat normal patterns
    this.normalMap1.repeat.set(4, 25);
    this.normalMap2.repeat.set(3, 20);

    // 2. High-end Physical Water Material (refraction, transmission, clearcoat)
    // MeshPhysicalMaterial creates gorgeous refractive details automatically
    this.material = new THREE.MeshPhysicalMaterial({
      color: '#42b6d9',           // Crystal turquoise
      roughness: 0.02,            // Extremely shiny
      metalness: 0.05,
      transmission: 0.85,         // Real physics glass/water transparency
      ior: 1.333,                 // Index of refraction for water
      thickness: 1.5,             // Transmission thickness
      transparent: true,
      opacity: 0.95,
      clearcoat: 1.0,             // Glossy clearcoat layer
      clearcoatRoughness: 0.02,
      normalMap: this.normalMap1,
      normalScale: new THREE.Vector2(0.35, 0.35)
    });

    // Make only the top half of the tube visible or flatten it slightly
    this.mesh = new THREE.Mesh(riverGeometry, this.material);
    this.mesh.scale.set(1.0, 0.05, 1.0); // Flatten the tube into a shallow curved river bed
    this.mesh.position.y = 0.15; // Set slightly above base
    this.mesh.receiveShadow = true;
    
    this.scene.add(this.mesh);
  }

  update(time) {
    if (!this.mesh) return;

    // Dual scrolling water normal maps moving at different speeds/angles
    // to simulate real water ripple turbulence
    const speed = 0.08;
    this.normalMap1.offset.y = -time * speed;
    this.normalMap1.offset.x = Math.sin(time * 0.05) * 0.02;

    // Translate second normal map (could be applied as custom shader, 
    // but scrolling one normal map with time and shifting normal scale dynamically 
    // is highly performant and creates organic turbulence)
    this.material.normalScale.x = (0.28 + Math.sin(time * 0.5) * 0.07);
    this.material.normalScale.y = (0.28 + Math.cos(time * 0.4) * 0.07);
  }
}
