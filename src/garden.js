import * as THREE from 'three';
import { gsap } from 'gsap';

export class FlowerGarden {
  constructor(scene) {
    this.scene = scene;
    
    this.grassMesh = null;
    this.flowerMeshPink = null;
    this.flowerMeshBlue = null;
    this.flowerMeshYellow = null;
    
    this.monthlyFlowerMeshes = []; // list of special 3D monthly flower groups for raycasting
    
    this.uniforms = {
      uTime: { value: 0 }
    };

    // Centers of the two LDR islands
    this.agusCenter = new THREE.Vector3(-15, 0, -5);
    this.cesyaCenter = new THREE.Vector3(15, 0.8, 5);

    this.createGarden();
    this.createMonthlyTimelineFlowers();
  }

  // Bounding check to prevent greenery clipping on both islands
  isValidSpawn(x, z) {
    // 1. Determine which island coordinates fall into
    const distToAgus = Math.sqrt(Math.pow(x - this.agusCenter.x, 2) + Math.pow(z - this.agusCenter.z, 2));
    const distToCesya = Math.sqrt(Math.pow(x - this.cesyaCenter.x, 2) + Math.pow(z - this.cesyaCenter.z, 2));

    // Agus's Island bounds (radius 14.5)
    if (distToAgus < 14.5) {
      // Avoid cottage center (local x:0, z:-3, world x:-15, z:-8)
      const distToCottage = Math.sqrt(Math.pow(x - (-15), 2) + Math.pow(z - (-8), 2));
      if (distToCottage < 4.2) return false;

      // Avoid Agus pathway Snaking
      // World pathway spans from x = -15 to x = -1 (where bridge starts)
      if (x > -15.5 && x < -1.0) {
        // Simple linear approximation of path
        const pathZ = -3.0 + (x - (-15)) / 14.0 * 5.0; 
        if (Math.abs(z - pathZ) < 1.4) return false;
      }
      return true;
    }

    // Cesya's Island bounds (radius 13.5)
    if (distToCesya < 13.5) {
      // Avoid Telescope Deck center (world x: 19, z: 1)
      const distToDeck = Math.sqrt(Math.pow(x - 19, 2) + Math.pow(z - 1, 2));
      if (distToDeck < 2.5) return false;

      // Avoid Cesya pathway Snaking
      // Pathway winds from bridge end (world x: 2, z: 3) to deck (world x: 19, z: 1)
      if (x > 2.0 && x < 19.5) {
        const pathZ = 3.0 - (x - 2.0) / 17.5 * 2.0;
        if (Math.abs(z - pathZ) < 1.4) return false;
      }
      return true;
    }

    return false; // falls in the cloud gap between islands
  }

