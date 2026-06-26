import * as THREE from 'three';
import { Textures } from './textures.js';
import { gsap } from 'gsap';

export class AtmosphereParticles {
  constructor(scene, smokeWorldPos, coffeeWorldPositions = [], bridgeParticlesPos = []) {
    this.scene = scene;
    this.smokeWorldPos = smokeWorldPos;
    this.coffeeWorldPositions = coffeeWorldPositions;
    this.bridgeParticlesPos = bridgeParticlesPos;

    this.petalTexture = Textures.createPetal();
    this.glowTexture = Textures.createGlow();
    this.cloudTexture = Textures.createCloud();
    this.butterflyTexture = Textures.createButterfly();

    this.petalsSystem = null;
    this.firefliesSystem = null;
    this.rainSystem = null;
    this.steamSystem = null;
    this.bridgeSparksSystem = null;
    this.constellations = null;
    this.constellationStars = null;
    
    this.cloudsList = [];
    this.butterflies = [];
    this.smokeSystem = null;
    this.birds = [];
    
    // Materials cached for opacity fades in cinematic
    this.cloudMat = null;
    this.petalsMat = null;
    this.fireflyMat = null;
    this.smokeMat = null;
    this.rainMat = null;
    this.steamMat = null;
    this.sparkMat = null;
    this.constellationMat = null;
    this.constellationStarsMat = null;

    this.numPetals = 200;
    this.numFireflies = 100;
    this.numRain = 750;
    this.numSteam = 24;
    this.numSparks = 60;

    this.agusCenter = new THREE.Vector3(-15, 0, -5);
    this.cesyaCenter = new THREE.Vector3(15, 0.8, 5);

    // Dynamic Star Group (Scene 2 & 3 falling star)
    this.starGroup = null;
    this.starLight = null;
    this.createFallingStar();

    this.createClouds();
    this.createFallingPetals();
    this.createFireflies();
    this.createButterflies();
    this.createChimneySmoke();
    this.createBirds();
    
    this.createRainfall();
    this.createCoffeeSteam();
    this.createBridgeSparks();
    this.createConstellationLines();
    
    // Set all initial material opacities to 0.0 for cinematic entry
    this.initializeOpacitiesToZero();
  }

