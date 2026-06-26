import * as THREE from 'three';

export class FlowerGarden {
  constructor(scene) {
    this.scene = scene;
    
    this.grassMesh = null;
    this.flowerMeshPink = null;
    this.flowerMeshBlue = null;
    this.flowerMeshYellow = null;
    
    this.uniforms = {
      uTime: { value: 0 }
    };

    this.createGarden();
  }

  // Check if coordinates clip into cottage, path, or river
  isValidSpawn(x, z) {
    // 1. Cottage boundaries (radius 4.8 around origin)
    const distToCottage = Math.sqrt(x*x + z*z);
    if (distToCottage < 4.8) return false;

    // 2. Out of island boundary (radius 20)
    if (distToCottage > 19.5) return false;

    // 3. Close to snaking pathway
    // Path extends from z = 2.8 to z = 18.8
    if (z > 2.5 && z < 19.5) {
      const t = (z - 2.8) / 16.0;
      const pathX = Math.sin(t * Math.PI * 1.5) * 1.5 - 0.5;
      if (Math.abs(x - pathX) < 1.5) return false;
    }

    // 4. Close to snaking river
    // River winds from z = -25 to z = 25
    const rt = (z + 25) / 50;
    const riverX = Math.sin(rt * Math.PI * 2.5) * 3.5 - 6;
    if (Math.abs(x - riverX) < 2.8) return false;

    return true;
  }

