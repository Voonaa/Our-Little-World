import * as THREE from 'three';
import { gsap } from 'gsap';
import { audioInstance } from './audio.js';

export class UIManager {
  constructor(sceneManager, lightingManager, particlesManager) {
    this.sm = sceneManager;
    this.lm = lightingManager;
    this.pm = particlesManager;

    this.musicToggle = document.getElementById('music-toggle');
    this.splashScreen = document.getElementById('splash-screen');
    this.startBtn = document.getElementById('start-btn');
    this.loadingText = document.getElementById('loading-text');
    this.loadingBar = document.getElementById('loading-bar');
    this.hud = document.getElementById('hud');
    
    this.memoryOverlay = document.getElementById('memory-overlay');
    this.closeMemoryBtn = document.getElementById('close-memory-btn');
    this.memoryTitle = document.getElementById('memory-title');
    this.memoryDate = document.getElementById('memory-date');
    this.memoryDescription = document.getElementById('memory-description');
    this.illustrationContainer = document.getElementById('polaroid-illustration');

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredNode = null;

    // Define 4 interactive memories
    this.memories = [
      {
        id: 0,
        title: "First Day We Met",
        date: "June 26, 2024",
        desc: "Under the shade of the old willow, we talked for hours about everything and nothing. It felt like time stood still, and the rest of the world just faded away.",
        pos: { x: -3.5, y: 4.8, z: 12.0 }, // near the bridge
        color: '#ff94b8', // Pink
        illustrate: (ctx, w, h) => this.drawMeetIllustration(ctx, w, h)
      },
      {
        id: 1,
        title: "Sunset Promises",
        date: "September 15, 2024",
        desc: "Watching the sun slide beneath the clouds. We promised each other that no matter where our lives drifted, we would always build a home in each other's hearts.",
        pos: { x: 12.0, y: 4.8, z: 7.0 }, // edge of island
        color: '#ffb84d', // Orange
        illustrate: (ctx, w, h) => this.drawSunsetIllustration(ctx, w, h)
      },
      {
        id: 2,
        title: "Cozy Hearth Nights",
        date: "December 24, 2024",
        desc: "Warm tea, a crackling fire, and a soft knitted blanket. The storms outside couldn't touch the warmth we built together in our little corner of the universe.",
        pos: { x: 0.0, y: 4.8, z: 3.5 }, // cottage porch
        color: '#ffdf4d', // Yellow
        illustrate: (ctx, w, h) => this.drawHearthIllustration(ctx, w, h)
      },
      {
        id: 3,
        title: "Under The Stars",
        date: "April 18, 2025",
        desc: "Laying on the grass, naming the constellations we invented ourselves. You said my smile was brighter than the Milky Way. I believed you.",
        pos: { x: -10.0, y: 7.2, z: -8.0 }, // high cliff back tree
        color: '#7bc8f6', // Blue
        illustrate: (ctx, w, h) => this.drawStarsIllustration(ctx, w, h)
      }
    ];

    this.memoryOrbs = [];
    this.discoveredCount = 0;
    this.discoveredIds = new Set();
    this.isCinematicActive = false;

    this.init();
  }

  init() {
    this.createMemoryOrbsIn3D();
    this.bindEvents();
    this.simulateLoading();
  }

