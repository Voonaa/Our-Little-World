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
    
    // Centers of the two LDR islands
    this.agusCenter = new THREE.Vector3(-15, 0, -5);
    this.cesyaCenter = new THREE.Vector3(15, 0.8, 5);

    // Dynamic materials we want to animate/access
    this.windowMat = null;
    this.curtains = [];
    this.smokeWorldPos = new THREE.Vector3();
    this.coffeeWorldPositions = [];
    this.bridgeParticlesPos = []; // positions of bridge endpoints for magic sparks
    
    this.createAgusIsland();
    this.createCesyaIsland();
    this.createBridgeOfLove();
    
    this.scene.add(this.islandGroup);
  }

  applyNoiseToGeometry(geometry, amplitude, scale, axis = 'y') {
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      
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

  // --- 1. AGUS'S ISLAND (Pamulang, South Tangerang) ---
  createAgusIsland() {
    const group = new THREE.Group();
    group.position.copy(this.agusCenter);

    // Grassy Surface
    const topGeo = new THREE.CylinderGeometry(15, 14, 3, 32, 6);
    this.applyNoiseToGeometry(topGeo, 0.35, 0.3, 'y');
    this.grassTex.repeat.set(6, 6);
    const grassMat = new THREE.MeshStandardMaterial({
      color: '#55823c', // Lush tropical green
      map: this.grassTex,
      roughness: 0.9,
    });
    const top = new THREE.Mesh(topGeo, grassMat);
    top.position.y = 1.5;
    top.receiveShadow = true;
    top.castShadow = true;
    group.add(top);

    // Craggy Bottom Rocks
    const botGeo = new THREE.ConeGeometry(14, 18, 24, 12, true);
    const pos = botGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i); const y = pos.getY(i); const z = pos.getZ(i);
      const distort = (Math.sin(y * 0.4) * Math.cos(x * 0.3) + Math.cos(z * 0.2)) * 1.5;
      pos.setX(i, x + distort);
      pos.setZ(i, z + distort);
    }
    botGeo.computeVertexNormals();
    botGeo.attributes.position.needsUpdate = true;

    this.rockTex.repeat.set(3, 3);
    const rockMat = new THREE.MeshStandardMaterial({
      color: '#524b45',
      map: this.rockTex,
      roughness: 0.98,
    });
    const bot = new THREE.Mesh(botGeo, rockMat);
    bot.rotation.x = Math.PI;
    bot.position.y = -7.5;
    bot.castShadow = true;
    group.add(bot);

    // Cottage (Memory House)
    this.createCottage(group);

    // Study desk details (Pamulang, Agus working/reading)
    const deskGroup = new THREE.Group();
    deskGroup.position.set(-6, 3.1, -4);
    deskGroup.rotation.y = Math.PI / 4;

    // Small wooden desk
    const deskGeo = new THREE.BoxGeometry(2.0, 0.1, 1.2);
    const deskMat = new THREE.MeshStandardMaterial({ color: '#5c3a21', map: this.woodTex, roughness: 0.7 });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.y = 0.8;
    desk.castShadow = true;
    deskGroup.add(desk);

    // Desk legs
    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6);
    const legCoords = [{x: -0.9, z: -0.5}, {x: -0.9, z: 0.5}, {x: 0.9, z: -0.5}, {x: 0.9, z: 0.5}];
    legCoords.forEach(c => {
      const leg = new THREE.Mesh(legGeo, deskMat);
      leg.position.set(c.x, 0.4, c.z);
      leg.castShadow = true;
      deskGroup.add(leg);
    });

    // Books stacked on desk
    const bookGeo = new THREE.BoxGeometry(0.35, 0.08, 0.25);
    const bookColors = ['#93c5fd', '#fca5a5', '#fde047'];
    for(let i=0; i<3; i++) {
      const book = new THREE.Mesh(bookGeo, new THREE.MeshStandardMaterial({ color: bookColors[i], roughness: 0.8 }));
      book.position.set(0.6, 0.89 + i*0.08, 0.2);
      book.rotation.y = (Math.random() - 0.5) * 0.2;
      book.castShadow = true;
      deskGroup.add(book);
    }

    group.add(deskGroup);

    // Pathway leading to the bridge starting point (+X side)
    const pathMat = new THREE.MeshStandardMaterial({ color: '#7a736c', map: this.rockTex, roughness: 0.9 });
    for(let i=0; i<8; i++) {
      const t = i / 7;
      const x = -3.0 + t * 14.0; // Winding path towards bridge starting edge
      const z = 2.0 - Math.sin(t * Math.PI) * 2.5;
      
      const size = 0.8 + Math.random() * 0.3;
      const stoneGeo = new THREE.CylinderGeometry(size, size + 0.1, 0.12, 8);
      this.applyNoiseToGeometry(stoneGeo, 0.04, 0.5);
      
      const stone = new THREE.Mesh(stoneGeo, pathMat);
      stone.position.set(x, 3.02, z);
      stone.rotation.y = Math.random() * Math.PI;
      stone.receiveShadow = true;
      group.add(stone);
    }

    this.islandGroup.add(group);
  }

  createCottage(islandGroup) {
    const cottage = new THREE.Group();
    cottage.name = 'cozy-cottage';
    cottage.position.set(0, 3.0, -3.0); // Offset slightly to back of island

    // Plaster Walls
    const wallGeo = new THREE.BoxGeometry(5.0, 3.5, 4.2);
    const wallMat = new THREE.MeshStandardMaterial({ color: '#fcfcf0', roughness: 0.9 });
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.y = 1.75;
    walls.castShadow = true;
    walls.receiveShadow = true;
    cottage.add(walls);

    // Pitched Roof
    const roofGeo = new THREE.ConeGeometry(4.6, 3.0, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: '#a64f26', map: this.woodTex, roughness: 0.8 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 4.75;
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.2, 1.0, 1.3);
    roof.castShadow = true;
    cottage.add(roof);

    // Front Door (+Z side)
    const doorGeo = new THREE.BoxGeometry(1.2, 2.0, 0.1);
    const doorMat = new THREE.MeshStandardMaterial({ color: '#4a2e1b', map: this.woodTex, roughness: 0.75 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 1.0, 2.11);
    door.castShadow = true;
    cottage.add(door);

    // Glowing Windows
    const winGeo = new THREE.BoxGeometry(0.8, 1.0, 0.15);
    this.windowMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: '#ff9900',
      emissiveIntensity: 0.5,
      roughness: 0.1,
      metalness: 0.9
    });

    const w1 = new THREE.Mesh(winGeo, this.windowMat);
    w1.position.set(-1.6, 1.8, 2.11);
    cottage.add(w1);

    const w2 = new THREE.Mesh(winGeo, this.windowMat);
    w2.position.set(1.6, 1.8, 2.11);
    cottage.add(w2);

    // Swaying curtains inside front windows (semi-transparent planes)
    const curtainGeo = new THREE.PlaneGeometry(0.35, 0.8);
    const curtainMat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    
    for (let i = 0; i < 2; i++) {
      const curtainL = new THREE.Mesh(curtainGeo, curtainMat);
      // Place just behind window glass
      curtainL.position.set(-1.75 + i*3.2, 1.8, 2.02);
      cottage.add(curtainL);
      this.curtains.push(curtainL);

      const curtainR = new THREE.Mesh(curtainGeo, curtainMat);
      curtainR.position.set(-1.45 + i*3.2, 1.8, 2.02);
      cottage.add(curtainR);
      this.curtains.push(curtainR);
    }

    // Chimney & smoke variables
    const chimneyGeo = new THREE.BoxGeometry(0.65, 2.0, 0.65);
    const chimney = new THREE.Mesh(chimneyGeo, new THREE.MeshStandardMaterial({ color: '#4a4744', roughness: 0.9 }));
    chimney.position.set(1.6, 4.2, -1.0);
    chimney.castShadow = true;
    cottage.add(chimney);

    // Set chimney smoke source coordinates relative to scene
    const localSmoke = new THREE.Vector3(1.6, 5.2, -1.0);
    this.smokeWorldPos.copy(localSmoke).add(cottage.position).add(this.agusCenter);

    // Cozy porch table with coffee cups
    const porchTableGroup = new THREE.Group();
    porchTableGroup.position.set(1.8, 0, 3.2);

    const tableGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.08, 12);
    const tableMat = new THREE.MeshStandardMaterial({ color: '#8c6239', map: this.woodTex, roughness: 0.8 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.y = 0.9;
    table.castShadow = true;
    porchTableGroup.add(table);

    const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), tableMat);
    tableLeg.position.y = 0.45;
    tableLeg.castShadow = true;
    porchTableGroup.add(tableLeg);

    // Steaming coffee cups
    const cupGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.12, 8);
    const cupMat = new THREE.MeshStandardMaterial({ color: '#fcf8f2', roughness: 0.3 });
    
    // Cup 1 (Agus's)
    const cup1 = new THREE.Mesh(cupGeo, cupMat);
    cup1.position.set(-0.18, 0.98, 0.05);
    cup1.castShadow = true;
    porchTableGroup.add(cup1);
    
    // Cup 2 (Cesya's, placed when she visits, or waiting)
    const cup2 = new THREE.Mesh(cupGeo, cupMat);
    cup2.position.set(0.18, 0.98, -0.05);
    cup2.castShadow = true;
    porchTableGroup.add(cup2);

    cottage.add(porchTableGroup);

    // Cache coffee world coordinates for steam particles
    const localCup1 = new THREE.Vector3(-0.18, 1.05, 0.05).add(porchTableGroup.position).add(cottage.position).add(this.agusCenter);
    const localCup2 = new THREE.Vector3(0.18, 1.05, -0.05).add(porchTableGroup.position).add(cottage.position).add(this.agusCenter);
    this.coffeeWorldPositions.push(localCup1, localCup2);

    islandGroup.add(cottage);
  }

  // --- 2. CESYA'S ISLAND (Batam Center) ---
  createCesyaIsland() {
    const group = new THREE.Group();
    group.position.copy(this.cesyaCenter);

    // Grassy Surface
    const topGeo = new THREE.CylinderGeometry(14, 13, 2.5, 32, 6);
    this.applyNoiseToGeometry(topGeo, 0.3, 0.3, 'y');
    this.grassTex.repeat.set(5, 5);
    const grassMat = new THREE.MeshStandardMaterial({
      color: '#5e9447', // slightly brighter grass tone
      map: this.grassTex,
      roughness: 0.9,
    });
    const top = new THREE.Mesh(topGeo, grassMat);
    top.position.y = 1.25;
    top.receiveShadow = true;
    top.castShadow = true;
    group.add(top);

    // Craggy Bottom Rocks
    const botGeo = new THREE.ConeGeometry(13, 16, 24, 12, true);
    const pos = botGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i); const y = pos.getY(i); const z = pos.getZ(i);
      const distort = (Math.sin(y * 0.45) * Math.cos(x * 0.25) + Math.cos(z * 0.25)) * 1.4;
      pos.setX(i, x + distort);
      pos.setZ(i, z + distort);
    }
    botGeo.computeVertexNormals();
    botGeo.attributes.position.needsUpdate = true;

    this.rockTex.repeat.set(2.5, 2.5);
    const rockMat = new THREE.MeshStandardMaterial({
      color: '#4e4a46',
      map: this.rockTex,
      roughness: 0.98,
    });
    const bot = new THREE.Mesh(botGeo, rockMat);
    bot.rotation.x = Math.PI;
    bot.position.y = -6.75;
    bot.castShadow = true;
    group.add(bot);

    // Cozy observation deck with a high-end telescope pointing towards Agus's island
    const deckGroup = new THREE.Group();
    deckGroup.position.set(4, 2.5, -4);
    
    // Wooden circular deck
    const deckGeo = new THREE.CylinderGeometry(2.4, 2.4, 0.15, 12);
    const deckMat = new THREE.MeshStandardMaterial({ color: '#7c533c', map: this.woodTex, roughness: 0.85 });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.receiveShadow = true;
    deckGroup.add(deck);

    // Telescope
    const teleGroup = new THREE.Group();
    teleGroup.position.set(-0.5, 0.08, 0.5);
    teleGroup.rotation.y = -Math.PI / 1.15; // rotate to point towards Agus's island (-X, -Z direction)

    // Tripod stand
    const standGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.4, 5);
    standGeo.translate(0, 0.7, 0);
    const standMat = new THREE.MeshStandardMaterial({ color: '#2a2d34', roughness: 0.4, metalness: 0.8 });
    
    // 3 legs
    for (let i = 0; i < 3; i++) {
      const leg = new THREE.Mesh(standGeo, standMat);
      leg.rotation.z = 0.28;
      leg.rotation.y = (i * Math.PI * 2) / 3;
      leg.castShadow = true;
      teleGroup.add(leg);
    }

    // Telescope barrel
    const barrelGeo = new THREE.CylinderGeometry(0.12, 0.08, 1.8, 8);
    const barrel = new THREE.Mesh(barrelGeo, new THREE.MeshStandardMaterial({ color: '#bbd2ec', roughness: 0.2, metalness: 0.9 }));
    barrel.position.y = 1.35;
    barrel.rotation.z = -0.35; // tilt telescope up slightly
    barrel.castShadow = true;
    teleGroup.add(barrel);
    
    // Glowing lens cap
    const lensGeo = new THREE.CylinderGeometry(0.125, 0.125, 0.04, 8);
    const lensMat = new THREE.MeshBasicMaterial({ color: '#ffeaad' });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(-0.35, 1.5, 0);
    lens.rotation.z = -0.35;
    teleGroup.add(lens);

    deckGroup.add(teleGroup);
    group.add(deckGroup);

    // Pathway snaking from bridge ending edge (-X side) to telescope deck
    const pathMat = new THREE.MeshStandardMaterial({ color: '#7a736c', map: this.rockTex, roughness: 0.9 });
    for(let i=0; i<8; i++) {
      const t = i / 7;
      const x = -13.0 + t * 15.0; // from left bridge edge towards telescope deck
      const z = -2.0 + Math.sin(t * Math.PI) * 2.0;
      
      const size = 0.7 + Math.random() * 0.3;
      const stoneGeo = new THREE.CylinderGeometry(size, size + 0.1, 0.12, 8);
      this.applyNoiseToGeometry(stoneGeo, 0.04, 0.5);
      
      const stone = new THREE.Mesh(stoneGeo, pathMat);
      stone.position.set(x, 2.52, z);
      stone.rotation.y = Math.random() * Math.PI;
      stone.receiveShadow = true;
      group.add(stone);
    }

    this.islandGroup.add(group);
  }

  // --- 3. THE BRIDGE OF LOVE (LDR 60% Growing Bridge) ---
  createBridgeOfLove() {
    const bridgeGroup = new THREE.Group();

    // Spline curve mapping the complete connection path
    // Curve spans from edge of Agus's Island to edge of Cesya's Island
    const startPoint = new THREE.Vector3(-4.0, 3.0, -1.8);  // Edge of Agus's island
    const endPoint = new THREE.Vector3(4.5, 3.25, 1.8);    // Edge of Cesya's island

    // Dynamic curve bending in center
    const curvePoints = [
      startPoint,
      new THREE.Vector3(-1.0, 2.2, -0.6), // slight drop in middle
      new THREE.Vector3(1.5, 2.4, 0.6),
      endPoint
    ];
    
    // Apply world coordinates
    const startWorld = startPoint.clone().add(this.agusCenter);
    const endWorld = endPoint.clone().add(this.cesyaCenter);
    const mid1World = curvePoints[1].clone().add(this.agusCenter).lerp(curvePoints[1].clone().add(this.cesyaCenter), 0.3);
    const mid2World = curvePoints[2].clone().add(this.agusCenter).lerp(curvePoints[2].clone().add(this.cesyaCenter), 0.7);

    const worldCurvePoints = [
      startWorld,
      mid1World,
      mid2World,
      endWorld
    ];

    const spline = new THREE.CatmullRomCurve3(worldCurvePoints);
    const totalSteps = 40;

    const woodMat = new THREE.MeshStandardMaterial({
      color: '#6e472a',
      map: this.woodTex,
      roughness: 0.85
    });

    const ropeMat = new THREE.MeshStandardMaterial({
      color: '#d6c2a5',
      roughness: 0.95
    });

    // Draw planks along the spline curve, skipping the central 60% GAP (from t = 0.32 to t = 0.68)
    for (let i = 0; i <= totalSteps; i++) {
      const t = i / totalSteps;
      const point = spline.getPointAt(t);

      // Determine if within the LDR gap
      const isGap = (t > 0.32 && t < 0.68);

      if (!isGap) {
        // Render physical wooden plank
        const plankGeo = new THREE.BoxGeometry(2.2, 0.1, 0.55);
        const plank = new THREE.Mesh(plankGeo, woodMat);
        plank.position.copy(point);

        // Orient plank perpendicular to curve tangent vector
        const tangent = spline.getTangentAt(t);
        const angleY = Math.atan2(-tangent.z, tangent.x);
        plank.rotation.y = angleY + Math.PI/2;
        // Slight tilt
        plank.rotation.z = Math.atan2(tangent.y, Math.sqrt(tangent.x*tangent.x + tangent.z*tangent.z));
        plank.castShadow = true;
        plank.receiveShadow = true;
        bridgeGroup.add(plank);

        // Add support posts on bridge edges
        if (i % 4 === 0) {
          const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.0, 6);
          
          // Left side post
          const postL = new THREE.Mesh(postGeo, woodMat);
          const offsetL = new THREE.Vector3(-1.0, 0.45, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), angleY + Math.PI/2);
          postL.position.copy(point).add(offsetL);
          postL.castShadow = true;
          bridgeGroup.add(postL);

          // Right side post
          const postR = new THREE.Mesh(postGeo, woodMat);
          const offsetR = new THREE.Vector3(1.0, 0.45, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), angleY + Math.PI/2);
          postR.position.copy(point).add(offsetR);
          postR.castShadow = true;
          bridgeGroup.add(postR);
        }
      } else {
        // Draw a glowing guide bead (faint glowing yellow light bead) to represent LDR blueprint
        const guideGeo = new THREE.SphereGeometry(0.05, 6, 6);
        const guideMat = new THREE.MeshBasicMaterial({ color: '#ffb366', transparent: true, opacity: 0.35 });
        const guide = new THREE.Mesh(guideGeo, guideMat);
        guide.position.copy(point);
        bridgeGroup.add(guide);
      }

      // Record endpoints of the bridge gaps to spawn sparks
      if (Math.abs(t - 0.32) < 0.02) {
        this.bridgeParticlesPos[0] = point.clone(); // Left end of gap
      }
      if (Math.abs(t - 0.68) < 0.02) {
        this.bridgeParticlesPos[1] = point.clone(); // Right end of gap
      }
    }

    // Connect handrail ropes, also skipping the gap range
    const ropeSegments = 100;
    const ropePointsL1 = [];
    const ropePointsL2 = [];
    const ropePointsR1 = [];
    const ropePointsR2 = [];

    for (let i = 0; i <= ropeSegments; i++) {
      const t = i / ropeSegments;
      const point = spline.getPointAt(t);
      const tangent = spline.getTangentAt(t);
      const angleY = Math.atan2(-tangent.z, tangent.x);

      // Left rope guide
      const offsetL = new THREE.Vector3(-1.0, 0.9, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), angleY + Math.PI/2);
      // Right rope guide
      const offsetR = new THREE.Vector3(1.0, 0.9, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), angleY + Math.PI/2);

      const isGap = (t > 0.32 && t < 0.68);

      if (!isGap) {
        if (t <= 0.32) {
          ropePointsL1.push(point.clone().add(offsetL));
          ropePointsR1.push(point.clone().add(offsetR));
        } else {
          ropePointsL2.push(point.clone().add(offsetL));
          ropePointsR2.push(point.clone().add(offsetR));
        }
      }
    }

    // Render rope lines
    const addRopeLine = (pts) => {
      if (pts.length < 2) return;
      const ropeSpline = new THREE.CatmullRomCurve3(pts);
      const ropeGeo = new THREE.TubeGeometry(ropeSpline, pts.length * 2, 0.03, 4, false);
      const rope = new THREE.Mesh(ropeGeo, ropeMat);
      rope.castShadow = true;
      bridgeGroup.add(rope);
    };

    addRopeLine(ropePointsL1);
    addRopeLine(ropePointsL2);
    addRopeLine(ropePointsR1);
    addRopeLine(ropePointsR2);

    this.islandGroup.add(bridgeGroup);
  }

  // Make 5 low-poly tree blobs distributed on BOTH islands
  createTrees() {
    // Standard foliage trees defined on Agus's and Cesya's islands coordinates
    const treeCoords = [
      // Agus's Island (Pamulang)
      { x: -25, y: 3.0, z: -10, scale: 1.1, leafColor: '#4c7339', island: 'agus' },
      { x: -22, y: 3.0, z: -1, scale: 0.95, leafColor: '#5c8f49', island: 'agus' },
      // Cesya's Island (Batam Center)
      { x: 23, y: 2.25, z: 9, scale: 1.15, leafColor: '#ffaec9', island: 'cesya' }, // Beautiful pink blossoms
      { x: 25, y: 2.25, z: -1, scale: 0.85, leafColor: '#ffc2d1', island: 'cesya' },
      { x: 14, y: 2.25, z: 12, scale: 0.9, leafColor: '#608c4e', island: 'cesya' }
    ];

    treeCoords.forEach(c => {
      const tree = new THREE.Group();
      // Center position
      const center = c.island === 'agus' ? this.agusCenter : this.cesyaCenter;
      tree.position.set(c.x, c.y, c.z);
      tree.scale.set(c.scale, c.scale, c.scale);

      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.24, 0.45, 4.5, 8);
      const tPos = trunkGeo.attributes.position;
      for (let i = 0; i < tPos.count; i++) {
        const ty = tPos.getY(i);
        if (ty > 0) tPos.setX(i, tPos.getX(i) + 0.3);
      }
      trunkGeo.computeVertexNormals();

      const trunkMat = new THREE.MeshStandardMaterial({ color: '#55361e', map: this.woodTex, roughness: 0.9 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 2.25;
      trunk.castShadow = true;
      tree.add(trunk);

      // Foliage Clumps
      const leavesGroup = new THREE.Group();
      leavesGroup.position.set(0.3, 4.2, 0);

      const leavesMat = new THREE.MeshStandardMaterial({ color: c.leafColor, roughness: 0.85 });
      const sphereConfigs = [
        { r: 2.2, x: 0, y: 0.5, z: 0 },
        { r: 1.5, x: -1.2, y: 0.2, z: -0.6 },
        { r: 1.5, x: 1.2, y: 0.2, z: 0.6 },
        { r: 1.3, x: 0.5, y: 1.3, z: -0.6 }
      ];

      sphereConfigs.forEach(sc => {
        const leafSphereGeo = new THREE.SphereGeometry(sc.r, 10, 10);
        this.applyNoiseToGeometry(leafSphereGeo, 0.12, 0.5);
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

  update(time) {
    // Sway window curtains dynamically to simulate gentle breeze
    this.curtains.forEach((curtain, idx) => {
      const speed = 1.2 + idx * 0.3;
      const angle = Math.sin(time * speed) * 0.08;
      curtain.rotation.y = angle;
    });
  }
}