  createGarden() {
    // --- 1. Swaving Instanced Grass ---
    const grassCount = 5500;
    // 3-sided cone is extremely fast to render in bulk
    const grassGeo = new THREE.ConeGeometry(0.06, 0.55, 3);
    grassGeo.translate(0, 0.275, 0); // Translate origin to base for proper scaling

    // Material with custom vertex shader modification for wind swaying
    const grassMat = new THREE.MeshStandardMaterial({
      color: '#557a46',
      roughness: 0.85,
      shadowSide: THREE.DoubleSide
    });

    // inject wind shader logic
    grassMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.uniforms.uTime;
      shader.vertexShader = `
        uniform float uTime;
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
          #include <begin_vertex>
          // Sway amount based on height (transformed.y) and dynamic sine waves
          float swayTime = uTime * 1.8;
          float sway = sin(swayTime + position.x * 3.0 + position.z * 3.0) * transformed.y * 0.12;
          sway += cos(swayTime * 0.5 + position.y * 4.0) * transformed.y * 0.04;
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

    // Distribute grass randomly on the island surface
    while (grassIdx < grassCount) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 19.5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      if (this.isValidSpawn(x, z)) {
        dummy.position.set(
          x + (Math.random() - 0.5) * 0.2,
          4.0, // base grass height sitting on island surface
          z + (Math.random() - 0.5) * 0.2
        );
        
        dummy.rotation.set(
          (Math.random() - 0.5) * 0.15,
          Math.random() * Math.PI,
          (Math.random() - 0.5) * 0.15
        );
        
        // Random scale (height variations)
        const scaleY = 0.7 + Math.random() * 0.6;
        const scaleXZ = 0.7 + Math.random() * 0.4;
        dummy.scale.set(scaleXZ, scaleY, scaleXZ);
        
        dummy.updateMatrix();
        this.grassMesh.setMatrixAt(grassIdx, dummy.matrix);

        // Mix grass colors (light green, dark green, warm yellow)
        const col = new THREE.Color();
        const r = Math.random();
        if (r < 0.4) col.set('#7a9d54');      // bright grass green
        else if (r < 0.85) col.set('#4f783c'); // deep forest green
        else col.set('#b0ab60');              // warm yellow/cream tint
        
        this.grassMesh.setColorAt(grassIdx, col);
        grassIdx++;
      }
    }
    this.scene.add(this.grassMesh);

    // --- 2. Instanced Flower Fields ---
    // Simple geometry representing a flower: a stem and 4 intersecting cross-planes for petals
    const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 4);
    stemGeo.translate(0, 0.2, 0);

    const petalGeo = new THREE.BoxGeometry(0.16, 0.08, 0.16);
    petalGeo.translate(0, 0.4, 0);

    // Merge stem and petal geometries to create a single flower mesh
    // In newer Three.js versions, BufferGeometryUtils is used, but we can also just create 
    // separate instanced meshes or nest them. Separate instanced meshes for 
    // flower colors is clean, fast, and highly editable.
    // Let's create a single flower group/mesh:
    const flowerGeo = new THREE.Group();
    
    // Stem
    const stem = new THREE.Mesh(stemGeo, new THREE.MeshStandardMaterial({ color: '#4f783c', roughness: 0.9 }));
    flowerGeo.add(stem);
    
    // Blossom center
    const centerGeo = new THREE.SphereGeometry(0.06, 5, 5);
    centerGeo.translate(0, 0.42, 0);
    const center = new THREE.Mesh(centerGeo, new THREE.MeshStandardMaterial({ color: '#ffcc00', roughness: 0.9 }));
    flowerGeo.add(center);

    // Petals
    const p1 = new THREE.Mesh(petalGeo, new THREE.MeshStandardMaterial({ color: '#ffffff' }));
    flowerGeo.add(p1);

    // Let's generate instanced meshes for Pink, Blue, and Yellow flowers
    const flowerCount = 600; // 600 of each color
    
    const flowerMatPink = new THREE.MeshStandardMaterial({ color: '#ff94b8', roughness: 0.8, shadowSide: THREE.DoubleSide });
    const flowerMatBlue = new THREE.MeshStandardMaterial({ color: '#7bc8f6', roughness: 0.8, shadowSide: THREE.DoubleSide });
    const flowerMatYellow = new THREE.MeshStandardMaterial({ color: '#ffdf4d', roughness: 0.8, shadowSide: THREE.DoubleSide });

    // Sway animation modifier for flower meshes
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
            // Sway flowers slightly slower and wider than grass
            float swayTime = uTime * 1.4;
            float sway = sin(swayTime + position.x * 2.0 + position.z * 2.0) * transformed.y * 0.18;
            transformed.x += sway;
            transformed.z += sway * 0.5;
          `
        );
      };
    };

    applyFlowerWind(flowerMatPink);
    applyFlowerWind(flowerMatBlue);
    applyFlowerWind(flowerMatYellow);

    // Combine stem/blossom into a single instanced mesh using simple merged geometry
    // To make it easy and bulletproof, we will define a simple merged geometry.
    // Let's merge standard geometries manually by using basic geometry attributes
    const mergedGeo = this.createFlowerGeometry();

    this.flowerMeshPink = new THREE.InstancedMesh(mergedGeo, flowerMatPink, flowerCount);
    this.flowerMeshBlue = new THREE.InstancedMesh(mergedGeo, flowerMatBlue, flowerCount);
    this.flowerMeshYellow = new THREE.InstancedMesh(mergedGeo, flowerMatYellow, flowerCount);

    this.flowerMeshPink.castShadow = true;
    this.flowerMeshBlue.castShadow = true;
    this.flowerMeshYellow.castShadow = true;

    this.populateFlowerInstances(this.flowerMeshPink, flowerCount, '#ff8da9');
    this.populateFlowerInstances(this.flowerMeshBlue, flowerCount, '#6dbdf2');
    this.populateFlowerInstances(this.flowerMeshYellow, flowerCount, '#ffe566');

    this.scene.add(this.flowerMeshPink);
    this.scene.add(this.flowerMeshBlue);
    this.scene.add(this.flowerMeshYellow);
  }

  // Create a stylized 3D flower geometry (stems + petals merged)
  createFlowerGeometry() {
    const geometries = [];

    // 1. Stem (Thin cylinder)
    const stem = new THREE.CylinderGeometry(0.015, 0.015, 0.5, 4);
    stem.translate(0, 0.25, 0);
    geometries.push(stem);

    // 2. Flower Center (Yellow disk/sphere)
    const center = new THREE.SphereGeometry(0.05, 5, 5);
    center.translate(0, 0.5, 0);
    geometries.push(center);

    // 3. Petals (4 cross planes)
    for (let i = 0; i < 4; i++) {
      const petal = new THREE.BoxGeometry(0.18, 0.03, 0.06);
      petal.translate(0.08, 0.5, 0);
      petal.rotateY((i * Math.PI) / 4);
      geometries.push(petal);
    }

    // Merge geometries
    // We can merge buffers manually to avoid external loaders
    const mergedGeometry = this.mergeBufferGeometries(geometries);
    return mergedGeometry;
  }

  // Simple buffer geometry merger to avoid importing BufferGeometryUtils
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
    let indexOffset = 0;

    geometries.forEach(geo => {
      const posAttr = geo.attributes.position;
      const normAttr = geo.attributes.normal;

      // Copy vertices and normals
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

      // Copy indices
      if (geo.index) {
        for (let i = 0; i < geo.index.count; i++) {
          indices.push(geo.index.getX(i) + vertexOffset);
        }
      } else {
        // Generate non-indexed indices
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
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 19.5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      if (this.isValidSpawn(x, z)) {
        dummy.position.set(
          x + (Math.random() - 0.5) * 0.4,
          3.95, // flower stem base on surface
          z + (Math.random() - 0.5) * 0.4
        );
        
        dummy.rotation.set(
          (Math.random() - 0.5) * 0.2,
          Math.random() * Math.PI,
          (Math.random() - 0.5) * 0.2
        );

        // Flowers random heights
        const h = 0.8 + Math.random() * 0.5;
        dummy.scale.set(h, h, h);

        dummy.updateMatrix();
        instMesh.setMatrixAt(idx, dummy.matrix);

        // Add subtle color variance to flowers of same group
        const variationColor = baseColor.clone();
        variationColor.offsetHSL(
          (Math.random() - 0.5) * 0.05, // minor hue shift
          (Math.random() - 0.5) * 0.1,  // minor saturation shift
          (Math.random() - 0.5) * 0.1   // minor lightness shift
        );
        instMesh.setColorAt(idx, variationColor);

        idx++;
      }
    }
  }

  update(time) {
    this.uniforms.uTime.value = time;
  }
}
