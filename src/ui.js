import * as THREE from 'three';
import { gsap } from 'gsap';
import { audioInstance } from './audio.js';

export class UIManager {
  constructor(sceneManager, lightingManager, particlesManager, gardenManager, islandEnv, river) {
    this.sm = sceneManager;
    this.lm = lightingManager;
    this.pm = particlesManager;
    this.gm = gardenManager;
    this.islandEnv = islandEnv;
    this.river = river;

    // UI overlays
    this.musicToggle = document.getElementById('music-toggle');
    this.splashScreen = document.getElementById('splash-screen');
    this.loadingText = document.getElementById('loading-text');
    this.loadingBar = document.getElementById('loading-bar');
    
    // Tap starter screen (audio unlocker)
    this.tapScreen = document.getElementById('tap-screen');
    this.tapBtn = document.getElementById('tap-btn');
    
    // Scene 10 title overlay
    this.titleScreen = document.getElementById('title-screen');
    this.enterBtn = document.getElementById('enter-btn');

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

    // Timeline stories
    this.flowerTimeline = [
      {
        id: 0,
        title: "The Spark of Us",
        date: "December 25, 2025",
        desc: "Agus in Pamulang, South Tangerang. Cesya in Batam Center. 900 kilometers apart, but our story started with a single, undeniable spark. We chose to build our little world.",
        pos: { x: -16.0, y: 3.02, z: -0.2 },
        color: '#ff3366',
        illustrate: (ctx, w, h) => this.drawSparkIllustration(ctx, w, h)
      },
      {
        id: 1,
        title: "First Month Shared",
        date: "January 25, 2026",
        desc: "Late night calls, screen-sharing our favorite movies, and sipping coffee 'together' across the ocean. We learned each other's schedules and made distance our normal.",
        pos: { x: -13.0, y: 3.02, z: 1.2 },
        color: '#ff66cc',
        illustrate: (ctx, w, h) => this.drawCoffeeIllustration(ctx, w, h)
      },
      {
        id: 2,
        title: "Our First Valentine",
        date: "February 25, 2026",
        desc: "Couriers delivering handwritten letters and matching teddy bears. Seeing you smile on video call made every kilometer of distance worth it. Distance is just a test of time.",
        pos: { x: -20.0, y: 3.02, z: -5.0 },
        color: '#ffcc00',
        illustrate: (ctx, w, h) => this.drawHeartParcelIllustration(ctx, w, h)
      },
      {
        id: 3,
        title: "Overcoming the Rain",
        date: "March 25, 2026",
        desc: "Stormy nights in South Tangerang. We stayed on the phone for hours listening to the rain static together. Knowing you were listening made the dark sky feel peaceful.",
        pos: { x: 12.0, y: 2.07, z: 2.8 },
        color: '#ff6600',
        illustrate: (ctx, w, h) => this.drawRainIllustration(ctx, w, h)
      },
      {
        id: 4,
        title: "Midnight Constellations",
        date: "April 25, 2026",
        desc: "Talking about our future house, naming our future cats, and outlining the garden we will plant together. Our dreams became the stars mapping out where we are going.",
        pos: { x: 17.5, y: 2.07, z: 2.5 },
        color: '#33ccff',
        illustrate: (ctx, w, h) => this.drawConstellationIllustration(ctx, w, h)
      },
      {
        id: 5,
        title: "Anniversary Anthems",
        date: "May 25, 2025",
        desc: "Bookmarking flights and making packing lists in our minds. The sweet countdown of planning to meet. The distance is long, but the destination is you.",
        pos: { x: 14.5, y: 2.07, z: -1.5 },
        color: '#cc33ff',
        illustrate: (ctx, w, h) => this.drawFlightIllustration(ctx, w, h)
      },
      {
        id: 6,
        title: "Six Months of Love",
        date: "June 25, 2026",
        desc: "June 26, 2026. Here we stand. Half a year of holding on, trusting, and growing. Our Bridge of Love is 60% built, extending stronger every month. The bridge is writing our future.",
        pos: { x: 9.8, y: 2.07, z: 5.5 },
        color: '#33ffaa',
        illustrate: (ctx, w, h) => this.drawBridgeIllustration(ctx, w, h)
      }
    ];

    // Interactive chapters parameters
    this.chapters = [
      {
        id: 0,
        title: "Chapter 0: The Beginning",
        subtitle: "Separated by 900km, our worlds float in the same sky...",
        camPos: { x: 0, y: 35, z: 55 },
        camTarget: { x: 0, y: 2, z: 0 },
        weather: 'dawn'
      },
      {
        id: 1,
        title: "Chapter 1: Flower Garden",
        subtitle: "Every month we grow, a new flower blooms in our timeline...",
        camPos: { x: 13, y: 6.5, z: 12.5 },
        camTarget: { x: 12, y: 2.5, z: 3.5 },
        weather: 'sunny'
      },
      {
        id: 2,
        title: "Chapter 2: Memory House",
        subtitle: "A cozy cottage sitting on Agus's island, keeping the hearth warm...",
        camPos: { x: -11.5, y: 5.5, z: 2.5 },
        camTarget: { x: -14.8, y: 4.2, z: -2.8 },
        weather: 'golden'
      },
      {
        id: 3,
        title: "Chapter 3: The Two Islands",
        subtitle: "Pamulang and Batam Center. Two hearts, two sanctuaries...",
        camPos: { x: -28, y: 22, z: 38 },
        camTarget: { x: 0, y: 3, z: 0 },
        weather: 'fog'
      },
      {
        id: 4,
        title: "Chapter 4: Bridge of Love",
        subtitle: "Our connection is 60% built. Growing closer every day...",
        camPos: { x: -1.2, y: 5.0, z: 8.5 },
        camTarget: { x: 0, y: 2.5, z: 0 },
        weather: 'rain'
      },
      {
        id: 5,
        title: "Chapter 5: Future Dreams",
        subtitle: "Under the Indonesian stars, we write the rest of our map...",
        camPos: { x: 0, y: 9, z: 22 },
        camTarget: { x: 0, y: 24, z: -32 },
        weather: 'stars'
      }
    ];

    this.activeChapterIdx = 0;
    this.discoveredCount = 0;
    this.discoveredIds = new Set();
    this.isCinematicActive = false;

    this.init();
  }