  // Cinematic Star Mesh (Scenes 2 & 3)
  createFallingStar() {
    this.starGroup = new THREE.Group();
    
    // Star core mesh
    const starGeo = new THREE.SphereGeometry(0.32, 16, 16);
    const starMat = new THREE.MeshBasicMaterial({ color: '#ffffe5' });
    const starMesh = new THREE.Mesh(starGeo, starMat);
    this.starGroup.add(starMesh);

    // Star glow envelope
    const haloGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const haloMat = new THREE.MeshBasicMaterial({
      color: '#ffeaad',
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    this.starGroup.add(halo);

    // PointLight to cast light downwards as it falls
    this.starLight = new THREE.PointLight('#ffeaad', 0, 25, 1.8);
    this.starLight.castShadow = true;
    this.starLight.shadow.bias = -0.001;
    this.starGroup.add(this.starLight);

    // Set initial position high above Agus's island
    this.starGroup.position.set(-15, 65, -1.0);
    this.starGroup.scale.set(0.0001, 0.0001, 0.0001); // start collapsed
    this.scene.add(this.starGroup);
  }

  initializeOpacitiesToZero() {
    if (this.cloudMat) this.cloudMat.opacity = 0;
    if (this.petalsMat) this.petalsMat.opacity = 0;
    if (this.fireflyMat) this.fireflyMat.opacity = 0;
    if (this.smokeMat) this.smokeMat.opacity = 0;
    if (this.rainMat) this.rainMat.opacity = 0;
    if (this.steamMat) this.steamMat.opacity = 0;
    if (this.sparkMat) this.sparkMat.opacity = 0;
    if (this.constellationMat) this.constellationMat.opacity = 0;
    if (this.constellationStarsMat) this.constellationStarsMat.opacity = 0;
    
    // Hide birds/butterflies scale initially
    this.birds.forEach(b => b.scale.set(0.0001, 0.0001, 0.0001));
    this.butterflies.forEach(b => b.scale.set(0.0001, 0.0001, 0.0001));
  }

  createClouds() {
    const cloudGroup = new THREE.Group();
    this.cloudMat = new THREE.MeshBasicMaterial({
      color: '#fff5f0',
      map: this.cloudTexture,
      transparent: true,
      opacity: 0, // starts transparent
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    const numClouds = 14;
    for (let i = 0; i < numClouds; i++) {
      const size = 15 + Math.random() * 8;
      const cloudGeo = new THREE.PlaneGeometry(size, size);
      const cloud = new THREE.Mesh(cloudGeo, this.cloudMat);
      
      const angle = (i / numClouds) * Math.PI * 2 + Math.random() * 0.4;
      const radius = 28 + Math.random() * 6;
      
      cloud.position.set(
        Math.cos(angle) * radius,
        -7.0 + (Math.random() - 0.5) * 4.0,
        Math.sin(angle) * radius
      );
      
      cloud.rotation.x = -Math.PI / 2;
      cloud.rotation.z = Math.random() * Math.PI * 2;

      cloud.userData = {
        angle: angle,
        radius: radius,
        speed: 0.006 + Math.random() * 0.006,
        bobSpeed: 0.25 + Math.random() * 0.2,
        bobHeight: 0.4 + Math.random() * 0.4,
        seed: Math.random() * 100
      };

      this.cloudsList.push(cloud);
      cloudGroup.add(cloud);
    }
    this.scene.add(cloudGroup);
  }

  createFallingPetals() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.numPetals * 3);
    const velocities = [];
    const rotationSeeds = [];

    for (let i = 0; i < this.numPetals; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 45;
      positions[i * 3 + 1] = 12 + Math.random() * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 45;

      velocities.push(new THREE.Vector3(
        -0.04 - Math.random() * 0.08,
        -0.08 - Math.random() * 0.12,
        (Math.random() - 0.5) * 0.05
      ));

      rotationSeeds.push({
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        speedX: 0.2 + Math.random() * 0.4,
        speedY: 0.3 + Math.random() * 0.6
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    this.petalsMat = new THREE.PointsMaterial({
      size: 0.4,
      map: this.petalTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.petalsSystem = new THREE.Points(geo, this.petalsMat);
    this.petalsSystem.userData = { velocities, rotationSeeds };
    this.scene.add(this.petalsSystem);
  }

  createFireflies() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.numFireflies * 3);
    const fireflySeeds = [];

    for (let i = 0; i < this.numFireflies; i++) {
      let x, y, z;
      const r = Math.random();
      
      if (r < 0.4) {
        x = -15 + (Math.random() - 0.5) * 12;
        z = -5 + (Math.random() - 0.5) * 12;
        y = 3.2 + Math.random() * 3.5;
      } else if (r < 0.8) {
        x = 15 + (Math.random() - 0.5) * 10;
        z = 5 + (Math.random() - 0.5) * 10;
        y = 2.2 + Math.random() * 3.5;
      } else {
        x = (Math.random() - 0.5) * 20;
        z = (Math.random() - 0.5) * 6;
        y = 2.5 + Math.random() * 4.0;
      }

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      fireflySeeds.push({
        baseX: x,
        baseY: y,
        baseZ: z,
        speedX: 0.3 + Math.random() * 0.5,
        speedY: 0.4 + Math.random() * 0.7,
        speedZ: 0.3 + Math.random() * 0.5,
        ampX: 0.4 + Math.random() * 0.5,
        ampY: 0.3 + Math.random() * 0.4,
        ampZ: 0.4 + Math.random() * 0.5,
        offset: Math.random() * 100
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.fireflyMat = new THREE.PointsMaterial({
      size: 0.6,
      map: this.glowTexture,
      transparent: true,
      opacity: 0,
      color: '#ccff33',
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.firefliesSystem = new THREE.Points(geo, this.fireflyMat);
    this.firefliesSystem.userData = { fireflySeeds };
    this.scene.add(this.firefliesSystem);
  }

  createButterflies() {
    const numButterflies = 6;
    const colors = ['#ff85a2', '#7bc8f6', '#ffdf4d', '#cc33ff'];

    for (let i = 0; i < numButterflies; i++) {
      const butterfly = new THREE.Group();
      const wingMat = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        map: this.butterflyTexture,
        side: THREE.DoubleSide,
        transparent: true,
        roughness: 0.3
      });

      const wingGeo = new THREE.PlaneGeometry(0.32, 0.32);
      wingGeo.translate(0.16, 0, 0);

      const wingL = new THREE.Mesh(wingGeo, wingMat);
      wingL.rotation.y = Math.PI;
      butterfly.add(wingL);

      const wingR = new THREE.Mesh(wingGeo, wingMat);
      butterfly.add(wingR);

      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 4), new THREE.MeshStandardMaterial({ color: '#111' }));
      body.rotation.x = Math.PI / 2;
      butterfly.add(body);

      butterfly.scale.set(0.0001, 0.0001, 0.0001); // start collapsed
      
      const island = i < 3 ? this.agusCenter : this.cesyaCenter;
      const angle = (i / numButterflies) * Math.PI * 2;
      const radius = 5 + Math.random() * 6;
      butterfly.position.set(
        island.x + Math.cos(angle) * radius,
        3.5 + Math.random() * 2.5,
        island.z + Math.sin(angle) * radius
      );

      butterfly.userData = {
        wingL, wingR, angle, radius, island,
        heightOffset: butterfly.position.y,
        speed: 0.35 + Math.random() * 0.35,
        flapSpeed: 15 + Math.random() * 7,
        seed: Math.random() * 100
      };

      this.butterflies.push(butterfly);
      this.scene.add(butterfly);
    }
  }

  createChimneySmoke() {
    const count = 35;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const smokeSeeds = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = this.smokeWorldPos.x;
      positions[i * 3 + 1] = this.smokeWorldPos.y - 100;
      positions[i * 3 + 2] = this.smokeWorldPos.z;

      smokeSeeds.push({
        age: Math.random() * 4.0,
        lifetime: 4.0 + Math.random() * 1.0,
        vx: (Math.random() - 0.5) * 0.05,
        vy: 0.07 + Math.random() * 0.06,
        vz: (Math.random() - 0.5) * 0.05 - 0.03
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.smokeMat = new THREE.PointsMaterial({
      size: 1.1,
      map: this.glowTexture,
      color: '#beb4bd',
      transparent: true,
      opacity: 0,
      depthWrite: false
    });

    this.smokeSystem = new THREE.Points(geo, this.smokeMat);
    this.smokeSystem.userData = { smokeSeeds };
    this.scene.add(this.smokeSystem);
  }

  createBirds() {
    const numBirds = 5;
    const birdGroup = new THREE.Group();

    for (let i = 0; i < numBirds; i++) {
      const points = [
        new THREE.Vector3(-0.3, -0.06, 0),
        new THREE.Vector3(0, 0.06, 0.04),
        new THREE.Vector3(0.3, -0.06, 0)
      ];
      const birdGeo = new THREE.BufferGeometry().setFromPoints(points);
      const birdMat = new THREE.LineBasicMaterial({ color: '#ffb3c6' });
      const bird = new THREE.Line(birdGeo, birdMat);
      
      bird.position.set(
        -85 + Math.random() * 15,
        42 + Math.random() * 12,
        -55 - Math.random() * 25
      );
      bird.scale.set(0.0001, 0.0001, 0.0001); // start collapsed

      bird.userData = {
        speed: 0.11 + Math.random() * 0.05,
        wingFlapSpeed: 4.5 + Math.random() * 2.5,
        geometry: birdGeo,
        seed: Math.random() * 10
      };

      this.birds.push(bird);
      birdGroup.add(bird);
    }
    this.scene.add(birdGroup);
  }

  createRainfall() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.numRain * 3);
    const rainSeeds = [];

    for (let i = 0; i < this.numRain; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = -50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

      rainSeeds.push({
        vy: -0.8 - Math.random() * 0.6,
        vx: -0.05 - Math.random() * 0.05
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.rainMat = new THREE.PointsMaterial({
      size: 0.22,
      color: '#9bc2e6',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.rainSystem = new THREE.Points(geo, this.rainMat);
    this.rainSystem.userData = { rainSeeds };
    this.scene.add(this.rainSystem);
  }

  createCoffeeSteam() {
    if (this.coffeeWorldPositions.length === 0) return;

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.numSteam * 3);
    const steamSeeds = [];

    for (let i = 0; i < this.numSteam; i++) {
      const cupIdx = i % this.coffeeWorldPositions.length;
      const cupPos = this.coffeeWorldPositions[cupIdx];

      positions[i * 3] = cupPos.x;
      positions[i * 3 + 1] = cupPos.y - 100;

      steamSeeds.push({
        cupIndex: cupIdx,
        age: Math.random() * 3.0,
        lifetime: 2.8 + Math.random() * 0.8,
        vx: (Math.random() - 0.5) * 0.015,
        vy: 0.015 + Math.random() * 0.015,
        vz: (Math.random() - 0.5) * 0.015
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.steamMat = new THREE.PointsMaterial({
      size: 0.35,
      map: this.glowTexture,
      color: '#fdfaf2',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.steamSystem = new THREE.Points(geo, this.steamMat);
    this.steamSystem.userData = { steamSeeds };
    this.scene.add(this.steamSystem);
  }

  createBridgeSparks() {
    if (this.bridgeParticlesPos.length === 0) return;

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.numSparks * 3);
    const sparkSeeds = [];

    for (let i = 0; i < this.numSparks; i++) {
      const endIdx = i % 2;
      const endPos = this.bridgeParticlesPos[endIdx];

      positions[i * 3] = endPos.x;
      positions[i * 3 + 1] = endPos.y - 100;
      positions[i * 3 + 2] = endPos.z;

      sparkSeeds.push({
        endIndex: endIdx,
        age: Math.random() * 2.5,
        lifetime: 2.0 + Math.random() * 1.0,
        vx: (endIdx === 0 ? 0.04 : -0.04) + (Math.random() - 0.5) * 0.02,
        vy: 0.02 + Math.random() * 0.04,
        vz: (Math.random() - 0.5) * 0.03
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.sparkMat = new THREE.PointsMaterial({
      size: 0.5,
      map: this.glowTexture,
      color: '#ffa64d',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.bridgeSparksSystem = new THREE.Points(geo, this.sparkMat);
    this.bridgeSparksSystem.userData = { sparkSeeds };
    this.scene.add(this.bridgeSparksSystem);
  }

  createConstellationLines() {
    const p0 = new THREE.Vector3(-15, 25, -30);
    const p1 = new THREE.Vector3(-6, 32, -35);
    const p2 = new THREE.Vector3(6, 33, -35);
    const p3 = new THREE.Vector3(15, 27, -30);

    const points = [p0, p1, p1, p2, p2, p3];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    this.constellationMat = new THREE.LineBasicMaterial({
      color: '#ffcc99',
      transparent: true,
      opacity: 0,
      linewidth: 1.5
    });

    this.constellations = new THREE.LineSegments(geo, this.constellationMat);
    this.scene.add(this.constellations);

    const hubGeo = new THREE.BufferGeometry();
    const hubPositions = new Float32Array([
      p0.x, p0.y, p0.z,
      p1.x, p1.y, p1.z,
      p2.x, p2.y, p2.z,
      p3.x, p3.y, p3.z
    ]);
    hubGeo.setAttribute('position', new THREE.BufferAttribute(hubPositions, 3));

    this.constellationStarsMat = new THREE.PointsMaterial({
      size: 1.2,
      map: this.glowTexture,
      color: '#ffffff',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.constellationStars = new THREE.Points(hubGeo, this.constellationStarsMat);
    this.scene.add(this.constellationStars);
  }

  updateEnvironmentLights(theme) {
    let fireflyOpacity = 0.9;
    let fireflyColor = '#ccff33';
    let fireflySize = 0.6;

    if (theme === 'day' || theme === 'sunny') {
      fireflyOpacity = 0.05;
      fireflySize = 0.15;
    } else if (theme === 'dusk' || theme === 'golden') {
      fireflyOpacity = 0.8;
      fireflyColor = '#ffa31a';
      fireflySize = 0.7;
    } else if (theme === 'night' || theme === 'stars') {
      fireflyOpacity = 1.0;
      fireflySize = 0.85;
      fireflyColor = '#ccff33';
    }

    // Protect check in case timeline runs before fade-in completes
    if (this.fireflyMat) {
      gsap.to(this.fireflyMat, { opacity: fireflyOpacity, size: fireflySize, duration: 2.5, ease: 'power2.out' });
      const col = new THREE.Color(fireflyColor);
      gsap.to(this.fireflyMat.color, { r: col.r, g: col.g, b: col.b, duration: 2.5 });
    }

    if (this.rainMat) {
      const targetRainOpacity = theme === 'rain' ? 0.75 : 0.0;
      gsap.to(this.rainMat, { opacity: targetRainOpacity, duration: 2.0 });
    }

    if (this.constellationMat) {
      const targetStarOpacity = theme === 'stars' ? 0.65 : 0.0;
      gsap.to(this.constellationMat, { opacity: targetStarOpacity, duration: 2.5 });
      gsap.to(this.constellationStarsMat, { opacity: targetStarOpacity === 0 ? 0.0 : 0.9, duration: 2.5 });
    }
  }

  update(time, delta) {
    // Animate clouds
    this.cloudsList.forEach(cloud => {
      cloud.userData.angle += cloud.userData.speed;
      const bob = Math.sin(time * cloud.userData.bobSpeed + cloud.userData.seed) * cloud.userData.bobHeight;
      cloud.position.set(
        Math.cos(cloud.userData.angle) * cloud.userData.radius,
        -7.0 + bob,
        Math.sin(cloud.userData.angle) * cloud.userData.radius
      );
      cloud.rotation.z += 0.00035;
    });

    // Animate petals
    if (this.petalsSystem && this.petalsMat.opacity > 0.01) {
      const pos = this.petalsSystem.geometry.attributes.position;
      const vels = this.petalsSystem.userData.velocities;
      const rot = this.petalsSystem.userData.rotationSeeds;

      for (let i = 0; i < this.numPetals; i++) {
        let x = pos.getX(i); let y = pos.getY(i); let z = pos.getZ(i);
        const vel = vels[i]; const r = rot[i];

        x += vel.x + Math.sin(time * r.speedX + r.rotX) * 0.03;
        y += vel.y;
        z += vel.z + Math.cos(time * r.speedY + r.rotY) * 0.02;

        if (y < -12.0) {
          x = (Math.random() - 0.5) * 45;
          y = 12.0 + Math.random() * 15;
          z = (Math.random() - 0.5) * 45;
        }
        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
    }

    // Animate fireflies
    if (this.firefliesSystem && this.fireflyMat.opacity > 0.01) {
      const pos = this.firefliesSystem.geometry.attributes.position;
      const seeds = this.firefliesSystem.userData.fireflySeeds;

      for (let i = 0; i < this.numFireflies; i++) {
        const s = seeds[i];
        const x = s.baseX + Math.sin(time * s.speedX + s.offset) * s.ampX;
        const y = s.baseY + Math.cos(time * s.speedY + s.offset) * s.ampY;
        const z = s.baseZ + Math.sin(time * s.speedZ + s.offset) * s.ampZ;
        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
    }

    // Animate butterflies
    this.butterflies.forEach(b => {
      if (b.scale.x < 0.01) return; // skip animation if collapsed
      const ud = b.userData;
      ud.wingL.rotation.y = Math.PI - Math.sin(time * ud.flapSpeed) * 0.9;
      ud.wingR.rotation.y = Math.sin(time * ud.flapSpeed) * 0.9;

      ud.angle += 0.005 * ud.speed;
      const hover = Math.sin(time * ud.speed * 2.0 + ud.seed) * 0.55;
      
      const tx = ud.island.x + Math.cos(ud.angle) * ud.radius + Math.sin(time * ud.speed) * 1.2;
      const tz = ud.island.z + Math.sin(ud.angle) * ud.radius + Math.cos(time * ud.speed * 0.8) * 1.2;
      const ty = ud.heightOffset + hover;

      const current = b.position.clone();
      const next = new THREE.Vector3(tx, ty, tz);
      b.position.copy(next);

      const dir = next.clone().sub(current).normalize();
      if (dir.lengthSq() > 0.001) {
        const targetRotY = Math.atan2(-dir.z, dir.x);
        b.rotation.y = THREE.MathUtils.lerp(b.rotation.y, targetRotY, 0.1);
      }
    });

    // Animate smoke
    if (this.smokeSystem && this.smokeMat.opacity > 0.01) {
      const pos = this.smokeSystem.geometry.attributes.position;
      const seeds = this.smokeSystem.userData.smokeSeeds;

      for (let i = 0; i < pos.count; i++) {
        const s = seeds[i];
        s.age += delta;

        let sx = pos.getX(i); let sy = pos.getY(i); let sz = pos.getZ(i);

        if (s.age >= s.lifetime) {
          sx = this.smokeWorldPos.x;
          sy = this.smokeWorldPos.y;
          sz = this.smokeWorldPos.z;
          s.age = 0;
        } else {
          sx += s.vx; sy += s.vy; sz += s.vz;
        }
        pos.setXYZ(i, sx, sy, sz);
      }
      pos.needsUpdate = true;
    }

    // Animate birds
    this.birds.forEach(bird => {
      if (bird.scale.x < 0.01) return;
      const ud = bird.userData;
      bird.position.x += ud.speed;
      
      if (bird.position.x > 80.0) {
        bird.position.x = -85.0;
        bird.position.y = 40 + Math.random() * 12;
      }

      const geo = ud.geometry;
      const posAttr = geo.attributes.position;
      const flap = Math.sin(time * ud.wingFlapSpeed + ud.seed) * 0.1;
      posAttr.setY(0, -0.06 + flap);
      posAttr.setY(2, -0.06 + flap);
      posAttr.needsUpdate = true;
    });

    // Animate rain
    if (this.rainSystem && this.rainMat.opacity > 0.01) {
      const pos = this.rainSystem.geometry.attributes.position;
      const seeds = this.rainSystem.userData.rainSeeds;

      for (let i = 0; i < this.numRain; i++) {
        const s = seeds[i];
        let rx = pos.getX(i); let ry = pos.getY(i); let rz = pos.getZ(i);

        rx += s.vx;
        ry += s.vy;

        if (ry < -4.0) {
          rx = (Math.random() - 0.5) * 60;
          ry = 18.0 + Math.random() * 12;
          rz = (Math.random() - 0.5) * 60;
        }
        pos.setXYZ(i, rx, ry, rz);
      }
      pos.needsUpdate = true;
    }

    // Animate steam
    if (this.steamSystem && this.steamMat.opacity > 0.01) {
      const pos = this.steamSystem.geometry.attributes.position;
      const seeds = this.steamSystem.userData.steamSeeds;

      for (let i = 0; i < this.numSteam; i++) {
        const s = seeds[i];
        s.age += delta;

        let sx = pos.getX(i); let sy = pos.getY(i); let sz = pos.getZ(i);

        if (s.age >= s.lifetime) {
          const cupPos = this.coffeeWorldPositions[s.cupIndex];
          sx = cupPos.x + (Math.random() - 0.5) * 0.05;
          sy = cupPos.y;
          sz = cupPos.z + (Math.random() - 0.5) * 0.05;
          s.age = 0;
        } else {
          sx += s.vx;
          sy += s.vy;
          sz += s.vz;
        }
        pos.setXYZ(i, sx, sy, sz);
      }
      pos.needsUpdate = true;
    }

    // Animate sparks
    if (this.bridgeSparksSystem && this.sparkMat.opacity > 0.01) {
      const pos = this.bridgeSparksSystem.geometry.attributes.position;
      const seeds = this.bridgeSparksSystem.userData.sparkSeeds;

      for (let i = 0; i < this.numSparks; i++) {
        const s = seeds[i];
        s.age += delta;

        let sx = pos.getX(i); let sy = pos.getY(i); let sz = pos.getZ(i);

        if (s.age >= s.lifetime) {
          const startPos = this.bridgeParticlesPos[s.endIndex];
          sx = startPos.x;
          sy = startPos.y;
          sz = startPos.z;
          s.age = 0;
        } else {
          sx += s.vx + Math.sin(time * 3.5 + i) * 0.02;
          sy += s.vy;
          sz += s.vz + Math.cos(time * 3.5 + i) * 0.02;
        }
        pos.setXYZ(i, sx, sy, sz);
      }
      pos.needsUpdate = true;
    }

    // Animate constellations
    if (this.constellations && this.constellationMat.opacity > 0.01) {
      this.constellationMat.opacity = 0.35 + Math.sin(time * 1.8) * 0.12;
    }
  }
}
