import * as THREE from 'three';
import { Textures } from './textures.js';

export class AtmosphereParticles {
  constructor(scene, smokeWorldPos) {
    this.scene = scene;
    this.smokeWorldPos = smokeWorldPos; // Vector3 from island.js

    this.petalTexture = Textures.createPetal();
    this.glowTexture = Textures.createGlow();
    this.cloudTexture = Textures.createCloud();
    this.butterflyTexture = Textures.createButterfly();

    this.petalsSystem = null;
    this.firefliesSystem = null;
    this.cloudsList = [];
    this.butterflies = [];
    this.smokeSystem = null;
    this.birds = [];

    // System configurations
    this.numPetals = 250;
    this.numFireflies = 120;

    this.createClouds();
    this.createFallingPetals();
    this.createFireflies();
    this.createButterflies();
    this.createChimneySmoke();
    this.createBirds();
  }

  // 1. Volumetric puffy clouds surrounding the floating island base
  createClouds() {
    const cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshBasicMaterial({
      color: '#fff5f0',
      map: this.cloudTexture,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    const numClouds = 16;
    for (let i = 0; i < numClouds; i++) {
      // Create cloud clusters from overlapping flat boxes/spheres
      const size = 12 + Math.random() * 8;
      const cloudGeo = new THREE.PlaneGeometry(size, size);
      
      const cloud = new THREE.Mesh(cloudGeo, cloudMat);
      
      // Arrange clouds in a large ring around the base of the island
      const angle = (i / numClouds) * Math.PI * 2 + Math.random() * 0.4;
      const radius = 24 + Math.random() * 8;
      
      cloud.position.set(
        Math.cos(angle) * radius,
        -8.0 + (Math.random() - 0.5) * 5.0, // Floating at the bottom rock level
        Math.sin(angle) * radius
      );
      
      // Face upwards slightly or align with camera view
      cloud.rotation.x = -Math.PI / 2;
      cloud.rotation.z = Math.random() * Math.PI * 2;

      // Custom properties for orbit animation
      cloud.userData = {
        angle: angle,
        radius: radius,
        speed: 0.008 + Math.random() * 0.008,
        bobSpeed: 0.2 + Math.random() * 0.3,
        bobHeight: 0.5 + Math.random() * 0.5,
        seed: Math.random() * 100
      };

      this.cloudsList.push(cloud);
      cloudGroup.add(cloud);
    }
    this.scene.add(cloudGroup);
  }

  // 2. Cherry Blossom Petals system (custom floating points)
  createFallingPetals() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.numPetals * 3);
    const velocities = [];
    const rotationSeeds = [];

    for (let i = 0; i < this.numPetals; i++) {
      // Spawn petals in a wide cylindrical box above the island
      positions[i * 3] = (Math.random() - 0.5) * 45;      // X
      positions[i * 3 + 1] = 10 + Math.random() * 25;     // Y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 45;  // Z

      velocities.push(new THREE.Vector3(
        -0.05 - Math.random() * 0.08,    // drift left
        -0.08 - Math.random() * 0.12,   // fall speed
        (Math.random() - 0.5) * 0.05    // z drift
      ));

      rotationSeeds.push({
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        speedX: 0.2 + Math.random() * 0.5,
        speedY: 0.3 + Math.random() * 0.8
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Points material using custom petal texture
    const mat = new THREE.PointsMaterial({
      size: 0.45,
      map: this.petalTexture,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.petalsSystem = new THREE.Points(geo, mat);
    this.petalsSystem.userData = { velocities, rotationSeeds };
    this.scene.add(this.petalsSystem);
  }

  // 3. Glowing Fireflies (points system with sine bobs)
  createFireflies() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.numFireflies * 3);
    const fireflySeeds = [];

    for (let i = 0; i < this.numFireflies; i++) {
      // Spawn fireflies clustered around trees, river, and cottage
      let x, y, z;
      const r = Math.random();
      
      if (r < 0.35) {
        // Cluster under the Cherry Blossom tree (x: 10, z: -10)
        x = 10 + (Math.random() - 0.5) * 8;
        z = -10 + (Math.random() - 0.5) * 8;
        y = 4.2 + Math.random() * 3.5;
      } else if (r < 0.65) {
        // Cluster along the river bank (left side)
        x = -10 + (Math.random() - 0.5) * 6;
        z = (Math.random() - 0.5) * 35;
        y = 4.1 + Math.random() * 1.5;
      } else {
        // General cottage garden
        const angle = Math.random() * Math.PI * 2;
        const dist = 4.0 + Math.random() * 12;
        x = Math.cos(angle) * dist;
        z = Math.sin(angle) * dist;
        y = 4.15 + Math.random() * 4.0;
      }

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      fireflySeeds.push({
        baseX: x,
        baseY: y,
        baseZ: z,
        speedX: 0.3 + Math.random() * 0.5,
        speedY: 0.5 + Math.random() * 0.8,
        speedZ: 0.3 + Math.random() * 0.5,
        ampX: 0.4 + Math.random() * 0.6,
        ampY: 0.3 + Math.random() * 0.5,
        ampZ: 0.4 + Math.random() * 0.6,
        offset: Math.random() * 100
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Greenish yellow glow shader material or simple PointsMaterial
    this.fireflyMat = new THREE.PointsMaterial({
      size: 0.65,
      map: this.glowTexture,
      transparent: true,
      opacity: 0.9,
      color: '#ccff33', // Neon firefly yellow-green
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.firefliesSystem = new THREE.Points(geo, this.fireflyMat);
    this.firefliesSystem.userData = { fireflySeeds };
    this.scene.add(this.firefliesSystem);
  }

  // 4. Fluttering Butterflies (Individual meshes with wing flapping animations)
  createButterflies() {
    const numButterflies = 6;
    const colors = ['#ff85a2', '#7bc8f6', '#ffdf4d', '#e0b0ff'];

    for (let i = 0; i < numButterflies; i++) {
      const butterfly = new THREE.Group();

      const wingMat = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        map: this.butterflyTexture,
        side: THREE.DoubleSide,
        transparent: true,
        roughness: 0.3
      });

      // Wing geometry (plane slightly angled)
      const wingGeo = new THREE.PlaneGeometry(0.35, 0.35);
      wingGeo.translate(0.175, 0, 0); // shift origin to hinge

      // Left wing
      const wingL = new THREE.Mesh(wingGeo, wingMat);
      wingL.rotation.y = Math.PI;
      butterfly.add(wingL);

      // Right wing
      const wingR = new THREE.Mesh(wingGeo, wingMat);
      butterfly.add(wingR);

      // Tiny antenna lines
      const bodyGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 4);
      const bodyMat = new THREE.MeshStandardMaterial({ color: '#111' });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.x = Math.PI / 2;
      butterfly.add(body);

      // Scale up slightly
      butterfly.scale.set(1.2, 1.2, 1.2);
      
      // Flight path variables
      const angle = (i / numButterflies) * Math.PI * 2;
      const radius = 6 + Math.random() * 8;
      butterfly.position.set(
        Math.cos(angle) * radius,
        4.5 + Math.random() * 2.5,
        Math.sin(angle) * radius
      );

      butterfly.userData = {
        wingL,
        wingR,
        angle,
        radius,
        heightOffset: butterfly.position.y,
        speed: 0.4 + Math.random() * 0.4,
        flapSpeed: 16 + Math.random() * 8,
        seed: Math.random() * 100
      };

      this.butterflies.push(butterfly);
      this.scene.add(butterfly);
    }
  }

  // 5. Chimney Smoke Particles (slow expanding physical puffs)
  createChimneySmoke() {
    const count = 40;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const smokeSeeds = [];

    for (let i = 0; i < count; i++) {
      // Start inactive (hidden inside chimney)
      positions[i * 3] = this.smokeWorldPos.x;
      positions[i * 3 + 1] = this.smokeWorldPos.y - 100;
      positions[i * 3 + 2] = this.smokeWorldPos.z;

      smokeSeeds.push({
        age: Math.random() * 5.0, // staggered initial state
        lifetime: 4.5 + Math.random() * 1.5,
        vx: (Math.random() - 0.5) * 0.06,
        vy: 0.08 + Math.random() * 0.08,
        vz: (Math.random() - 0.5) * 0.06 - 0.04 // slight wind blow backwards
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.2,
      map: this.glowTexture, // reuse glow texture for fuzzy smoke puffs
      color: '#c2b0c2', // Warm greyish pink smoke
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.smokeSystem = new THREE.Points(geo, mat);
    this.smokeSystem.userData = { smokeSeeds };
    this.scene.add(this.smokeSystem);
  }

  // 6. Flying Birds (V-shape lines far in the background sky)
  createBirds() {
    const numBirds = 5;
    const birdGroup = new THREE.Group();

    for (let i = 0; i < numBirds; i++) {
      // V-shaped line geometry representing a bird in simple low poly
      const points = [
        new THREE.Vector3(-0.35, -0.08, 0),
        new THREE.Vector3(0, 0.08, 0.05),
        new THREE.Vector3(0.35, -0.08, 0)
      ];
      const birdGeo = new THREE.BufferGeometry().setFromPoints(points);
      const birdMat = new THREE.LineBasicMaterial({
        color: '#ffbbdd', // golden-pink colored flying silhouettes
        linewidth: 2
      });

      const bird = new THREE.Line(birdGeo, birdMat);
      
      // Initial flight placement (very high, far away)
      bird.position.set(
        -80 + Math.random() * 10,
        45 + Math.random() * 15,
        -60 - Math.random() * 30
      );

      bird.userData = {
        speed: 0.12 + Math.random() * 0.06,
        wingFlapSpeed: 4 + Math.random() * 3,
        wingLeft: points[0],
        wingRight: points[2],
        wingCenter: points[1],
        geometry: birdGeo,
        seed: Math.random() * 10
      };

      this.birds.push(bird);
      birdGroup.add(bird);
    }
    this.scene.add(birdGroup);
  }

  // Handle dynamic glowing intensity changes based on active atmosphere
  updateEnvironmentLights(theme) {
    if (!this.fireflyMat) return;

    let fireflyOpacity = 0.9;
    let fireflySize = 0.65;
    let fireflyColor = '#ccff33';

    if (theme === 'day') {
      fireflyOpacity = 0.1;
      fireflySize = 0.2;
    } else if (theme === 'dusk') {
      fireflyOpacity = 0.85;
      fireflySize = 0.75;
      fireflyColor = '#ffa500'; // Amber orange
    } else if (theme === 'night') {
      fireflyOpacity = 1.0;
      fireflySize = 0.95;
      fireflyColor = '#ccff33'; // bright neon yellow-green
    }

    gsap.to(this.fireflyMat, {
      opacity: fireflyOpacity,
      size: fireflySize,
      duration: 2.5,
      ease: 'power2.out'
    });
    
    // Smoothly color transition fireflies
    const targetColor = new THREE.Color(fireflyColor);
    gsap.to(this.fireflyMat.color, {
      r: targetColor.r,
      g: targetColor.g,
      b: targetColor.b,
      duration: 2.5
    });
  }

  update(time, delta) {
    // 1. Animate clouds slow orbit
    this.cloudsList.forEach(cloud => {
      cloud.userData.angle += cloud.userData.speed;
      
      const bob = Math.sin(time * cloud.userData.bobSpeed + cloud.userData.seed) * cloud.userData.bobHeight;
      cloud.position.set(
        Math.cos(cloud.userData.angle) * cloud.userData.radius,
        -8.0 + bob,
        Math.sin(cloud.userData.angle) * cloud.userData.radius
      );
      
      // Face towards camera (billboarding approximation)
      cloud.rotation.z += 0.0003;
    });

    // 2. Animate falling petals
    if (this.petalsSystem) {
      const pos = this.petalsSystem.geometry.attributes.position;
      const vels = this.petalsSystem.userData.velocities;
      const rot = this.petalsSystem.userData.rotationSeeds;

      for (let i = 0; i < this.numPetals; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        const vel = vels[i];
        const r = rot[i];

        // Apply velocities
        x += vel.x + Math.sin(time * r.speedX + r.rotX) * 0.03; // sideways sway
        y += vel.y;
        z += vel.z + Math.cos(time * r.speedY + r.rotY) * 0.02;

        // Reset if petal falls below boundary
        if (y < -15.0) {
          x = (Math.random() - 0.5) * 45;
          y = 20.0 + Math.random() * 10;
          z = (Math.random() - 0.5) * 45;
        }

        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
    }

    // 3. Animate fireflies
    if (this.firefliesSystem) {
      const pos = this.firefliesSystem.geometry.attributes.position;
      const seeds = this.firefliesSystem.userData.fireflySeeds;

      for (let i = 0; i < this.numFireflies; i++) {
        const s = seeds[i];
        
        // Simplex noise-like bobbing using sin/cos of time
        const x = s.baseX + Math.sin(time * s.speedX + s.offset) * s.ampX;
        const y = s.baseY + Math.cos(time * s.speedY + s.offset) * s.ampY;
        const z = s.baseZ + Math.sin(time * s.speedZ + s.offset) * s.ampZ;

        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
    }

    // 4. Animate butterflies wing flapping & flying curves
    this.butterflies.forEach(b => {
      const ud = b.userData;
      
      // Wing flapping (fast cosine scale/rotation)
      ud.wingL.rotation.y = Math.PI - Math.sin(time * ud.flapSpeed) * 0.95;
      ud.wingR.rotation.y = Math.sin(time * ud.flapSpeed) * 0.95;

      // Flight math: Lissajous curves combined with orbital path
      ud.angle += 0.005 * ud.speed;
      const hoverY = Math.sin(time * ud.speed * 2.5 + ud.seed) * 0.6;
      
      const targetX = Math.cos(ud.angle) * ud.radius + Math.sin(time * ud.speed) * 1.5;
      const targetZ = Math.sin(ud.angle) * ud.radius + Math.cos(time * ud.speed * 0.8) * 1.5;
      const targetY = ud.heightOffset + hoverY;

      // Calculate heading direction
      const currentPos = b.position.clone();
      const nextPos = new THREE.Vector3(targetX, targetY, targetZ);
      b.position.copy(nextPos);

      // Smoothly orient butterfly towards its flying path
      const dir = nextPos.clone().sub(currentPos).normalize();
      if (dir.lengthSq() > 0.001) {
        const targetRotY = Math.atan2(-dir.z, dir.x);
        b.rotation.y = THREE.MathUtils.lerp(b.rotation.y, targetRotY, 0.1);
      }
    });

    // 5. Animate chimney smoke particles
    if (this.smokeSystem) {
      const pos = this.smokeSystem.geometry.attributes.position;
      const seeds = this.smokeSystem.userData.smokeSeeds;

      for (let i = 0; i < pos.count; i++) {
        const s = seeds[i];
        s.age += delta;

        let sx = pos.getX(i);
        let sy = pos.getY(i);
        let sz = pos.getZ(i);

        if (s.age >= s.lifetime) {
          // Recycle back to chimney mouth
          sx = this.smokeWorldPos.x;
          sy = this.smokeWorldPos.y;
          sz = this.smokeWorldPos.z;
          s.age = 0;
        } else {
          // Rise and disperse
          sx += s.vx;
          sy += s.vy;
          sz += s.vz;
        }

        pos.setXYZ(i, sx, sy, sz);
      }
      pos.needsUpdate = true;
    }

    // 6. Animate birds flying and wing flapping
    this.birds.forEach(bird => {
      const ud = bird.userData;
      
      // Fly forward (+X direction)
      bird.position.x += ud.speed;
      
      // Reset birds when they fly off screen
      if (bird.position.x > 80.0) {
        bird.position.x = -80.0;
        bird.position.y = 45 + Math.random() * 15;
      }

      // Animate lines to look like wing flap (modify bird geometry position buffers)
      const geo = ud.geometry;
      const posAttr = geo.attributes.position;
      
      const flap = Math.sin(time * ud.wingFlapSpeed + ud.seed) * 0.12;
      
      // Left tip (V-wingtip bobs)
      posAttr.setY(0, -0.08 + flap);
      // Right tip
      posAttr.setY(2, -0.08 + flap);
      
      posAttr.needsUpdate = true;
    });
  }
}