  createGarden() {
    // --- 1. Instanced Swaying Grass on BOTH islands ---
    const grassCount = 6500;
    const grassGeo = new THREE.ConeGeometry(0.055, 0.55, 3);
    grassGeo.translate(0, 0.275, 0); // shift origin to base

    const grassMat = new THREE.MeshStandardMaterial({
      color: '#55823c',
      roughness: 0.85,
      shadowSide: THREE.DoubleSide
    });

    // Swaying shader
    grassMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.uniforms.uTime;
      shader.vertexShader = `
        uniform float uTime;
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
          #include <begin_vertex>
          float swayTime = uTime * 1.6;
          float sway = sin(swayTime + position.x * 2.5 + position.z * 2.5) * transformed.y * 0.13;
          sway += cos(swayTime * 0.4 + position.y * 3.5) * transformed.y * 0.05;
          transformed.x += sway;
          transformed.z += sway * 0.6;
        `
      );
    };

    this.grassMesh = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);
    this.grassMesh.castShadow = true;
    this.grassMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let grassIdx = 0;

    while (grassIdx < grassCount) {
      // Randomly pick one of the two island centers to seed coordinates
      const targetCenter = Math.random() < 0.55 ? this.agusCenter : this.cesyaCenter;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 14.0;
      const x = targetCenter.x + Math.cos(angle) * radius;
      const z = targetCenter.z + Math.sin(angle) * radius;

      if (this.isValidSpawn(x, z)) {
        // Base height: Agus island surface at y=3.0, Cesya surface at y=2.0 (relative top coordinate)
        const islandTopHeight = targetCenter === this.agusCenter ? 3.0 : 2.05;

        dummy.position.set(
          x + (Math.random() - 0.5) * 0.15,
          islandTopHeight,
          z + (Math.random() - 0.5) * 0.15
        );
        
        dummy.rotation.set(
          (Math.random() - 0.5) * 0.15,
          Math.random() * Math.PI,
          (Math.random() - 0.5) * 0.15
        );
        
        const scaleY = 0.7 + Math.random() * 0.55;
        const scaleXZ = 0.7 + Math.random() * 0.35;
        dummy.scale.set(scaleXZ, scaleY, scaleXZ);
        
        dummy.updateMatrix();
        this.grassMesh.setMatrixAt(grassIdx, dummy.matrix);

        // Mix grass colors (fresh green, tropical green, mossy gold)
        const col = new THREE.Color();
        const r = Math.random();
        if (r < 0.4) col.set('#6a9e4b');
        else if (r < 0.85) col.set('#456c31');
        else col.set('#a09e5a');
        
        this.grassMesh.setColorAt(grassIdx, col);
        grassIdx++;
      }
    }
    this.scene.add(this.grassMesh);

    // --- 2. Instanced Small Landscape Flowers ---
    const flowerCount = 450;
    const mergedGeo = this.createFlowerGeometry();
    
    const flowerMatPink = new THREE.MeshStandardMaterial({ color: '#ffa6c9', roughness: 0.8, shadowSide: THREE.DoubleSide });
    const flowerMatBlue = new THREE.MeshStandardMaterial({ color: '#7ad2f6', roughness: 0.8, shadowSide: THREE.DoubleSide });
    const flowerMatYellow = new THREE.MeshStandardMaterial({ color: '#ffe466', roughness: 0.8, shadowSide: THREE.DoubleSide });

    const applyFlowerWind = (mat) => {
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = this.uniforms.uTime;
        shader.vertexShader = `
          uniform float uTime;
        ` + shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `
            #include <begin_vertex>
            float swayTime = uTime * 1.3;
            float sway = sin(swayTime + position.x * 2.0 + position.z * 2.0) * transformed.y * 0.16;
            transformed.x += sway;
            transformed.z += sway * 0.5;
          `
        );
      };
    };

    applyFlowerWind(flowerMatPink);
    applyFlowerWind(flowerMatBlue);
    applyFlowerWind(flowerMatYellow);

    this.flowerMeshPink = new THREE.InstancedMesh(mergedGeo, flowerMatPink, flowerCount);
    this.flowerMeshBlue = new THREE.InstancedMesh(mergedGeo, flowerMatBlue, flowerCount);
    this.flowerMeshYellow = new THREE.InstancedMesh(mergedGeo, flowerMatYellow, flowerCount);

    this.flowerMeshPink.castShadow = true;
    this.flowerMeshBlue.castShadow = true;
    this.flowerMeshYellow.castShadow = true;

    this.populateFlowerInstances(this.flowerMeshPink, flowerCount, '#ffa6c9');
    this.populateFlowerInstances(this.flowerMeshBlue, flowerCount, '#7ad2f6');
    this.populateFlowerInstances(this.flowerMeshYellow, flowerCount, '#ffe466');

    this.scene.add(this.flowerMeshPink);
    this.scene.add(this.flowerMeshBlue);
    this.scene.add(this.flowerMeshYellow);
  }

  createFlowerGeometry() {
    const geometries = [];

    // Stem
    const stem = new THREE.CylinderGeometry(0.012, 0.012, 0.5, 4);
    stem.translate(0, 0.25, 0);
    geometries.push(stem);

    // Center disk
    const center = new THREE.SphereGeometry(0.045, 5, 5);
    center.translate(0, 0.5, 0);
    geometries.push(center);

    // 4 cross petals
    for (let i = 0; i < 4; i++) {
      const petal = new THREE.BoxGeometry(0.16, 0.025, 0.05);
      petal.translate(0.07, 0.5, 0);
      petal.rotateY((i * Math.PI) / 4);
      geometries.push(petal);
    }

    return this.mergeBufferGeometries(geometries);
  }

  mergeBufferGeometries(geometries) {
    let totalVertices = 0;
    let totalIndices = 0;

    geometries.forEach(geo => {
      totalVertices += geo.attributes.position.count;
      if (geo.index) totalIndices += geo.index.count;
    });

    const mergedGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(totalVertices * 3);
    const normals = new Float32Array(totalVertices * 3);
    const indices = [];

    let vertexOffset = 0;

    geometries.forEach(geo => {
      const posAttr = geo.attributes.position;
      const normAttr = geo.attributes.normal;

      for (let i = 0; i < posAttr.count; i++) {
        positions[(vertexOffset + i) * 3] = posAttr.getX(i);
        positions[(vertexOffset + i) * 3 + 1] = posAttr.getY(i);
        positions[(vertexOffset + i) * 3 + 2] = posAttr.getZ(i);

        if (normAttr) {
          normals[(vertexOffset + i) * 3] = normAttr.getX(i);
          normals[(vertexOffset + i) * 3 + 1] = normAttr.getY(i);
          normals[(vertexOffset + i) * 3 + 2] = normAttr.getZ(i);
        }
      }

      if (geo.index) {
        for (let i = 0; i < geo.index.count; i++) {
          indices.push(geo.index.getX(i) + vertexOffset);
        }
      } else {
        for (let i = 0; i < posAttr.count; i++) {
          indices.push(vertexOffset + i);
        }
      }

      vertexOffset += posAttr.count;
    });

    mergedGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    mergedGeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    mergedGeo.setIndex(indices);

    return mergedGeo;
  }

  populateFlowerInstances(instMesh, count, baseHex) {
    const dummy = new THREE.Object3D();
    const baseColor = new THREE.Color(baseHex);
    let idx = 0;

    while (idx < count) {
      const targetCenter = Math.random() < 0.5 ? this.agusCenter : this.cesyaCenter;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 13.5;
      const x = targetCenter.x + Math.cos(angle) * radius;
      const z = targetCenter.z + Math.sin(angle) * radius;

      if (this.isValidSpawn(x, z)) {
        const islandTopHeight = targetCenter === this.agusCenter ? 3.0 : 2.05;

        dummy.position.set(
          x + (Math.random() - 0.5) * 0.35,
          islandTopHeight,
          z + (Math.random() - 0.5) * 0.35
        );
        
        dummy.rotation.set(
          (Math.random() - 0.5) * 0.18,
          Math.random() * Math.PI,
          (Math.random() - 0.5) * 0.18
        );

        const h = 0.75 + Math.random() * 0.5;
        dummy.scale.set(h, h, h);

        dummy.updateMatrix();
        instMesh.setMatrixAt(idx, dummy.matrix);

        const varColor = baseColor.clone();
        varColor.offsetHSL(
          (Math.random() - 0.5) * 0.04,
          (Math.random() - 0.5) * 0.08,
          (Math.random() - 0.5) * 0.08
        );
        instMesh.setColorAt(idx, varColor);

        idx++;
      }
    }
  }

  // --- 3. THE 7 DYNAMIC MONTHLY GLOWING TIMELINE FLOWERS ---
  // Coordinates are chosen to distribute them nicely on both islands
  createMonthlyTimelineFlowers() {
    const flowerConfigs = [
      // 1. Dec 2025 - Spark (Agus's Island near Cottage door)
      { id: 0, x: -16.0, y: 3.02, z: -0.2, color: '#ff3366', name: 'spark' },
      // 2. Jan 2026 - Call (Agus's Island near front path)
      { id: 1, x: -13.0, y: 3.02, z: 1.2, color: '#ff66cc', name: 'first-anniversary' },
      // 3. Feb 2026 - Valentine (Agus's Island cozy back corner)
      { id: 2, x: -20.0, y: 3.02, z: -5.0, color: '#ffcc00', name: 'valentine' },
      // 4. Mar 2026 - Trust (Cesya's Island near bridge landing)
      { id: 3, x: 12.0, y: 2.07, z: 2.8, color: '#ff6600', name: 'ldr-growing' },
      // 5. Apr 2026 - Future Talks (Cesya's Island near telescope)
      { id: 4, x: 17.5, y: 2.07, z: 2.5, color: '#33ccff', name: 'future-talks' },
      // 6. May 2026 - Plans (Cesya's Island path corner)
      { id: 5, x: 14.5, y: 2.07, z: -1.5, color: '#cc33ff', name: 'plans-shared' },
      // 7. Jun 2026 - Today (Cesya's Island edge looking at bridge gap)
      { id: 6, x: 9.8, y: 2.07, z: 5.5, color: '#33ffaa', name: 'today-reality' }
    ];

    flowerConfigs.forEach(cfg => {
      const flowerGroup = new THREE.Group();
      flowerGroup.name = `monthly-flower-${cfg.id}`;
      flowerGroup.position.set(cfg.x, cfg.y, cfg.z);
      flowerGroup.userData = { flowerId: cfg.id };

      // Thick curved stem
      const stemPoints = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.05, 0.3, -0.05),
        new THREE.Vector3(0.12, 0.6, 0.05)
      ];
      const stemCurve = new THREE.CatmullRomCurve3(stemPoints);
      const stemGeo = new THREE.TubeGeometry(stemCurve, 12, 0.04, 6, false);
      const stemMat = new THREE.MeshStandardMaterial({ color: '#3f632d', roughness: 0.9 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.castShadow = true;
      flowerGroup.add(stem);

      // Large beautiful rose/tulip blossom petals
      const petalMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.65,
        side: THREE.DoubleSide
      });

      // Spawn 6 stylized overlapping blossom petal scales
      for (let i = 0; i < 6; i++) {
        const petalGeo = new THREE.SphereGeometry(0.18, 8, 8, 0, Math.PI * 1.3);
        petalGeo.translate(0, 0.12, 0);
        
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.position.set(0.12, 0.6, 0.05);
        petal.rotation.x = 0.35;
        petal.rotation.y = (i * Math.PI * 2) / 6;
        petal.rotation.z = 0.45;
        
        petal.castShadow = true;
        flowerGroup.add(petal);
      }

      // Glowing heart core sphere (shines bright under bloom postprocessing)
      const coreGeo = new THREE.SphereGeometry(0.1, 8, 8);
      const coreMat = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: cfg.color,
        emissiveIntensity: 2.2, // bright glow
        roughness: 0.1
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.set(0.12, 0.68, 0.05);
      flowerGroup.add(core);

      // Small floating particle light
      const pointLight = new THREE.PointLight(cfg.color, 0.8, 4, 1.8);
      pointLight.position.set(0.12, 0.88, 0.05);
      flowerGroup.add(pointLight);

      // Continuous floating animation
      gsap.to(flowerGroup.position, {
        y: cfg.y + 0.12,
        duration: 1.5 + Math.random() * 0.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

      this.scene.add(flowerGroup);
      this.monthlyFlowerMeshes.push(flowerGroup);

      // Add a small 2D text overlay name that appears when hovering
      const label = document.createElement('div');
      label.className = 'glowing-node-label';
      label.id = `label-flower-${cfg.id}`;
      label.innerText = `Flower ${cfg.id + 1}`; // e.g. Flower 1
      document.body.appendChild(label);
      flowerGroup.userData.htmlLabel = label;
    });
  }

  update(time) {
    this.uniforms.uTime.value = time;
  }
}
