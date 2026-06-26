import * as THREE from 'three';
import { Textures } from './textures.js';

export class IslandEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.islandGroup = new THREE.Group();
    
    // Cache procedural textures
    this.grassTex = Textures.createGrass();
    this.rockTex = Textures.createRock();
    this.woodTex = Textures.createWood();
    
    this.createFloatingIsland();
    this.createCottage();
    this.createPathway();
    this.createBridge();
    this.createTrees();
    
    this.scene.add(this.islandGroup);
  }

  // Helper to add simple vertex noise for organic, stylized looks
  applyNoiseToGeometry(geometry, amplitude, scale, axis = 'y') {
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      
      // Simple pseudo-noise using sine/cosine combinations
      const noise = (
        Math.sin(x * scale) * Math.cos(z * scale) +
        Math.sin(x * scale * 2.5 + 2.0) * Math.cos(z * scale * 2.5) * 0.5 +
        Math.sin(z * scale * 5.0) * Math.cos(x * scale * 5.0) * 0.2
      ) * amplitude;

      if (axis === 'y') pos.setY(i, y + noise);
      else if (axis === 'x') pos.setX(i, x + noise);
      else if (axis === 'z') pos.setZ(i, z + noise);
    }
    
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
  }

  createFloatingIsland() {
    // 1. Grassy Island Surface (Top Cylinder)
    const topGeo = new THREE.CylinderGeometry(22, 21, 4, 32, 8);
    this.applyNoiseToGeometry(topGeo, 0.45, 0.25, 'y');
    
    // Scale texture repeating
    this.grassTex.repeat.set(8, 8);
    const grassMat = new THREE.MeshStandardMaterial({
      color: '#659c47',
      map: this.grassTex,
      roughness: 0.9,
      metalness: 0.05
    });

    const islandTop = new THREE.Mesh(topGeo, grassMat);
    islandTop.position.y = 2.0; // Place it sitting at the center
    islandTop.receiveShadow = true;
    islandTop.castShadow = true;
    this.islandGroup.add(islandTop);

    // 2. Rocky Cliff Underneath (Inverted Cone)
    const botGeo = new THREE.ConeGeometry(21, 24, 32, 16, true);
    
    // Distort the cone vertices to look like rocky craggy cliffs
    const pos = botGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      
      // Displace rock vertices horizontally based on depth
      const distort = (Math.sin(y * 0.5) * Math.cos(x * 0.2) + Math.cos(z * 0.3)) * 1.8;
      pos.setX(i, x + distort);
      pos.setZ(i, z + distort);
    }
    botGeo.computeVertexNormals();
    botGeo.attributes.position.needsUpdate = true;

    this.rockTex.repeat.set(4, 4);
    const rockMat = new THREE.MeshStandardMaterial({
      color: '#5c544d', // Warm rocky brown/grey
      map: this.rockTex,
      roughness: 0.95,
      metalness: 0.2
    });

    const islandBot = new THREE.Mesh(botGeo, rockMat);
    // Rotate cone downward
    islandBot.rotation.x = Math.PI;
    islandBot.position.y = -10.0; // Hang below the grass surface
    islandBot.castShadow = true;
    this.islandGroup.add(islandBot);

    // 3. Hanging Roots/Vines
    const numRoots = 15;
    for (let i = 0; i < numRoots; i++) {
      const rootLen = 8 + Math.random() * 12;
      const rootGeo = new THREE.CylinderGeometry(0.15, 0.03, rootLen, 5);
      
      // Bend the roots organically
      const rPos = rootGeo.attributes.position;
      for (let j = 0; j < rPos.count; j++) {
        const ry = rPos.getY(j);
        const bend = Math.sin(ry * 0.4) * 0.45;
        rPos.setX(j, rPos.getX(j) + bend);
      }
      rootGeo.computeVertexNormals();
      
      const rootMat = new THREE.MeshStandardMaterial({
        color: '#3d2616',
        roughness: 0.99
      });
      
      const root = new THREE.Mesh(rootGeo, rootMat);
      // Spawn roots around the bottom rim of the floating island
      const angle = (i / numRoots) * Math.PI * 2;
      const radius = 12 + Math.random() * 6;
      root.position.set(
        Math.cos(angle) * radius,
        -1.0 - Math.random() * 2,
        Math.sin(angle) * radius
      );
      root.rotation.z = (Math.random() - 0.5) * 0.3;
      root.rotation.x = (Math.random() - 0.5) * 0.3;
      this.islandGroup.add(root);
    }
  }

  createCottage() {
    const cottage = new THREE.Group();
    cottage.position.set(0, 4.0, 0); // Position on top of grassy surface

    // 1. Plaster Base Walls
    const wallGeo = new THREE.BoxGeometry(6.5, 4.2, 5.5);
    const wallMat = new THREE.MeshStandardMaterial({
      color: '#fdfaf2', // Soft cream/stucco
      roughness: 0.85
    });
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.y = 2.1;
    walls.castShadow = true;
    walls.receiveShadow = true;
    cottage.add(walls);

    // 2. Cozy Pitched Tile Roof
    // 4-sided pyramid
    const roofGeo = new THREE.ConeGeometry(5.8, 3.8, 4);
    this.woodTex.repeat.set(2, 2);
    const roofMat = new THREE.MeshStandardMaterial({
      color: '#b55a30', // Terracotta orange/brown roof tiles
      map: this.woodTex,
      roughness: 0.8,
      metalness: 0.1
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 5.6;
    roof.rotation.y = Math.PI / 4; // Rotate 45deg to align with square walls
    roof.scale.set(1.2, 1.0, 1.4); // Stretch slightly for fit
    roof.castShadow = true;
    cottage.add(roof);

    // 3. Wooden Door (Front +Z face)
    const doorGeo = new THREE.BoxGeometry(1.4, 2.4, 0.15);
    const doorMat = new THREE.MeshStandardMaterial({
      color: '#5c3a21', // Dark oak wood
      map: this.woodTex,
      roughness: 0.7
    });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 1.2, 2.76); // Front side centered
    door.castShadow = true;
    cottage.add(door);

    // 4. Windows with glowing emissive glass
    const winGeo = new THREE.BoxGeometry(1.0, 1.2, 0.2);
    // Emissive color will shine bright under postprocessing bloom!
    this.windowMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: '#ffa31a', // Golden amber interior lighting
      emissiveIntensity: 0.5, // Initial dawn intensity
      roughness: 0.1,
      metalness: 0.9
    });

    // Left window (Front face)
    const winLeft = new THREE.Mesh(winGeo, this.windowMat);
    winLeft.position.set(-2.0, 2.2, 2.76);
    cottage.add(winLeft);

    // Right window (Front face)
    const winRight = new THREE.Mesh(winGeo, this.windowMat);
    winRight.position.set(2.0, 2.2, 2.76);
    cottage.add(winRight);

    // Side Window (Left side)
    const winSideLeft = new THREE.Mesh(winGeo, this.windowMat);
    winSideLeft.rotation.y = Math.PI / 2;
    winSideLeft.position.set(-3.26, 2.2, 0);
    cottage.add(winSideLeft);

    // Side Window (Right side)
    const winSideRight = new THREE.Mesh(winGeo, this.windowMat);
    winSideRight.rotation.y = Math.PI / 2;
    winSideRight.position.set(3.26, 2.2, 0);
    cottage.add(winSideRight);

    // 5. Chimney
    const chimneyGeo = new THREE.BoxGeometry(0.8, 2.5, 0.8);
    const chimneyMat = new THREE.MeshStandardMaterial({
      color: '#5c544d', // Dark stone
      roughness: 0.9
    });
    const chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
    chimney.position.set(2.2, 5.0, -1.5);
    chimney.castShadow = true;
    cottage.add(chimney);

    // 6. Chimney Smoke Particle Emitter Point
    this.smokeSource = new THREE.Vector3(2.2, 6.3, -1.5);
    // Store local position relative to scene
    this.smokeWorldPos = new THREE.Vector3().copy(this.smokeSource).add(cottage.position);

    this.islandGroup.add(cottage);
  }

  createPathway() {
    const numStones = 11;
    const pathPoints = [];
    
    // Pathway coordinates curve down from the cottage door to the front edge
    for (let i = 0; i < numStones; i++) {
      const t = i / (numStones - 1);
      const z = 2.8 + t * 16.0; // extension forward
      
      // Snake path slightly around the river
      const x = Math.sin(t * Math.PI * 1.5) * 1.5 - 0.5;
      const y = 4.05; // Sitting slightly above the grass cylinder
      pathPoints.push(new THREE.Vector3(x, y, z));
    }

    const stoneMat = new THREE.MeshStandardMaterial({
      color: '#8b837c', // Grey cobblestone slate
      roughness: 0.9,
      map: this.rockTex
    });

    pathPoints.forEach((point, idx) => {
      // Don't spawn where the bridge is crossing (around index 5-6)
      if (idx === 5 || idx === 6) return;

      const size = 0.8 + Math.random() * 0.4;
      const stoneGeo = new THREE.CylinderGeometry(size, size + 0.1, 0.15, 8);
      
      // Distort stone shape
      this.applyNoiseToGeometry(stoneGeo, 0.05, 0.5);

      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.position.copy(point);
      
      // Random rotation and tilt for realistic look
      stone.rotation.y = Math.random() * Math.PI;
      stone.rotation.x = (Math.random() - 0.5) * 0.05;
      stone.rotation.z = (Math.random() - 0.5) * 0.05;
      stone.receiveShadow = true;
      this.islandGroup.add(stone);
    });
  }

  createBridge() {
    // Bridges the snaking pathway over the river
    // Spawns around z = 10, x = -3
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(-3.0, 4.15, 12.0);
    bridgeGroup.rotation.y = -Math.PI / 4.5; // align angle with path direction

    // Wooden planks
    const woodMat = new THREE.MeshStandardMaterial({
      color: '#6e472a',
      map: this.woodTex,
      roughness: 0.85
    });

    const numPlanks = 5;
    for (let i = 0; i < numPlanks; i++) {
      const plankGeo = new THREE.BoxGeometry(2.4, 0.12, 0.6);
      const plank = new THREE.Mesh(plankGeo, woodMat);
      plank.position.set(0, 0, (i - 2) * 0.7);
      plank.rotation.y = (Math.random() - 0.5) * 0.05; // natural spacing
      plank.castShadow = true;
      plank.receiveShadow = true;
      bridgeGroup.add(plank);
    }

    // Side ropes/rails
    const ropeGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.8, 6);
    const ropeMat = new THREE.MeshStandardMaterial({
      color: '#d6c2a5',
      roughness: 0.95
    });
    
    // Left rope
    const ropeL = new THREE.Mesh(ropeGeo, ropeMat);
    ropeL.rotation.z = Math.PI / 2;
    ropeL.position.set(-1.1, 0.3, 0);
    bridgeGroup.add(ropeL);

    // Right rope
    const ropeR = new THREE.Mesh(ropeGeo, ropeMat);
    ropeR.rotation.z = Math.PI / 2;
    ropeR.position.set(1.1, 0.3, 0);
    bridgeGroup.add(ropeR);

    // Supporting posts
    const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.2, 6);
    const postsCoords = [
      {x: -1.1, z: -1.3}, {x: -1.1, z: 1.3},
      {x: 1.1, z: -1.3}, {x: 1.1, z: 1.3}
    ];

    postsCoords.forEach(c => {
      const post = new THREE.Mesh(postGeo, woodMat);
      post.position.set(c.x, 0.4, c.z);
      post.castShadow = true;
      bridgeGroup.add(post);
    });

    this.islandGroup.add(bridgeGroup);
  }

  createTrees() {
    // Spawn 5 stylized, cute trees around the cottage
    const treeCoords = [
      { x: -10, z: -8, scale: 1.1, leafColor: '#4f783c' },  // Deep forest green
      { x: 10, z: -10, scale: 1.2, leafColor: '#f7a8b8' },  // Cherry blossom pink
      { x: 12, z: -2, scale: 0.9, leafColor: '#7a9d54' },   // Light green
      { x: -12, z: 6, scale: 1.0, leafColor: '#ffb3c6' },   // Cherry blossom pink
      { x: -8, z: -14, scale: 0.8, leafColor: '#557a46' }   // Moss green
    ];

    treeCoords.forEach(c => {
      const tree = new THREE.Group();
      tree.position.set(c.x, 4.0, c.z);
      tree.scale.set(c.scale, c.scale, c.scale);

      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.3, 0.55, 5, 8);
      // Bend the trunk slightly
      const tPos = trunkGeo.attributes.position;
      for (let i = 0; i < tPos.count; i++) {
        const ty = tPos.getY(i);
        if (ty > 0) tPos.setX(i, tPos.getX(i) + 0.4);
      }
      trunkGeo.computeVertexNormals();

      const trunkMat = new THREE.MeshStandardMaterial({
        color: '#5c3a21',
        map: this.woodTex,
        roughness: 0.9
      });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 2.5;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      tree.add(trunk);

      // Foliage/Leaves (Stylized cloud clusters using spheres)
      const leavesGroup = new THREE.Group();
      leavesGroup.position.set(0.4, 5.0, 0); // Offset to sit on bent trunk
      
      const leavesMat = new THREE.MeshStandardMaterial({
        color: c.leafColor,
        roughness: 0.85,
        metalness: 0.05
      });

      // Spawn 5 spheres overlapping to make a soft cloud foliage
      const sphereConfigs = [
        { r: 2.5, x: 0, y: 0.6, z: 0 },
        { r: 1.8, x: -1.4, y: 0.2, z: -0.8 },
        { r: 1.8, x: 1.4, y: 0.2, z: 0.8 },
        { r: 1.6, x: 0.6, y: 1.6, z: -0.8 },
        { r: 1.6, x: -0.8, y: 1.4, z: 0.6 }
      ];

      sphereConfigs.forEach(sc => {
        const leafSphereGeo = new THREE.SphereGeometry(sc.r, 12, 12);
        // Distort slightly to make it bumpy/organic
        this.applyNoiseToGeometry(leafSphereGeo, 0.15, 0.4);
        const leafSphere = new THREE.Mesh(leafSphereGeo, leavesMat);
        leafSphere.position.set(sc.x, sc.y, sc.z);
        leafSphere.castShadow = true;
        leafSphere.receiveShadow = true;
        leavesGroup.add(leafSphere);
      });

      tree.add(leavesGroup);
      this.islandGroup.add(tree);
    });
  }

  // Update logic: make window glow change based on active theme
  updateWindowIntensity(theme) {
    if (!this.windowMat) return;
    
    let targetIntensity = 0.5;
    if (theme === 'day') targetIntensity = 0.0;
    else if (theme === 'dusk') targetIntensity = 2.5;
    else if (theme === 'night') targetIntensity = 4.5;
    
    // Animate material emissive intensity
    gsap.to(this.windowMat, {
      emissiveIntensity: targetIntensity,
      duration: 2.5,
      ease: 'power2.out'
    });
  }
}
