import * as THREE from 'three';

// Procedural texture generator using HTML5 Canvas
export const Textures = {
  // 1. Glowing Radial Circle (for fireflies, particle halos, soft points)
  createGlow: () => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.2, 'rgba(255, 245, 200, 0.8)');
    grad.addColorStop(0.5, 'rgba(255, 180, 80, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  },

  // 2. Soft Cloud Puff (multi-layered transparency radial gradients)
  createCloud: () => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(0.3, 'rgba(255, 245, 240, 0.6)');
    grad.addColorStop(0.7, 'rgba(240, 220, 230, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  },

  // 3. Cherry Blossom Petal Texture (teardrop shape, soft pink gradient)
  createPetal: () => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.translate(size/2, size/2);
    ctx.beginPath();
    
    // Heart/Teardrop shape
    ctx.moveTo(0, 20);
    ctx.bezierCurveTo(-15, 10, -20, -10, 0, -25);
    ctx.bezierCurveTo(20, -10, 15, 10, 0, 20);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, -25, 0, 20);
    grad.addColorStop(0, '#ffb3c6'); // Light pink
    grad.addColorStop(1, '#ff85a2'); // Deeper pink

    ctx.fillStyle = grad;
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  },

  // 4. Wooden Planks (brown wood grain structure)
  createWood: () => {
    const width = 512;
    const height = 512;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Base color
    ctx.fillStyle = '#8a5a36';
    ctx.fillRect(0, 0, width, height);

    // Plank lines
    ctx.strokeStyle = '#4d301b';
    ctx.lineWidth = 4;
    const numPlanks = 8;
    const plankWidth = width / numPlanks;
    
    for (let i = 0; i <= numPlanks; i++) {
      ctx.beginPath();
      ctx.moveTo(i * plankWidth, 0);
      ctx.lineTo(i * plankWidth, height);
      ctx.stroke();
    }

    // Wood grain lines
    ctx.strokeStyle = '#9c6a46';
    ctx.lineWidth = 1;
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const l = 30 + Math.random() * 80;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + l);
      ctx.stroke();
    }

    // Knots
    ctx.fillStyle = '#4d301b';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, 2 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  },

  // 5. Grass displacement/noise texture (roughness & color blend)
  createGrass: () => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base green
    ctx.fillStyle = '#557a46';
    ctx.fillRect(0, 0, size, size);

    // Dynamic green/brown highlights
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const w = 1 + Math.random() * 2;
      const h = 4 + Math.random() * 8;
      
      const r = Math.random();
      if (r < 0.4) {
        ctx.fillStyle = '#7a9d54'; // Light green
      } else if (r < 0.8) {
        ctx.fillStyle = '#3c5a2c'; // Dark green
      } else {
        ctx.fillStyle = '#a19060'; // Warm straw/brownish highlight
      }

      ctx.fillRect(x, y, w, h);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  },

  // 6. Rock bump/normal mapping simulation texture
  createRock: () => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base rock color (warm grey)
    ctx.fillStyle = '#787a7d';
    ctx.fillRect(0, 0, size, size);

    // Rock cracks and spots
    ctx.fillStyle = '#444648';
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const s = 1 + Math.random() * 3;
      ctx.fillRect(x, y, s, s);
    }

    // Rock highlights
    ctx.fillStyle = '#a0a2a5';
    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const s = 1 + Math.random() * 2;
      ctx.fillRect(x, y, s, s);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  },

  // 7. Butterfly Wing (symmetrical pattern, pastel colors)
  createButterfly: () => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Transparent background
    ctx.clearRect(0, 0, size, size);

    // Draw butterfly wings
    ctx.fillStyle = '#ff85a2'; // Base pink
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;

    // Top-left wing
    ctx.beginPath();
    ctx.moveTo(size/2, size/2);
    ctx.bezierCurveTo(size/2 - 20, size/2 - 40, size/2 - 50, size/2 - 30, size/2 - 50, size/2 - 10);
    ctx.bezierCurveTo(size/2 - 50, size/2 + 10, size/2 - 20, size/2 + 10, size/2, size/2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Top-right wing
    ctx.beginPath();
    ctx.moveTo(size/2, size/2);
    ctx.bezierCurveTo(size/2 + 20, size/2 - 40, size/2 + 50, size/2 - 30, size/2 + 50, size/2 - 10);
    ctx.bezierCurveTo(size/2 + 50, size/2 + 10, size/2 + 20, size/2 + 10, size/2, size/2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bottom-left wing
    ctx.fillStyle = '#ffd1dc'; // Soft pink
    ctx.beginPath();
    ctx.moveTo(size/2, size/2);
    ctx.bezierCurveTo(size/2 - 10, size/2 + 20, size/2 - 35, size/2 + 25, size/2 - 35, size/2 + 10);
    ctx.bezierCurveTo(size/2 - 35, size/2, size/2 - 10, size/2, size/2, size/2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bottom-right wing
    ctx.beginPath();
    ctx.moveTo(size/2, size/2);
    ctx.bezierCurveTo(size/2 + 10, size/2 + 20, size/2 + 35, size/2 + 25, size/2 + 35, size/2 + 10);
    ctx.bezierCurveTo(size/2 + 35, size/2, size/2 + 10, size/2, size/2, size/2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wing details (inner spots)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(size/2 - 30, size/2 - 15, 3, 0, Math.PI * 2);
    ctx.arc(size/2 + 30, size/2 - 15, 3, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
};