  createMemoryOrbsIn3D() {
    this.memories.forEach(mem => {
      // Group containing a glowing core and a larger soft halo
      const orbGroup = new THREE.Group();
      orbGroup.position.set(mem.pos.x, mem.pos.y, mem.pos.z);
      orbGroup.userData = { memoryId: mem.id };

      // Core sphere
      const coreGeo = new THREE.SphereGeometry(0.24, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({
        color: mem.color,
        transparent: true,
        opacity: 0.9
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      orbGroup.add(core);

      // Soft outer glowing halo
      const haloGeo = new THREE.SphereGeometry(0.48, 16, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: mem.color,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      orbGroup.add(halo);

      // Animate halo scale continuously
      gsap.to(halo.scale, {
        x: 1.4, y: 1.4, z: 1.4,
        duration: 1.5 + Math.random(),
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

      this.sm.scene.add(orbGroup);
      this.memoryOrbs.push(orbGroup);

      // Create an HTML 2D Label that pops up on hover
      const label = document.createElement('div');
      label.className = 'glowing-node-label';
      label.id = `label-node-${mem.id}`;
      label.innerText = mem.title;
      document.body.appendChild(label);
      orbGroup.userData.htmlLabel = label;
    });
  }

  bindEvents() {
    // Start button clicks
    this.startBtn.addEventListener('click', () => this.enterWorld());

    // Music toggling
    this.musicToggle.addEventListener('click', () => {
      const isMuted = audioInstance.toggle();
      if (isMuted) {
        this.musicToggle.classList.add('muted');
      } else {
        this.musicToggle.classList.remove('muted');
      }
    });

    // Time of day selectors
    const timeButtons = document.querySelectorAll('.time-btn');
    timeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        timeButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const theme = e.target.getAttribute('data-time');
        
        // Trigger smooth light transition
        this.lm.transitionTo(theme);
        // Trigger window intensity change
        this.sm.scene.traverse(node => {
          if (node.name === 'cozy-cottage' || node.type === 'Group') {
            // Checked inside island.js updateWindowIntensity
          }
        });
        
        // Directly invoke window intensity updating from island
        const island = this.sm.scene.children.find(c => c.type === 'Group');
        if (island) {
          // Trigger the update window emissive levels
          // The island class instances aren't direct children, but the material is shared
        }
        
        // Explicitly update objects in scene
        this.pm.updateEnvironmentLights(theme);
        
        // We also want to manually update the window emissive levels in island.js
        this.sm.scene.traverse(child => {
          if (child.material && child.material.emissive && child.material.emissiveIntensity !== undefined) {
            let targetIntensity = 0.5;
            if (theme === 'day') targetIntensity = 0.0;
            else if (theme === 'dusk') targetIntensity = 2.0;
            else if (theme === 'night') targetIntensity = 3.5;
            
            gsap.to(child.material, {
              emissiveIntensity: targetIntensity,
              duration: 2.5,
              ease: 'power2.out'
            });
          }
        });
      });
    });

    // Polaroid close button
    this.closeMemoryBtn.addEventListener('click', () => {
      this.memoryOverlay.classList.add('hidden');
      
      // Release camera target and resume OrbitControls
      this.sm.controls.enabled = true;
      gsap.to(this.sm.controls.target, { x: 0, y: 5, z: 0, duration: 1.5, ease: 'power2.out' });
      
      // Reset cinematic bars
      document.body.classList.remove('cinematic');
    });

    // 3D Raycasting interactions (Mouse moves and clicks)
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('click', (e) => this.onMouseClick(e));
    window.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: true });
  }

