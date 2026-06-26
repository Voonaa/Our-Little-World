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
    
    this.agusCenter = new THREE.Vector3(-15, 0, -5);
    this.cesyaCenter = new THREE.Vector3(15, 0.8, 5);

    this.windowMat = null;
    this.curtains = [];
    this.smokeWorldPos = new THREE.Vector3();
    this.coffeeWorldPositions = [];
    this.bridgeParticlesPos = [];
    
    // Growth references for opening cinematic (initialized at scale 0.0001)
    this.cottage = null;
    this.door = null;
    this.desk = null;
    this.telescope = null;
    this.trees = [];
    this.steppingStones = [];
    this.bridgePlanks = []; // wood planks
    this.bridgeRopes = [];  // rope and guide nodes
    this.memoryTree = null;
    this.windmill = null;
    this.windmillSails = null;
    
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

  createAgusIsland() {
    const group = new THREE.Group();
    group.position.copy(this.agusCenter);

    // Grassy Surface (visible initially)
    const topGeo = new THREE.CylinderGeometry(15, 14, 3, 32, 6);
    this.applyNoiseToGeometry(topGeo, 0.35, 0.3, 'y');
    this.grassTex.repeat.set(6, 6);
    const grassMat = new THREE.MeshStandardMaterial({
      color: '#55823c',
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

    // Cottage (Memory House) - starts scaled to 0.0001
    this.createCottage(group);

    // Study desk details - starts scaled to 0.0001
    this.desk = new THREE.Group();
    this.desk.position.set(-6, 3.1, -4);
    this.desk.rotation.y = Math.PI / 4;
    this.desk.scale.set(0.0001, 0.0001, 0.0001);

    const deskGeo = new THREE.BoxGeometry(2.0, 0.1, 1.2);
    const deskMat = new THREE.MeshStandardMaterial({ color: '#5c3a21', map: this.woodTex, roughness: 0.7 });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.y = 0.8;
    desk.castShadow = true;
    this.desk.add(desk);

    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6);
    const legCoords = [{x: -0.9, z: -0.5}, {x: -0.9, z: 0.5}, {x: 0.9, z: -0.5}, {x: 0.9, z: 0.5}];
    legCoords.forEach(c => {
      const leg = new THREE.Mesh(legGeo, deskMat);
      leg.position.set(c.x, 0.4, c.z);
      leg.castShadow = true;
      this.desk.add(leg);
    });

    const bookGeo = new THREE.BoxGeometry(0.35, 0.08, 0.25);
    const bookColors = ['#93c5fd', '#fca5a5', '#fde047'];
    for(let i=0; i<3; i++) {
      const book = new THREE.Mesh(bookGeo, new THREE.MeshStandardMaterial({ color: bookColors[i], roughness: 0.8 }));
      book.position.set(0.6, 0.89 + i*0.08, 0.2);
      book.rotation.y = (Math.random() - 0.5) * 0.2;
      book.castShadow = true;
      this.desk.add(book);
    }
    group.add(this.desk);

    // Pathway stepping stones - starts scaled to 0.0001
    const pathMat = new THREE.MeshStandardMaterial({ color: '#7a736c', map: this.rockTex, roughness: 0.9 });
    for(let i=0; i<8; i++) {
      const t = i / 7;
      const x = -3.0 + t * 14.0;
      const z = 2.0 - Math.sin(t * Math.PI) * 2.5;
      
      const size = 0.8 + Math.random() * 0.3;
      const stoneGeo = new THREE.CylinderGeometry(size, size + 0.1, 0.12, 8);
      this.applyNoiseToGeometry(stoneGeo, 0.04, 0.5);
      
      const stone = new THREE.Mesh(stoneGeo, pathMat);
      stone.position.set(x, 3.02, z);
      stone.rotation.y = Math.random() * Math.PI;
      stone.scale.set(0.0001, 0.0001, 0.0001);
      stone.receiveShadow = true;
      
      group.add(stone);
      this.steppingStones.push(stone);
    }

    this.createLargeMemoryTree(group);
    this.createWindmill(group);

    this.islandGroup.add(group);
  }

  createCottage(islandGroup) {
    this.cottage = new THREE.Group();
    this.cottage.name = 'cozy-cottage';
    this.cottage.position.set(0, 3.0, -3.0);
    this.cottage.scale.set(0.0001, 0.0001, 0.0001); // Growth initialization

    // Plaster Walls
    const wallGeo = new THREE.BoxGeometry(5.0, 3.5, 4.2);
    const wallMat = new THREE.MeshStandardMaterial({ color: '#fcfcf0', roughness: 0.9 });
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.y = 1.75;
    walls.castShadow = true;
    walls.receiveShadow = true;
    this.cottage.add(walls);

    // Pitched Roof
    const roofGeo = new THREE.ConeGeometry(4.6, 3.0, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: '#a64f26', map: this.woodTex, roughness: 0.8 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 4.75;
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.2, 1.0, 1.3);
    roof.castShadow = true;
    this.cottage.add(roof);

    // Front Door (+Z side) - rotated pivot for opening animation
    // Create door group to act as hinge pivot
    const doorHinge = new THREE.Group();
    doorHinge.position.set(0.6, 1.0, 2.11); // right edge hinge pivot
    
    const doorGeo = new THREE.BoxGeometry(1.2, 2.0, 0.1);
    const doorMat = new THREE.MeshStandardMaterial({ color: '#4a2e1b', map: this.woodTex, roughness: 0.75 });
    const doorMesh = new THREE.Mesh(doorGeo, doorMat);
    doorMesh.position.set(-0.6, 0, 0); // offset so hinge is at edge of door
    doorMesh.castShadow = true;
    doorHinge.add(doorMesh);
    
    this.cottage.add(doorHinge);
    this.door = doorHinge; // Expose hinge group

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
    this.cottage.add(w1);

    const w2 = new THREE.Mesh(winGeo, this.windowMat);
    w2.position.set(1.6, 1.8, 2.11);
    this.cottage.add(w2);

    // Swaying curtains inside front windows
    const curtainGeo = new THREE.PlaneGeometry(0.35, 0.8);
    const curtainMat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    
    for (let i = 0; i < 2; i++) {
      const curtainL = new THREE.Mesh(curtainGeo, curtainMat);
      curtainL.position.set(-1.75 + i*3.2, 1.8, 2.02);
      this.cottage.add(curtainL);
      this.curtains.push(curtainL);

      const curtainR = new THREE.Mesh(curtainGeo, curtainMat);
      curtainR.position.set(-1.45 + i*3.2, 1.8, 2.02);
      this.cottage.add(curtainR);
      this.curtains.push(curtainR);
    }

    // Chimney
    const chimneyGeo = new THREE.BoxGeometry(0.65, 2.0, 0.65);
    const chimney = new THREE.Mesh(chimneyGeo, new THREE.MeshStandardMaterial({ color: '#4a4744', roughness: 0.9 }));
    chimney.position.set(1.6, 4.2, -1.0);
    chimney.castShadow = true;
    this.cottage.add(chimney);

    const localSmoke = new THREE.Vector3(1.6, 5.2, -1.0);
    this.smokeWorldPos.copy(localSmoke).add(this.cottage.position).add(this.agusCenter);

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

    const cupGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.12, 8);
    const cupMat = new THREE.MeshStandardMaterial({ color: '#fcf8f2', roughness: 0.3 });
    
    const cup1 = new THREE.Mesh(cupGeo, cupMat);
    cup1.position.set(-0.18, 0.98, 0.05);
    cup1.castShadow = true;
    porchTableGroup.add(cup1);
    
    const cup2 = new THREE.Mesh(cupGeo, cupMat);
    cup2.position.set(0.18, 0.98, -0.05);
    cup2.castShadow = true;
    porchTableGroup.add(cup2);

    this.cottage.add(porchTableGroup);

    const localCup1 = new THREE.Vector3(-0.18, 1.05, 0.05).add(porchTableGroup.position).add(this.cottage.position).add(this.agusCenter);
    const localCup2 = new THREE.Vector3(0.18, 1.05, -0.05).add(porchTableGroup.position).add(this.cottage.position).add(this.agusCenter);
    this.coffeeWorldPositions.push(localCup1, localCup2);

    islandGroup.add(this.cottage);
  }

  createCesyaIsland() {
    const group = new THREE.Group();
    group.position.copy(this.cesyaCenter);

    // Grassy Surface (visible initially)
    const topGeo = new THREE.CylinderGeometry(14, 13, 2.5, 32, 6);
    this.applyNoiseToGeometry(topGeo, 0.3, 0.3, 'y');
    this.grassTex.repeat.set(5, 5);
    const grassMat = new THREE.MeshStandardMaterial({
      color: '#5e9447',
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

    // Observation deck - starts scaled to 0.0001
    this.telescope = new THREE.Group();
    this.telescope.position.set(4, 2.5, -4);
    this.telescope.scale.set(0.0001, 0.0001, 0.0001);
    
    const deckGeo = new THREE.CylinderGeometry(2.4, 2.4, 0.15, 12);
    const deckMat = new THREE.MeshStandardMaterial({ color: '#7c533c', map: this.woodTex, roughness: 0.85 });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.receiveShadow = true;
    this.telescope.add(deck);

    const teleGroup = new THREE.Group();
    teleGroup.position.set(-0.5, 0.08, 0.5);
    teleGroup.rotation.y = -Math.PI / 1.15;

    const standGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.4, 5);
    standGeo.translate(0, 0.7, 0);
    const standMat = new THREE.MeshStandardMaterial({ color: '#2a2d34', roughness: 0.4, metalness: 0.8 });
    
    for (let i = 0; i < 3; i++) {
      const leg = new THREE.Mesh(standGeo, standMat);
      leg.rotation.z = 0.28;
      leg.rotation.y = (i * Math.PI * 2) / 3;
      leg.castShadow = true;
      teleGroup.add(leg);
    }

    const barrelGeo = new THREE.CylinderGeometry(0.12, 0.08, 1.8, 8);
    const barrel = new THREE.Mesh(barrelGeo, new THREE.MeshStandardMaterial({ color: '#bbd2ec', roughness: 0.2, metalness: 0.9 }));
    barrel.position.y = 1.35;
    barrel.rotation.z = -0.35;
    barrel.castShadow = true;
    teleGroup.add(barrel);
    
    const lensGeo = new THREE.CylinderGeometry(0.125, 0.125, 0.04, 8);
    const lens = new THREE.Mesh(lensGeo, new THREE.MeshBasicMaterial({ color: '#ffeaad' }));
    lens.position.set(-0.35, 1.5, 0);
    lens.rotation.z = -0.35;
    teleGroup.add(lens);

    this.telescope.add(teleGroup);
    group.add(this.telescope);

    // Stepping stones path - starts scaled to 0.0001
    const pathMat = new THREE.MeshStandardMaterial({ color: '#7a736c', map: this.rockTex, roughness: 0.9 });
    for(let i=0; i<8; i++) {
      const t = i / 7;
      const x = -13.0 + t * 15.0;
      const z = -2.0 + Math.sin(t * Math.PI) * 2.0;
      
      const size = 0.7 + Math.random() * 0.3;
      const stoneGeo = new THREE.CylinderGeometry(size, size + 0.1, 0.12, 8);
      this.applyNoiseToGeometry(stoneGeo, 0.04, 0.5);
      
      const stone = new THREE.Mesh(stoneGeo, pathMat);
      stone.position.set(x, 2.52, z);
      stone.rotation.y = Math.random() * Math.PI;
      stone.scale.set(0.0001, 0.0001, 0.0001);
      stone.receiveShadow = true;
      
      group.add(stone);
      this.steppingStones.push(stone);
    }

    // Spawn LDR Trees - starts scaled to 0.0001
    this.createTrees(group);

    this.islandGroup.add(group);
  }

  createBridgeOfLove() {
    const bridgeGroup = new THREE.Group();

    const startPoint = new THREE.Vector3(-4.0, 3.0, -1.8);
    const endPoint = new THREE.Vector3(4.5, 3.25, 1.8);

    const curvePoints = [
      startPoint,
      new THREE.Vector3(-1.0, 2.2, -0.6),
      new THREE.Vector3(1.5, 2.4, 0.6),
      endPoint
    ];
    
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

    for (let i = 0; i <= totalSteps; i++) {
      const t = i / totalSteps;
      const point = spline.getPointAt(t);
      const isGap = (t > 0.32 && t < 0.68);

      if (!isGap) {
        const plankGeo = new THREE.BoxGeometry(2.2, 0.1, 0.55);
        const plank = new THREE.Mesh(plankGeo, woodMat);
        plank.position.copy(point);

        const tangent = spline.getTangentAt(t);
        const angleY = Math.atan2(-tangent.z, tangent.x);
        plank.rotation.y = angleY + Math.PI/2;
        plank.rotation.z = Math.atan2(tangent.y, Math.sqrt(tangent.x*tangent.x + tangent.z*tangent.z));
        plank.scale.set(0.0001, 0.0001, 0.0001); // Growth initialization
        plank.castShadow = true;
        plank.receiveShadow = true;
        
        bridgeGroup.add(plank);
        this.bridgePlanks.push(plank);

        if (i % 4 === 0) {
          const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.0, 6);
          
          const postL = new THREE.Mesh(postGeo, woodMat);
          const offsetL = new THREE.Vector3(-1.0, 0.45, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), angleY + Math.PI/2);
          postL.position.copy(point).add(offsetL);
          postL.scale.set(0.0001, 0.0001, 0.0001);
          postL.castShadow = true;
          
          bridgeGroup.add(postL);
          this.bridgePlanks.push(postL);

          const postR = new THREE.Mesh(postGeo, woodMat);
          const offsetR = new THREE.Vector3(1.0, 0.45, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), angleY + Math.PI/2);
          postR.position.copy(point).add(offsetR);
          postR.scale.set(0.0001, 0.0001, 0.0001);
          postR.castShadow = true;
          
          bridgeGroup.add(postR);
          this.bridgePlanks.push(postR);
        }
      } else {
        const guideGeo = new THREE.SphereGeometry(0.05, 6, 6);
        const guideMat = new THREE.MeshBasicMaterial({ color: '#ffb366', transparent: true, opacity: 0.0 }); // hide initially
        const guide = new THREE.Mesh(guideGeo, guideMat);
        guide.position.copy(point);
        
        bridgeGroup.add(guide);
        this.bridgeRopes.push(guide); // store reference
      }

      if (Math.abs(t - 0.32) < 0.02) {
        this.bridgeParticlesPos[0] = point.clone();
      }
      if (Math.abs(t - 0.68) < 0.02) {
        this.bridgeParticlesPos[1] = point.clone();
      }
    }

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

      const offsetL = new THREE.Vector3(-1.0, 0.9, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), angleY + Math.PI/2);
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

    const addRopeLine = (pts) => {
      if (pts.length < 2) return;
      const ropeSpline = new THREE.CatmullRomCurve3(pts);
      const ropeGeo = new THREE.TubeGeometry(ropeSpline, pts.length * 2, 0.03, 4, false);
      const rope = new THREE.Mesh(ropeGeo, ropeMat);
      rope.scale.set(0.0001, 0.0001, 0.0001); // Growth initialization
      rope.castShadow = true;
      
      bridgeGroup.add(rope);
      this.bridgePlanks.push(rope); // reuse plank array for easier scale sweeps
    };

    addRopeLine(ropePointsL1);
    addRopeLine(ropePointsL2);
    addRopeLine(ropePointsR1);
    addRopeLine(ropePointsR2);

    this.islandGroup.add(bridgeGroup);
  }

  createTrees(islandGroup) {
    const treeCoords = [
      { x: -25, y: 3.0, z: -10, scale: 1.1, leafColor: '#4c7339', island: 'agus' },
      { x: -22, y: 3.0, z: -1, scale: 0.95, leafColor: '#5c8f49', island: 'agus' },
      { x: 23, y: 2.25, z: 9, scale: 1.15, leafColor: '#ffaec9', island: 'cesya' },
      { x: 25, y: 2.25, z: -1, scale: 0.85, leafColor: '#ffc2d1', island: 'cesya' },
      { x: 14, y: 2.25, z: 12, scale: 0.9, leafColor: '#608c4e', island: 'cesya' }
    ];

    treeCoords.forEach(c => {
      const tree = new THREE.Group();
      tree.position.set(c.x, c.y, c.z);
      // Growth scale initialized
      tree.scale.set(0.0001, 0.0001, 0.0001); 
      tree.userData = { targetScale: c.scale }; // cache target scale

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
      islandGroup.add(tree);
      
      this.trees.push(tree); // expose tree reference list
    });
  }

  createLargeMemoryTree(islandGroup) {
    this.memoryTree = new THREE.Group();
    this.memoryTree.position.set(-20.0, 3.0, -8.0);
    this.memoryTree.scale.set(0.0001, 0.0001, 0.0001); // starts collapsed
    this.memoryTree.userData = { targetScale: 1.5 }; // target scale is larger!

    // Thick main trunk
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.7, 6.0, 10);
    this.applyNoiseToGeometry(trunkGeo, 0.15, 0.4);
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#4a2f1b', map: this.woodTex, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 3.0;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    this.memoryTree.add(trunk);

    // Spreading organic branches
    const branchMat = trunkMat.clone();
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + (Math.random() - 0.5) * 0.3;
      const branchGeo = new THREE.CylinderGeometry(0.18, 0.3, 3.5, 6);
      branchGeo.translate(0, 1.75, 0);
      const branch = new THREE.Mesh(branchGeo, branchMat);
      branch.position.set(0, 4.0, 0);
      branch.rotation.z = 0.65;
      branch.rotation.y = angle;
      branch.castShadow = true;
      this.memoryTree.add(branch);
    }

    // Huge glowing pink/cherry leaves
    const leafMat = new THREE.MeshStandardMaterial({
      color: '#ffa3b1',
      emissive: '#ff66aa',
      emissiveIntensity: 0.35,
      roughness: 0.7,
      shadowSide: THREE.DoubleSide
    });

    const leafGroup = new THREE.Group();
    leafGroup.position.set(0, 5.8, 0);

    const leafSpheres = [
      { r: 3.2, x: 0, y: 1.0, z: 0 },
      { r: 2.2, x: -1.8, y: 0.2, z: -1.2 },
      { r: 2.2, x: 1.8, y: 0.2, z: 1.2 },
      { r: 2.0, x: 1.2, y: 0.5, z: -1.8 },
      { r: 2.0, x: -1.2, y: 0.5, z: 1.8 },
      { r: 1.8, x: 0, y: 2.2, z: 0.8 }
    ];

    leafSpheres.forEach(cfg => {
      const geo = new THREE.SphereGeometry(cfg.r, 12, 12);
      this.applyNoiseToGeometry(geo, 0.18, 0.4);
      const mesh = new THREE.Mesh(geo, leafMat);
      mesh.position.set(cfg.x, cfg.y, cfg.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      leafGroup.add(mesh);
    });

    this.memoryTree.add(leafGroup);

    // Light inside the foliage
    const treeLight = new THREE.PointLight('#ff66aa', 0.8, 8, 1.5);
    treeLight.position.set(0, 5.0, 0);
    this.memoryTree.add(treeLight);

    islandGroup.add(this.memoryTree);
    this.trees.push(this.memoryTree); // Grow in Scene 4
  }

  createWindmill(islandGroup) {
    this.windmill = new THREE.Group();
    this.windmill.position.set(-24.0, 3.0, -14.0);
    this.windmill.scale.set(0.0001, 0.0001, 0.0001); // starts collapsed
    this.windmill.userData = { targetScale: 1.0 };

    // Tower base
    const towerGeo = new THREE.CylinderGeometry(0.8, 1.5, 6.0, 8);
    const towerMat = new THREE.MeshStandardMaterial({ color: '#d2b48c', map: this.woodTex, roughness: 0.85 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = 3.0;
    tower.castShadow = true;
    tower.receiveShadow = true;
    this.windmill.add(tower);

    // Dome cabin head
    const headGeo = new THREE.SphereGeometry(1.0, 8, 8);
    headGeo.scale(1.0, 0.8, 1.2);
    const headMat = new THREE.MeshStandardMaterial({ color: '#8b4513', roughness: 0.8 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 6.2, 0.2);
    head.castShadow = true;
    this.windmill.add(head);

    // Sails hub
    this.windmillSails = new THREE.Group();
    this.windmillSails.position.set(0, 6.2, 1.2);

    const pinGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.35, 8);
    pinGeo.rotateX(Math.PI / 2);
    const pin = new THREE.Mesh(pinGeo, headMat);
    this.windmillSails.add(pin);

    // 4 Sails
    const sailWoodMat = new THREE.MeshStandardMaterial({ color: '#5c3a21', roughness: 0.9 });
    const sailCanvasMat = new THREE.MeshStandardMaterial({
      color: '#fcfcf0',
      roughness: 0.9,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < 4; i++) {
      const sailGroup = new THREE.Group();
      sailGroup.rotation.z = (i * Math.PI) / 2;

      // Wood spar
      const sparGeo = new THREE.BoxGeometry(0.08, 3.2, 0.08);
      sparGeo.translate(0, 1.6, 0);
      const spar = new THREE.Mesh(sparGeo, sailWoodMat);
      spar.castShadow = true;
      sailGroup.add(spar);

      // Canvas sail cloth
      const clothGeo = new THREE.PlaneGeometry(0.55, 2.2);
      clothGeo.translate(0.3, 2.0, 0);
      const cloth = new THREE.Mesh(clothGeo, sailCanvasMat);
      cloth.castShadow = true;
      sailGroup.add(cloth);

      this.windmillSails.add(sailGroup);
    }

    this.windmill.add(this.windmillSails);
    islandGroup.add(this.windmill);
    this.trees.push(this.windmill); // Grow in Scene 4
  }

  update(time) {
    this.curtains.forEach((curtain, idx) => {
      const speed = 1.2 + idx * 0.3;
      const angle = Math.sin(time * speed) * 0.08;
      curtain.rotation.y = angle;
    });

    if (this.windmillSails) {
      this.windmillSails.rotation.z = time * 0.38; // rotate windmill sails
    }
  }
}