  init() {
    this.bindEvents();
    this.simulateLoading();
  }

  bindEvents() {
    // 1. Initial click starter trigger
    this.tapBtn.addEventListener('click', () => {
      this.tapScreen.classList.add('fade-out');
      // Starts the 10-Scene Cinematic Timeline
      this.playOpeningCinematic();
    });

    // 2. Scene 10 final Enter trigger
    this.enterBtn.addEventListener('click', () => {
      // Fade out Title screen overlay
      this.titleScreen.classList.add('hidden');
      document.body.classList.remove('cinematic');

      // Pan camera to standard interactive layout looking at Agus's house
      gsap.to(this.sm.camera.position, { x: -28, y: 15, z: 32, duration: 2.2, ease: 'power2.out' });
      gsap.to(this.sm.controls.target, {
        x: -15, y: 3.5, z: -5,
        duration: 2.2,
        ease: 'power2.out',
        onComplete: () => {
          this.sm.controls.enabled = true; // hand controls to user
          this.hud.classList.remove('hidden');
          this.hud.classList.add('fade-in');
        }
      });
    });

    this.musicToggle.addEventListener('click', () => {
      const isMuted = audioInstance.toggle();
      if (isMuted) this.musicToggle.classList.add('muted');
      else this.musicToggle.classList.remove('muted');
    });

    const weatherButtons = document.querySelectorAll('.time-btn');
    weatherButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        weatherButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const weather = e.target.getAttribute('data-time');
        
        this.lm.transitionTo(weather);
        this.pm.updateEnvironmentLights(weather);
        this.updateWindowGlows(weather);
      });
    });

    const chapterButtons = document.querySelectorAll('.chapter-btn');
    chapterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-chapter'));
        this.jumpToChapter(id);
      });
    });

    this.closeMemoryBtn.addEventListener('click', () => {
      this.memoryOverlay.classList.add('hidden');
      this.sm.controls.enabled = true;
      gsap.to(this.sm.controls.target, { x: 0, y: 4, z: 0, duration: 1.5, ease: 'power2.out' });
      document.body.classList.remove('cinematic');
    });

    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('click', (e) => this.onMouseClick(e));
    window.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: true });
  }

  updateWindowGlows(theme) {
    this.sm.scene.traverse(child => {
      if (child.material && child.material.emissive && child.material.emissiveIntensity !== undefined) {
        let intensity = 0.5;
        if (theme === 'sunny') intensity = 0.0;
        else if (theme === 'golden') intensity = 2.2;
        else if (theme === 'rain') intensity = 3.0;
        else if (theme === 'night') intensity = 4.2;
        else if (theme === 'stars') intensity = 4.5;
        
        gsap.to(child.material, { emissiveIntensity: intensity, duration: 2.2, ease: 'power2.out' });
      }
    });
  }

  simulateLoading() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        this.loadingBar.style.width = '100%';
        this.loadingText.innerText = 'Establishment Successful';
        
        gsap.to(this.splashScreen, {
          opacity: 0, duration: 0.8, delay: 0.3, onComplete: () => {
            this.splashScreen.classList.add('hidden');
            // Unhide click catcher catcher
            this.tapScreen.classList.remove('hidden');
          }
        });
      } else {
        this.loadingBar.style.width = `${progress}%`;
        this.loadingText.innerText = `Establishing connection Batam ↔ Pamulang... ${progress}%`;
      }
    }, 120);
  }

  // --- CHAPTER 0: THE BEGINNING CINEMATIC TIMELINE (SCENES 1-10) ---
  playOpeningCinematic() {
    this.isCinematicActive = true;
    document.body.classList.add('cinematic'); // slide in black letterbox bars

    const mainTimeline = gsap.timeline({
      onComplete: () => {
        // Trigger Scene 10 layout menu
        this.titleScreen.classList.remove('hidden');
        this.isCinematicActive = false;
      }
    });

    const captions = document.getElementById('captions');
    
    // Animate camera starts at (0, 100, 120) looking down
    this.sm.camera.position.set(0, 100, 120);
    this.sm.controls.target.set(-15, 30, -1.0); // look at Agus's island center

    // --- Scene 1: Silence initially, then at 2.0s soft piano and wind fade in ---
    mainTimeline.to({}, { duration: 2.0 }) // 2s black/silence delay
      .add(() => {
        // Initialize Audio context on user gesture click
        audioInstance.start();
        this.musicToggle.classList.remove('muted');
        
        // Fade in wind sound and drift stardust particles
        audioInstance.fadeAmbiance('dawn');
        gsap.to(this.pm.petalsMat, { opacity: 0.25, duration: 3.0 });
      });

    // --- Scene 2: Single glowing star appears and caption displays ---
    mainTimeline.add(() => {
      // Scale up falling star mesh high in the sky
      this.pm.starGroup.position.set(-15, 60, -1.0);
      gsap.to(this.pm.starGroup.scale, { x: 1, y: 1, z: 1, duration: 1.5, ease: 'back.out' });
      gsap.to(this.pm.starLight, { intensity: 1.5, duration: 1.5 });

      captions.innerText = "There are more than 8 billion people in this world...";
      gsap.to(captions, { opacity: 1, duration: 1.0 });
    }, "+=0.5")
    .to(captions, { opacity: 0, duration: 0.8, delay: 3.5 });

    // --- Scene 3: Star falls slowly. Camera follows star downward ---
    mainTimeline.add(() => {
      // Star falls from y=60 to y=3.02
      gsap.to(this.pm.starGroup.position, { y: 3.02, duration: 5.5, ease: 'sine.inOut' });
      
      // Camera tracks star descend
      gsap.to(this.sm.camera.position, { x: -15, y: 15, z: 25, duration: 5.5, ease: 'sine.inOut' });
      gsap.to(this.sm.controls.target, { x: -15, y: 12, z: -1.0, duration: 5.5, ease: 'sine.inOut' });
      
      // Clouds fade in
      gsap.to(this.pm.cloudMat, { opacity: 0.3, duration: 4.5 });
      
      // Sunlight visible (transition lights/fog to dawn)
      this.lm.transitionTo('dawn', 5.5);
    }, "+=0.2");

    // --- Scene 4: Star lands on Agus's island. Magical wave spreads & models scale in ---
    mainTimeline.add(() => {
      // Bright landing impact flash
      gsap.to(this.pm.starLight, { intensity: 8.0, duration: 0.1, yoyo: true, repeat: 1 });
      
      // Collapse star core
      gsap.to(this.pm.starGroup.scale, {
        x: 0, y: 0, z: 0, duration: 0.4, onComplete: () => {
          this.pm.starLight.intensity = 0;
        }
      });

      // Growth waves: animate uGrowth uniform to raise grass/flowers
      gsap.to(this.gm.uniforms.uGrowth, { value: 1.0, duration: 3.5, ease: 'power2.out' });

      // Grow river winding mesh
      gsap.to(this.river.mesh.scale, { x: 1.0, y: 0.05, z: 1.0, duration: 2.8, ease: 'power1.out' });

      // Grow Agus cottage
      gsap.to(this.islandEnv.cottage.scale, { x: 1, y: 1, z: 1, duration: 2.2, ease: 'back.out(1.15)' });
      
      // Grow Agus study desk
      gsap.to(this.islandEnv.desk.scale, { x: 1, y: 1, z: 1, duration: 2.0, ease: 'back.out(1.15)', delay: 0.5 });
      
      // Grow Cesya telescope observ deck
      gsap.to(this.islandEnv.telescope.scale, { x: 1, y: 1, z: 1, duration: 2.2, ease: 'back.out(1.15)', delay: 0.7 });

      // Staggered grow trees
      this.islandEnv.trees.forEach((tree, idx) => {
        gsap.to(tree.scale, {
          x: tree.userData.targetScale,
          y: tree.userData.targetScale,
          z: tree.userData.targetScale,
          duration: 1.8,
          ease: 'back.out(1.2)',
          delay: 0.3 + idx * 0.25
        });
      });

      // Staggered grow path stepping stones
      this.islandEnv.steppingStones.forEach((stone, idx) => {
        gsap.to(stone.scale, { x: 1, y: 1, z: 1, duration: 0.8, ease: 'back.out(1.5)', delay: 0.1 + idx * 0.1 });
      });

      // Grow bridge planks sequentially from Agus to Cesya
      this.islandEnv.bridgePlanks.forEach((plank, idx) => {
        gsap.to(plank.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'back.out(1.2)', delay: 0.05 + idx * 0.04 });
      });

      // Animate bridge guides opacity
      this.islandEnv.bridgeRopes.forEach(guide => {
        gsap.to(guide.material, { opacity: 0.35, duration: 1.5 });
      });

      // Clouds / petals / fireflies opacity full fade-in
      gsap.to(this.pm.cloudMat, { opacity: 0.35, duration: 2.5 });
      gsap.to(this.pm.petalsMat, { opacity: 0.8, duration: 2.5 });
      gsap.to(this.pm.fireflyMat, { opacity: 0.9, duration: 2.5 });
      
      // Fade in steam/sparks
      gsap.to(this.pm.steamMat, { opacity: 0.15, duration: 2.5 });
      gsap.to(this.pm.sparkMat, { opacity: 0.85, duration: 2.5 });

      // Scale in butterflies and birds
      this.pm.butterflies.forEach(b => gsap.to(b.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 2.0, ease: 'power2.out' }));
      this.pm.birds.forEach(b => gsap.to(b.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 2.0, ease: 'power2.out' }));
    }, "+=5.5");

    // --- Scene 5: Camera slowly rises showing the complete beautiful island ---
    mainTimeline.add(() => {
      gsap.to(this.sm.camera.position, { x: -6, y: 11, z: 28, duration: 4.5, ease: 'sine.inOut' });
      gsap.to(this.sm.controls.target, { x: 0, y: 3.5, z: 0, duration: 4.5, ease: 'sine.inOut' });
    }, "+=1.0");

    // --- Scene 6: Subtitle displays date text ---
    mainTimeline.add(() => {
      captions.innerText = "Our world began on...";
      gsap.to(captions, { opacity: 1, duration: 0.8 });
    }, "+=0.2")
    .add(() => {
      captions.innerHTML = "Our world began on<br><span style='font-family:var(--font-serif); font-size:1.6rem; color:#ffa64d;'>25 December 2025</span>";
    }, "+=1.5")
    .to(captions, { opacity: 0, duration: 0.8, delay: 3.2 });

    // --- Scene 7: Camera flies close to the first flower circling it ---
    mainTimeline.add(() => {
      // Bloom/grow the first flower (id:0)
      const flower0 = this.gm.monthlyFlowerMeshes[0];
      gsap.to(flower0.scale, { x: 1, y: 1, z: 1, duration: 2.0, ease: 'back.out(1.5)' });

      // Zoom camera to circle around flower0
      gsap.to(this.sm.camera.position, { x: -14.2, y: 4.0, z: 2.2, duration: 4.5, ease: 'sine.inOut' });
      gsap.to(this.sm.controls.target, { x: -16.0, y: 3.2, z: -0.2, duration: 4.5, ease: 'sine.inOut' });
    }, "+=0.2");

    // --- Scene 8: Camera flies close to cozy cottage (smoke rises, windows glow) ---
    mainTimeline.add(() => {
      // Bloom/grow all remaining timeline flowers
      this.gm.monthlyFlowerMeshes.forEach((fl, idx) => {
        if (idx > 0) {
          gsap.to(fl.scale, { x: 1, y: 1, z: 1, duration: 2.0, ease: 'back.out(1.3)', delay: idx * 0.15 });
        }
      });

      // Animate chimney smoke and window glows
      gsap.to(this.pm.smokeMat, { opacity: 0.22, duration: 2.5 });
      this.updateWindowGlows('golden'); // sets emissive to golden level

      // Sweep camera around cottage
      gsap.to(this.sm.camera.position, { x: -11.5, y: 5.5, z: 2.5, duration: 4.5, ease: 'sine.inOut' });
      gsap.to(this.sm.controls.target, { x: -14.8, y: 4.2, z: -2.8, duration: 4.5, ease: 'sine.inOut' });
    }, "+=4.5");

    // --- Scene 9: Camera reaches wooden door, door opens, screen fades to white ---
    mainTimeline.add(() => {
      // Approach front door
      gsap.to(this.sm.camera.position, { x: -15.0, y: 4.15, z: 0.35, duration: 3.0, ease: 'power1.in' });
      gsap.to(this.sm.controls.target, { x: -15.0, y: 4.1, z: -2.8, duration: 3.0, ease: 'power1.in' });

      // Rotate door mesh open automatically
      gsap.to(this.islandEnv.door.rotation, { y: Math.PI / 1.8, duration: 2.0, ease: 'power2.inOut', delay: 1.0 });

      // Fade white Title screen overlay in (representing bright hearth light blinding lens)
      gsap.to(this.titleScreen, {
        css: { opacity: 1 },
        duration: 1.5,
        ease: 'power1.in',
        delay: 1.8,
        onStart: () => {
          this.titleScreen.classList.remove('hidden');
        }
      });
    }, "+=4.5");
  }

  jumpToChapter(idx) {
    if (this.isCinematicActive || !this.sm.controls.enabled) return;

    this.activeChapterIdx = idx;
    const chap = this.chapters[idx];

    const buttons = document.querySelectorAll('.chapter-btn');
    buttons.forEach((b, i) => {
      if (i === idx) b.classList.add('active');
      else b.classList.remove('active');
    });

    const captions = document.getElementById('captions');
    gsap.to(captions, {
      opacity: 0, duration: 0.3, onComplete: () => {
        captions.innerText = chap.subtitle;
        gsap.to(captions, { opacity: 1, duration: 0.5 });
      }
    });

    const targetWeatherBtn = document.querySelector(`.time-btn[data-time="${chap.weather}"]`);
    if (targetWeatherBtn) {
      targetWeatherBtn.click();
    }

    this.sm.controls.enabled = false;
    gsap.to(this.sm.camera.position, {
      x: chap.camPos.x,
      y: chap.camPos.y,
      z: chap.camPos.z,
      duration: 2.2,
      ease: 'power2.inOut'
    });

    gsap.to(this.sm.controls.target, {
      x: chap.camTarget.x,
      y: chap.camTarget.y,
      z: chap.camTarget.z,
      duration: 2.2,
      ease: 'power2.inOut',
      onComplete: () => {
        this.sm.controls.enabled = true;
      }
    });
  }

  updateRaycast() {
    if (this.isCinematicActive || !this.sm.controls.enabled) return;

    this.raycaster.setFromCamera(this.mouse, this.sm.camera);
    const intersects = this.raycaster.intersectObjects(this.gm.monthlyFlowerMeshes, true);

    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj.parent && obj.userData.flowerId === undefined) {
        obj = obj.parent;
      }

      if (this.hoveredNode !== obj && obj.userData.flowerId !== undefined) {
        if (this.hoveredNode) {
          this.hoveredNode.scale.set(1.0, 1.0, 1.0);
          this.hoveredNode.userData.htmlLabel.classList.remove('visible');
        }

        this.hoveredNode = obj;
        document.body.style.cursor = 'pointer';
        
        gsap.to(this.hoveredNode.scale, { x: 1.35, y: 1.35, z: 1.35, duration: 0.3, ease: 'back.out(2)' });
        this.hoveredNode.userData.htmlLabel.classList.add('visible');
      }

      if (this.hoveredNode) {
        const wp = new THREE.Vector3();
        this.hoveredNode.getWorldPosition(wp);
        wp.project(this.sm.camera);

        const lx = (wp.x * 0.5 + 0.5) * window.innerWidth;
        const ly = (-(wp.y * 0.5) + 0.5) * window.innerHeight;
        
        const label = this.hoveredNode.userData.htmlLabel;
        label.style.left = `${lx}px`;
        label.style.top = `${ly}px`;
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
      setTimeout(() => this.onMouseClick(e), 50);
    }
  }

  onMouseClick(e) {
    if (this.isCinematicActive || !this.sm.controls.enabled || !this.hoveredNode) return;

    const flowerId = this.hoveredNode.userData.flowerId;
    const flower = this.flowerTimeline.find(f => f.id === flowerId);
    if (!flower) return;

    this.showMemoryPolaroid(flower);
  }

  showMemoryPolaroid(flower) {
    if (!this.discoveredIds.has(flower.id)) {
      this.discoveredIds.add(flower.id);
      this.discoveredCount++;
      
      const percent = (this.discoveredCount / this.flowerTimeline.length) * 100;
      document.getElementById('tracker-fill').style.width = `${percent}%`;
      document.getElementById('tracker-text').innerText = `${this.discoveredCount} / ${this.flowerTimeline.length}`;
    }

    this.sm.controls.enabled = false;
    document.body.classList.add('cinematic');

    const targetCam = new THREE.Vector3()
      .copy(this.hoveredNode.position)
      .add(new THREE.Vector3(
        (this.sm.camera.position.x - this.hoveredNode.position.x) * 0.4,
        2.0,
        (this.sm.camera.position.z - this.hoveredNode.position.z) * 0.4
      ));

    gsap.to(this.sm.camera.position, {
      x: targetCam.x, y: targetCam.y, z: targetCam.z,
      duration: 1.4, ease: 'power2.inOut'
    });

    gsap.to(this.sm.controls.target, {
      x: this.hoveredNode.position.x,
      y: this.hoveredNode.position.y,
      z: this.hoveredNode.position.z,
      duration: 1.4,
      ease: 'power2.inOut',
      onComplete: () => {
        this.memoryTitle.innerText = flower.title;
        this.memoryDate.innerText = flower.date;
        this.memoryDescription.innerText = flower.desc;

        this.renderWatercolorIllustration(flower);
        this.memoryOverlay.classList.remove('hidden');
      }
    });
  }

  renderWatercolorIllustration(flower) {
    let canvas = this.illustrationContainer.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      this.illustrationContainer.innerHTML = '';
      this.illustrationContainer.appendChild(canvas);
    }
    
    const w = 320; const h = 260;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');

    flower.illustrate(ctx, w, h);
  }

  // --- HTML5 Watercolor drawings inside Polaroid frames ---

  drawSparkIllustration(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#ffebeb');
    grad.addColorStop(1, '#ffd6db');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this.drawWatercolorSplatter(ctx, w/2, h/2, 55, 'rgba(255, 51, 102, 0.45)');
    
    const core = ctx.createRadialGradient(w/2, h/2, 2, w/2, h/2, 25);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(0.5, '#ff66aa');
    core.addColorStop(1, 'rgba(255,51,102,0)');
    ctx.fillStyle = core;
    ctx.beginPath(); ctx.arc(w/2, h/2, 25, 0, Math.PI*2); ctx.fill();
  }

  drawCoffeeIllustration(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#fbf8f3');
    grad.addColorStop(1, '#eae1d4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this.drawWatercolorSplatter(ctx, w/3, h/2 + 20, 35, '#8c6239');
    this.drawWatercolorSplatter(ctx, w * 0.66, h/2 + 20, 35, '#8c6239');

    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#6d4c2d';
    ctx.lineWidth = 3;
    
    ctx.beginPath(); ctx.roundRect(w/3 - 20, h/2 - 10, 40, 40, [4, 4, 15, 15]); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(w/3 - 22, h/2 + 10, 8, -Math.PI/2, Math.PI/2, true); ctx.stroke();

    ctx.beginPath(); ctx.roundRect(w * 0.66 - 20, h/2 - 10, 40, 40, [4, 4, 15, 15]); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(w * 0.66 + 22, h/2 + 10, 8, -Math.PI/2, Math.PI/2, false); ctx.stroke();

    ctx.strokeStyle = 'rgba(140, 98, 57, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w/3 - 5, h/2 - 20); ctx.quadraticCurveTo(w/3 - 10, h/2 - 35, w/3, h/2 - 45);
    ctx.moveTo(w * 0.66 + 5, h/2 - 20); ctx.quadraticCurveTo(w * 0.66, h/2 - 35, w * 0.66 + 10, h/2 - 45);
    ctx.stroke();
  }

  drawHeartParcelIllustration(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#fef0f3');
    grad.addColorStop(1, '#ffd6e0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this.drawWatercolorSplatter(ctx, w/2, h/2, 45, 'rgba(255,102,204,0.3)');

    ctx.fillStyle = '#d7ccc8';
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(w/2 - 35, h/2 - 25, 70, 50, 5);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#ff3366';
    ctx.beginPath();
    ctx.moveTo(w/2, h/2 - 5);
    ctx.bezierCurveTo(w/2 - 10, h/2 - 15, w/2 - 15, h/2 + 5, w/2, h/2 + 15);
    ctx.bezierCurveTo(w/2 + 15, h/2 + 5, w/2 + 10, h/2 - 15, w/2, h/2 - 5);
    ctx.fill();
  }

  drawRainIllustration(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1c2833');
    grad.addColorStop(1, '#2c3e50');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this.drawWatercolorSplatter(ctx, w/2, h/2, 60, 'rgba(52, 152, 219, 0.25)');

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 4;
    ctx.strokeRect(w/2 - 50, h/2 - 50, 100, 100);
    ctx.beginPath();
    ctx.moveTo(w/2, h/2 - 50); ctx.lineTo(w/2, h/2 + 50);
    ctx.moveTo(w/2 - 50, h/2); ctx.lineTo(w/2 + 50, h/2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 15; i++) {
      const rx = Math.random() * w;
      const ry = Math.random() * h;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 8, ry + 25);
      ctx.stroke();
    }
  }

  drawConstellationIllustration(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#040613');
    grad.addColorStop(1, '#0e122b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this.drawWatercolorSplatter(ctx, w/2, h/2, 50, 'rgba(135, 206, 250, 0.2)');

    const starCoords = [
      {x: w/2 - 60, y: h/2 + 30},
      {x: w/2 - 20, y: h/2 - 20},
      {x: w/2 + 30, y: h/2 - 10},
      {x: w/2 + 70, y: h/2 + 40}
    ];

    ctx.strokeStyle = 'rgba(255,255,224,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(starCoords[0].x, starCoords[0].y);
    for (let i = 1; i < starCoords.length; i++) {
      ctx.lineTo(starCoords[i].x, starCoords[i].y);
    }
    ctx.stroke();

    ctx.fillStyle = '#ffffe0';
    starCoords.forEach(sc => {
      ctx.beginPath(); ctx.arc(sc.x, sc.y, 4, 0, Math.PI*2); ctx.fill();
    });
  }

  drawFlightIllustration(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#f9d5e5');
    grad.addColorStop(1, '#eeac99');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this.drawWatercolorSplatter(ctx, w/3, h/2, 45, 'rgba(255,255,255,0.4)');
    this.drawWatercolorSplatter(ctx, w * 0.7, h/2 + 10, 50, 'rgba(255,255,255,0.4)');

    ctx.fillStyle = '#5c4e4e';
    ctx.beginPath();
    ctx.moveTo(w/2 - 40, h/2 - 10);
    ctx.quadraticCurveTo(w/2 - 10, h/2 - 15, w/2 + 30, h/2 - 5);
    ctx.lineTo(w/2 + 40, h/2 - 8);
    ctx.lineTo(w/2 + 38, h/2 - 2);
    ctx.lineTo(w/2 - 40, h/2);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w/2, h/2 - 6);
    ctx.lineTo(w/2 - 15, h/2 - 28);
    ctx.lineTo(w/2 - 5, h/2 - 28);
    ctx.lineTo(w/2 + 10, h/2 - 6);
    ctx.fill();
  }

  drawBridgeIllustration(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#ffe3e8');
    grad.addColorStop(1, '#ffc2d1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this.drawWatercolorSplatter(ctx, w/2, h/2, 50, 'rgba(255, 102, 170, 0.25)');

    ctx.fillStyle = '#655459';
    ctx.beginPath();
    ctx.arc(w/4 - 10, h - 20, 45, 0, Math.PI*2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(w * 0.75 + 10, h - 15, 40, 0, Math.PI*2);
    ctx.fill();

    ctx.strokeStyle = '#ffe480';
    ctx.shadowColor = '#ffa64d';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w/4 + 10, h - 35);
    ctx.quadraticCurveTo(w/2, h - 45, w * 0.75 - 10, h - 32);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
  }

  drawWatercolorSplatter(ctx, x, y, maxRadius, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalCompositeOperation = 'multiply';
    
    const steps = 9;
    ctx.beginPath();
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const radius = maxRadius * (0.6 + Math.random() * 0.4);
      const cx = x + Math.cos(angle) * (maxRadius * 0.22);
      const cy = y + Math.sin(angle) * (maxRadius * 0.22);
      
      if (i === 0) ctx.moveTo(cx + radius, cy);
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