  simulateLoading() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 12) + 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Show start button, hide loading bar
        this.loadingBar.style.width = '100%';
        this.loadingText.innerText = 'World is Ready';
        
        gsap.to(this.loadingBar.parentElement, { opacity: 0, height: 0, duration: 0.5, delay: 0.3 });
        gsap.to(this.loadingText, { opacity: 0, duration: 0.5, delay: 0.3, onComplete: () => {
          this.startBtn.classList.remove('hidden');
          gsap.fromTo(this.startBtn, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' });
        }});
      } else {
        this.loadingBar.style.width = `${progress}%`;
        this.loadingText.innerText = `Preparing the world... ${progress}%`;
      }
    }, 150);
  }

  enterWorld() {
    // 1. Play music
    audioInstance.start();
    this.musicToggle.classList.remove('muted');

    // 2. Hide Splash Screen
    this.splashScreen.classList.add('fade-out');

    // 3. Trigger Cinematic Camera path
    this.playCinematicIntro();
  }

  playCinematicIntro() {
    this.isCinematicActive = true;
    document.body.classList.add('cinematic'); // slide in cinematic black bars

    // GSAP Timeline to sweep the camera downwards and around the cottage
    const tl = gsap.timeline({
      onComplete: () => {
        // Intro complete: enable manual OrbitControls
        this.isCinematicActive = false;
        this.sm.controls.enabled = true;
        document.body.classList.remove('cinematic'); // slide out black bars
        
        // Fade in HUD controls
        this.hud.classList.remove('hidden');
        this.hud.classList.add('fade-in');
      }
    });

    // Subtitles to print during camera movement
    const captions = document.getElementById('captions');
    const subtitleTimeline = gsap.timeline();

    const playSubtitle = (text, delay, duration) => {
      subtitleTimeline.to(captions, {
        opacity: 0,
        duration: 0.4,
        onComplete: () => {
          captions.innerText = text;
        }
      }, delay)
      .to(captions, { opacity: 1, duration: 0.6 })
      .to(captions, { opacity: 0, duration: 0.5 }, `+=${duration}`);
    };

    // Trigger subtitles sequentially
    playSubtitle("At the edge of the sky, a sanctuary floats...", 1.0, 3.5);
    playSubtitle("...built from shared memories and whispered promises.", 6.0, 3.5);
    playSubtitle("Explore the glowing orbs to uncover our little moments.", 11.5, 4.0);

    // Cinematic Camera Paths:
    // Move from high dawn sky (0, 120, 150) down and rotate closer
    tl.to(this.sm.camera.position, {
      x: -28,
      y: 15,
      z: 32,
      duration: 7.0,
      ease: 'power2.inOut'
    })
    // Sweeps behind the cottage
    .to(this.sm.camera.position, {
      x: 18,
      y: 8,
      z: 22,
      duration: 5.5,
      ease: 'sine.inOut'
    })
    // Settle at the front of the bridge and pathway looking at the door
    .to(this.sm.camera.position, {
      x: -5,
      y: 7.5,
      z: 23,
      duration: 4.5,
      ease: 'power1.inOut'
    });

    // Animate target focus to cottage door
    tl.to(this.sm.controls.target, {
      x: 0,
      y: 4.5,
      z: 3.0,
      duration: 17.0,
      ease: 'sine.inOut'
    }, 0);
  }

  // Raycast logic: project mouse coordinate to 3D nodes
  updateRaycast() {
    if (this.isCinematicActive || !this.sm.controls.enabled) return;

    this.raycaster.setFromCamera(this.mouse, this.sm.camera);
    const intersects = this.raycaster.intersectObjects(this.memoryOrbs, true);

    if (intersects.length > 0) {
      // Find the group containing the userData
      let obj = intersects[0].object;
      while (obj.parent && !obj.userData.memoryId !== undefined && obj.userData.memoryId === undefined) {
        obj = obj.parent;
      }

      if (this.hoveredNode !== obj) {
        // Out previous
        if (this.hoveredNode) {
          this.hoveredNode.scale.set(1.0, 1.0, 1.0);
          this.hoveredNode.userData.htmlLabel.classList.remove('visible');
        }

        // In new
        this.hoveredNode = obj;
        document.body.style.cursor = 'pointer';
        
        // Pulse animation on hover
        gsap.to(this.hoveredNode.scale, { x: 1.35, y: 1.35, z: 1.35, duration: 0.3, ease: 'back.out(2)' });
        this.hoveredNode.userData.htmlLabel.classList.add('visible');
      }

      // Update HTML label coordinates based on 3D node projections
      if (this.hoveredNode) {
        const wp = new THREE.Vector3();
        this.hoveredNode.getWorldPosition(wp);
        wp.project(this.sm.camera);

        const labelX = (wp.x * .5 + .5) * window.innerWidth;
        const labelY = (-(wp.y * .5) + .5) * window.innerHeight;
        
        const labelEl = this.hoveredNode.userData.htmlLabel;
        labelEl.style.left = `${labelX}px`;
        labelEl.style.top = `${labelY}px`;
      }
    } else {
      if (this.hoveredNode) {
        gsap.to(this.hoveredNode.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.3 });
        this.hoveredNode.userData.htmlLabel.classList.remove('visible');
        this.hoveredNode = null;
        document.body.style.cursor = 'default';
      }
    }
  }

  onMouseMove(e) {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  onTouchStart(e) {
    if (e.touches.length > 0) {
      this.mouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
      // Triggers raycast check immediately
      setTimeout(() => this.onMouseClick(e), 50);
    }
  }

  onMouseClick(e) {
    if (this.isCinematicActive || !this.sm.controls.enabled || !this.hoveredNode) return;

    const memId = this.hoveredNode.userData.memoryId;
    const mem = this.memories.find(m => m.id === memId);
    if (!mem) return;

    // Trigger Polaroid details card overlay
    this.showMemoryPolaroid(mem);
  }

  showMemoryPolaroid(mem) {
    // 1. Mark as Discovered
    if (!this.discoveredIds.has(mem.id)) {
      this.discoveredIds.add(mem.id);
      this.discoveredCount++;
      
      // Update tracker HUD
      const progressPercent = (this.discoveredCount / this.memories.length) * 100;
      document.getElementById('tracker-fill').style.width = `${progressPercent}%`;
      document.getElementById('tracker-text').innerText = `${this.discoveredCount} / ${this.memories.length}`;
    }

    // 2. Center camera view on node position smoothly
    this.sm.controls.enabled = false; // Lock controls during inspection
    document.body.classList.add('cinematic'); // slide in cinematic bars for focus

    // GSAP animate camera focus
    const targetCamPos = new THREE.Vector3()
      .copy(this.hoveredNode.position)
      .add(new THREE.Vector3(
        (this.sm.camera.position.x - this.hoveredNode.position.x) * 0.45,
        2.5,
        (this.sm.camera.position.z - this.hoveredNode.position.z) * 0.45
      ));

    gsap.to(this.sm.camera.position, {
      x: targetCamPos.x,
      y: targetCamPos.y,
      z: targetCamPos.z,
      duration: 1.5,
      ease: 'power2.inOut'
    });

    gsap.to(this.sm.controls.target, {
      x: this.hoveredNode.position.x,
      y: this.hoveredNode.position.y,
      z: this.hoveredNode.position.z,
      duration: 1.5,
      ease: 'power2.inOut',
      onComplete: () => {
        // Open card details
        this.memoryTitle.innerText = mem.title;
        this.memoryDate.innerText = mem.date;
        this.memoryDescription.innerText = mem.desc;

        // Render dynamic canvas watercolor illustration inside polaroid
        this.renderWatercolorIllustration(mem);

        this.memoryOverlay.classList.remove('hidden');
      }
    });
  }

  // Draws dynamic watercolor paint inside Polaroid frame
  renderWatercolorIllustration(mem) {
    // Create/reuse canvas illustration element
    let canvas = this.illustrationContainer.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      this.illustrationContainer.innerHTML = '';
      this.illustrationContainer.appendChild(canvas);
    }
    
    const w = 320;
    const h = 260;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // Run specific painting logic
    mem.illustrate(ctx, w, h);
  }

  // --- Dynamic Watercolor illustration drawings ---

  // Memory 1: Watercolor Blooming Cherry Blossom
  drawMeetIllustration(ctx, w, h) {
    // Base sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#fff0f3');
    grad.addColorStop(1, '#ffe3e8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw splatters
    this.drawWatercolorSplatter(ctx, w/2 - 20, h/2 + 20, 50, '#ffb3c6');
    this.drawWatercolorSplatter(ctx, w/2 + 30, h/2 - 30, 40, '#ff85a2');

    // Tree branch silhouette
    ctx.strokeStyle = '#4a2c2a';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.quadraticCurveTo(w/3, h - 30, w/2 - 20, h/2 + 20);
    ctx.quadraticCurveTo(w/2 + 10, h/2 - 10, w - 40, h/2 - 40);
    ctx.stroke();

    // Secondary twigs
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w/3, h - 20);
    ctx.quadraticCurveTo(w/4, h/2 + 20, w/3 - 10, h/2);
    ctx.moveTo(w/2 - 10, h/2 + 10);
    ctx.quadraticCurveTo(w/2, h/2 - 40, w/2 + 40, h/2 - 60);
    ctx.stroke();

    // Overlay soft watercolor petals
    for (let i = 0; i < 25; i++) {
      const px = w/3 + Math.random() * (w * 0.6);
      const py = h/3 + Math.random() * (h * 0.5);
      const r = 4 + Math.random() * 8;
      
      ctx.fillStyle = Math.random() < 0.6 ? '#ffb3c6' : '#ff85a2';
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Memory 2: Sunset Silhouettes
  drawSunsetIllustration(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#ff7e5f');
    grad.addColorStop(0.5, '#feb47b');
    grad.addColorStop(1, '#ffebd6');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Watercolor clouds
    this.drawWatercolorSplatter(ctx, w/4, h/2 - 10, 45, 'rgba(255, 255, 255, 0.4)');
    this.drawWatercolorSplatter(ctx, w * 0.7, h/3, 55, 'rgba(255, 230, 240, 0.35)');

    // Glowing sun disk
    const sunGrad = ctx.createRadialGradient(w/2, h/2 + 10, 0, w/2, h/2 + 10, 30);
    sunGrad.addColorStop(0, '#fff');
    sunGrad.addColorStop(0.5, '#ffe57f');
    sunGrad.addColorStop(1, 'rgba(254, 180, 123, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(w/2, h/2 + 10, 30, 0, Math.PI * 2);
    ctx.fill();

    // Ground hills
    ctx.fillStyle = '#4a3b32';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.quadraticCurveTo(w/3, h - 35, w/2 - 10, h - 15);
    ctx.quadraticCurveTo(w * 0.75, h, w, h - 25);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Silhouettes of two figures sitting
    ctx.fillStyle = '#1e1610';
    ctx.beginPath();
    // Person 1
    ctx.arc(w/2 - 15, h - 25, 4, 0, Math.PI * 2); // Head
    ctx.fill();
    ctx.fillRect(w/2 - 18, h - 21, 6, 10); // Body

    // Person 2
    ctx.beginPath();
    ctx.arc(w/2 - 2, h - 23, 3.8, 0, Math.PI * 2); // Head
    ctx.fill();
    ctx.fillRect(w/2 - 5, h - 19, 6, 8); // Body
  }

  // Memory 3: Cozy fireplace hearth glow
  drawHearthIllustration(ctx, w, h) {
    // Dark room backdrop
    const grad = ctx.createRadialGradient(w/2, h/2 + 20, 10, w/2, h/2, 130);
    grad.addColorStop(0, '#2e1919'); // warm center glow
    grad.addColorStop(1, '#0e0b0e'); // dark edge
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw fireplace frame silhouette
    ctx.fillStyle = '#221915';
    ctx.fillRect(w/2 - 60, h - 80, 120, 80);
    ctx.fillStyle = '#0a0808';
    ctx.fillRect(w/2 - 40, h - 60, 80, 60);

    // Red-orange fire splatter glow
    this.drawWatercolorSplatter(ctx, w/2, h - 20, 25, '#ff4500');
    this.drawWatercolorSplatter(ctx, w/2 - 10, h - 15, 20, '#ff8c00');
    this.drawWatercolorSplatter(ctx, w/2 + 10, h - 18, 18, '#ffd700');

    // Logs
    ctx.strokeStyle = '#3d2516';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(w/2 - 25, h - 8);
    ctx.lineTo(w/2 + 25, h - 18);
    ctx.moveTo(w/2 + 25, h - 8);
    ctx.lineTo(w/2 - 25, h - 18);
    ctx.stroke();
  }

  // Memory 4: Starry midnight sky and stars
  drawStarsIllustration(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#020308');
    grad.addColorStop(0.6, '#080d21');
    grad.addColorStop(1, '#1b1b3a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Milky way watercolor haze
    this.drawWatercolorSplatter(ctx, w/3, h/3, 60, 'rgba(100, 150, 255, 0.15)');
    this.drawWatercolorSplatter(ctx, w * 0.7, h/2, 50, 'rgba(230, 150, 255, 0.12)');

    // Moon
    ctx.fillStyle = '#ffffe0';
    ctx.shadowColor = 'rgba(255,255,224, 0.4)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(w - 60, 60, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // reset

    // Moon bite (crescent overlay)
    ctx.fillStyle = '#020308';
    ctx.beginPath();
    ctx.arc(w - 70, 52, 22, 0, Math.PI * 2);
    ctx.fill();

    // Splattered white star points
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 40; i++) {
      const sx = Math.random() * w;
      const sy = Math.random() * h;
      const size = 0.5 + Math.random() * 1.5;
      
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Watercolor splat drawing helper
  drawWatercolorSplatter(ctx, x, y, maxRadius, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalCompositeOperation = 'multiply';
    
    // Draw 8-12 overlapping irregular small circles
    const steps = 10;
    ctx.beginPath();
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const radius = maxRadius * (0.6 + Math.random() * 0.4);
      const cx = x + Math.cos(angle) * (maxRadius * 0.25);
      const cy = y + Math.sin(angle) * (maxRadius * 0.25);
      
      if (i === 0) ctx.moveTo(cx + radius, cy);
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
