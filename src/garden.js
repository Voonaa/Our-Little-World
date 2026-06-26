import * as THREE from 'three';
import { gsap } from 'gsap';

export class FlowerGarden {
  constructor(scene) {
    this.scene = scene;
    
    this.grassMesh = null;
    this.flowerMeshPink = null;
    this.flowerMeshBlue = null;
    this.flowerMeshYellow = null;
    
    this.monthlyFlowerMeshes = [];
    
    this.uniforms = {
      uTime: { value: 0 },
      uGrowth: { value: 0 } // Growth wave uniform (GPU-based grass & landscape flowers)
    };

    this.agusCenter = new THREE.Vector3(-15, 0, -5);
    this.cesyaCenter = new THREE.Vector3(15, 0.8, 5);

    this.createGarden();
    this.createMonthlyTimelineFlowers();
  }

  isValidSpawn(x, z) {
    const distToAgus = Math.sqrt(Math.pow(x - this.agusCenter.x, 2) + Math.pow(z - this.agusCenter.z, 2));
    const distToCesya = Math.sqrt(Math.pow(x - this.cesyaCenter.x, 2) + Math.pow(z - this.cesyaCenter.z, 2));

    if (distToAgus < 14.5) {
      const distToCottage = Math.sqrt(Math.pow(x - (-15), 2) + Math.pow(z - (-8), 2));
      if (distToCottage < 4.2) return false;

      if (x > -15.5 && x < -1.0) {
        const pathZ = -3.0 + (x - (-15)) / 14.0 * 5.0; 
        if (Math.abs(z - pathZ) < 1.4) return false;
      }
      return true;
    }

    if (distToCesya < 13.5) {
      const distToDeck = Math.sqrt(Math.pow(x - 19, 2) + Math.pow(z - 1, 2));
      if (distToDeck < 2.5) return false;

      if (x > 2.0 && x < 19.5) {
        const pathZ = 3.0 - (x - 2.0) / 17.5 * 2.0;
        if (Math.abs(z - pathZ) < 1.4) return false;
      }
      return true;
    }

    return false;
  }

  createGarden() {
    const grassCount = 6500;
    const grassGeo = new THREE.ConeGeometry(0.055, 0.55, 3);
    grassGeo.translate(0, 0.275, 0); // origin to base

    const grassMat = new THREE.MeshStandardMaterial({
      color: '#55823c',
      roughness: 0.85,
      shadowSide: THREE.DoubleSide
    });

    grassMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.uniforms.uTime;
      shader.uniforms.uGrowth = this.uniforms.uGrowth;
      shader.vertexShader = `
        uniform float uTime;
        uniform float uGrowth;
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
          
          // GPU Growth wave scaling height from 0 to 1
          transformed.xyz *= uGrowth;
        `
      );
    };

    this.grassMesh = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);
    this.grassMesh.castShadow = true;
    this.grassMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let grassIdx = 0;

    while (grassIdx < grassCount) {
      const targetCenter = Math.random() < 0.55 ? this.agusCenter : this.cesyaCenter;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 14.0;
      const x = targetCenter.x + Math.cos(angle) * radius;
      const z = targetCenter.z + Math.sin(angle) * radius;

      if (this.isValidSpawn(x, z)) {
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
        shader.uniforms.uGrowth = this.uniforms.uGrowth;
        shader.vertexShader = `
          uniform float uTime;
          uniform float uGrowth;
        ` + shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `
            #include <begin_vertex>
            float swayTime = uTime * 1.3;
            float sway = sin(swayTime + position.x * 2.0 + position.z * 2.0) * transformed.y * 0.16;
            transformed.x += sway;
            transformed.z += sway * 0.5;
            
            // GPU Growth wave scaling from 0 to 1
            transformed.xyz *= uGrowth;
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

    const stem = new THREE.CylinderGeometry(0.015, 0.015, 0.5, 4);
    stem.translate(0, 0.25, 0);
    geometries.push(stem);

    const center = new THREE.SphereGeometry(0.045, 5, 5);
    center.translate(0, 0.5, 0);
    geometries.push(center);

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

  createMonthlyTimelineFlowers() {
    const flowerConfigs = [
      { id: 0, x: -16.0, y: 3.02, z: -0.2, color: '#ff3366' },
      { id: 1, x: -13.0, y: 3.02, z: 1.2, color: '#ff66cc' },
      { id: 2, x: -20.0, y: 3.02, z: -5.0, color: '#ffcc00' },
      { id: 3, x: 12.0, y: 2.07, z: 2.8, color: '#ff6600' },
      { id: 4, x: 17.5, y: 2.07, z: 2.5, color: '#33ccff' },
      { id: 5, x: 14.5, y: 2.07, z: -1.5, color: '#cc33ff' },
      { id: 6, x: 9.8, y: 2.07, z: 5.5, color: '#33ffaa' }
    ];

    flowerConfigs.forEach(cfg => {
      const flowerGroup = new THREE.Group();
      flowerGroup.name = `monthly-flower-${cfg.id}`;
      flowerGroup.position.set(cfg.x, cfg.y, cfg.z);
      flowerGroup.userData = { flowerId: cfg.id };
      
      // Growth initial scale
      flowerGroup.scale.set(0.0001, 0.0001, 0.0001);

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

      const petalMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.65,
        side: THREE.DoubleSide
      });

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

      const coreGeo = new THREE.SphereGeometry(0.1, 8, 8);
      const coreMat = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: cfg.color,
        emissiveIntensity: 2.2,
        roughness: 0.1
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.set(0.12, 0.68, 0.05);
      flowerGroup.add(core);

      const pointLight = new THREE.PointLight(cfg.color, 0.8, 4, 1.8);
      pointLight.position.set(0.12, 0.88, 0.05);
      flowerGroup.add(pointLight);

      this.scene.add(flowerGroup);
      this.monthlyFlowerMeshes.push(flowerGroup);

      const label = document.createElement('div');
      label.className = 'glowing-node-label';
      label.id = `label-flower-${cfg.id}`;
      label.innerText = `Flower ${cfg.id + 1}`;
      document.body.appendChild(label);
      flowerGroup.userData.htmlLabel = label;
    });
  }

  update(time) {
    this.uniforms.uTime.value = time;
  }
}
