import * as THREE from 'three';
import { gsap } from 'gsap';
import { audioInstance } from './audio.js';

export class UIManager {
  constructor(sceneManager, lightingManager, particlesManager, gardenManager) {
    this.sm = sceneManager;
    this.lm = lightingManager;
    this.pm = particlesManager;
    this.gm = gardenManager;

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

    // Define 7 monthly timeline flowers
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

    // Define 6 cinematic chapters configurations
    this.chapters = [
      {
        id: 0,
        title: "Chapter 0: The Beginning",
        subtitle: "Separated by 900km, our worlds float in the same sky...",
        camPos: { x: 0, y: 55, z: 65 },
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
        camTarget: { x: 0, y: 24, z: -32 }, // look up to sky constellations
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
    this.startBtn.addEventListener('click', () => this.enterWorld());

    this.musicToggle.addEventListener('click', () => {
      const isMuted = audioInstance.toggle();
      if (isMuted) this.musicToggle.classList.add('muted');
      else this.musicToggle.classList.remove('muted');
    });

    // Wire up Weather Select Panel
    const weatherButtons = document.querySelectorAll('.time-btn');
    weatherButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        weatherButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const weather = e.target.getAttribute('data-time');
        
        // Transition lighting & sound states
        this.lm.transitionTo(weather);
        this.pm.updateEnvironmentLights(weather);
        this.updateWindowGlows(weather);
      });
    });

    // Wire up Chapter Selection Panel
    const chapterButtons = document.querySelectorAll('.chapter-btn');
    chapterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-chapter'));
        this.jumpToChapter(id);
      });
    });

    // Polaroid close
    this.closeMemoryBtn.addEventListener('click', () => {
      this.memoryOverlay.classList.add('hidden');
      this.sm.controls.enabled = true;
      
      // Reset camera target
      gsap.to(this.sm.controls.target, { x: 0, y: 4, z: 0, duration: 1.5, ease: 'power2.out' });
      document.body.classList.remove('cinematic');
    });

    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('click', (e) => this.onMouseClick(e));
    window.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: true });
  }

  // Update cottage glass windows emissive rates per weather state
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
        this.loadingText.innerText = 'World is Configured';
        
        gsap.to(this.loadingBar.parentElement, { opacity: 0, height: 0, duration: 0.5, delay: 0.3 });
        gsap.to(this.loadingText, { opacity: 0, duration: 0.5, delay: 0.3, onComplete: () => {
          this.startBtn.classList.remove('hidden');
          gsap.fromTo(this.startBtn, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' });
        }});
      } else {
        this.loadingBar.style.width = `${progress}%`;
        this.loadingText.innerText = `Establishing connection Batam ↔ Pamulang... ${progress}%`;
      }
    }, 120);
  }

  enterWorld() {
    audioInstance.start();
    this.musicToggle.classList.remove('muted');
    this.splashScreen.classList.add('fade-out');
    this.playCinematicIntro();
  }

  playCinematicIntro() {
    this.isCinematicActive = true;
    document.body.classList.add('cinematic');

    const tl = gsap.timeline({
      onComplete: () => {
        this.isCinematicActive = false;
        this.sm.controls.enabled = true;
        document.body.classList.remove('cinematic');
        
        this.hud.classList.remove('hidden');
        this.hud.classList.add('fade-in');
      }
    });

    const captions = document.getElementById('captions');
    const subTimeline = gsap.timeline();

    const playSub = (text, delay, dur) => {
      subTimeline.to(captions, { opacity: 0, duration: 0.3, onComplete: () => { captions.innerText = text; } }, delay)
        .to(captions, { opacity: 1, duration: 0.5 })
        .to(captions, { opacity: 0, duration: 0.4 }, `+=${dur}`);
    };

    playSub("Agus in Pamulang. Cesya in Batam Center.", 0.8, 3.5);
    playSub("900 kilometers apart, floating in the same digital sky...", 5.2, 4.0);
    playSub("Explore the chapters and flowers to discover their stories.", 10.0, 3.8);

    // Initial cinematic sweeping camera path around both LDR islands
    tl.to(this.sm.camera.position, { x: 0, y: 45, z: 65, duration: 6.0, ease: 'power2.inOut' })
      .to(this.sm.camera.position, { x: -26, y: 15, z: 28, duration: 5.0, ease: 'sine.inOut' })
      .to(this.sm.camera.position, { x: -8, y: 6.0, z: 18, duration: 4.0, ease: 'power1.inOut' });

    tl.to(this.sm.controls.target, { x: -15, y: 3.5, z: -5, duration: 15.0, ease: 'sine.inOut' }, 0);
  }

  // Jump camera directly to selected Chapter composition
  jumpToChapter(idx) {
    if (this.isCinematicActive || !this.sm.controls.enabled) return;

    this.activeChapterIdx = idx;
    const chap = this.chapters[idx];

    // Highlight active chapter button
    const buttons = document.querySelectorAll('.chapter-btn');
    buttons.forEach((b, i) => {
      if (i === idx) b.classList.add('active');
      else b.classList.remove('active');
    });

    // Trigger subtitles narration
    const captions = document.getElementById('captions');
    gsap.to(captions, {
      opacity: 0, duration: 0.3, onComplete: () => {
        captions.innerText = chap.subtitle;
        gsap.to(captions, { opacity: 1, duration: 0.5 });
      }
    });

    // Update Weather to match Chapter mood automatically
    const targetWeatherBtn = document.querySelector(`.time-btn[data-time="${chap.weather}"]`);
    if (targetWeatherBtn) {
      targetWeatherBtn.click();
    }

    // Animate camera position and target
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

  // Raycaster checks: Project coordinates on monthly timeline flowers
  updateRaycast() {
    if (this.isCinematicActive || !this.sm.controls.enabled) return;

    this.raycaster.setFromCamera(this.mouse, this.sm.camera);
    // Raycast standard flower meshes
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
        
        // Scale up float animation
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

    // Pan camera to look directly down on the selected flower
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

  // Flower 0: Spark
  drawSparkIllustration(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#ffebeb');
    grad.addColorStop(1, '#ffd6db');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this.drawWatercolorSplatter(ctx, w/2, h/2, 55, 'rgba(255, 51, 102, 0.45)');
    
    // Glowing core
    const core = ctx.createRadialGradient(w/2, h/2, 2, w/2, h/2, 25);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(0.5, '#ff66aa');
    core.addColorStop(1, 'rgba(255,51,102,0)');
    ctx.fillStyle = core;
    ctx.beginPath(); ctx.arc(w/2, h/2, 25, 0, Math.PI*2); ctx.fill();
  }

  // Flower 1: Sharing Coffee Mugs
  drawCoffeeIllustration(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#fbf8f3');
    grad.addColorStop(1, '#eae1d4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this.drawWatercolorSplatter(ctx, w/3, h/2 + 20, 35, '#8c6239');
    this.drawWatercolorSplatter(ctx, w * 0.66, h/2 + 20, 35, '#8c6239');

    // Coffee Mugs Silhouettes
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#6d4c2d';
    ctx.lineWidth = 3;
    
    // Mug Left
    ctx.beginPath(); ctx.roundRect(w/3 - 20, h/2 - 10, 40, 40, [4, 4, 15, 15]); ctx.fill(); ctx.stroke();
    // Handle
    ctx.beginPath(); ctx.arc(w/3 - 22, h/2 + 10, 8, -Math.PI/2, Math.PI/2, true); ctx.stroke();

    // Mug Right
    ctx.beginPath(); ctx.roundRect(w * 0.66 - 20, h/2 - 10, 40, 40, [4, 4, 15, 15]); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(w * 0.66 + 22, h/2 + 10, 8, -Math.PI/2, Math.PI/2, false); ctx.stroke();

    // Steam
    ctx.strokeStyle = 'rgba(140, 98, 57, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w/3 - 5, h/2 - 20); ctx.quadraticCurveTo(w/3 - 10, h/2 - 35, w/3, h/2 - 45);
    ctx.moveTo(w * 0.66 + 5, h/2 - 20); ctx.quadraticCurveTo(w * 0.66, h/2 - 35, w * 0.66 + 10, h/2 - 45);
    ctx.stroke();
  }

  // Flower 2: Heart parcel
  drawHeartParcelIllustration(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#fef0f3');
    grad.addColorStop(1, '#ffd6e0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this.drawWatercolorSplatter(ctx, w/2, h/2, 45, 'rgba(255,102,204,0.3)');

    // Parcel box
    ctx.fillStyle = '#d7ccc8';
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(w/2 - 35, h/2 - 25, 70, 50, 5);
    ctx.fill(); ctx.stroke();

    // Heart stamp
    ctx.fillStyle = '#ff3366';
    ctx.beginPath();
    ctx.moveTo(w/2, h/2 - 5);
    ctx.bezierCurveTo(w/2 - 10, h/2 - 15, w/2 - 15, h/2 + 5, w/2, h/2 + 15);
    ctx.bezierCurveTo(w/2 + 15, h/2 + 5, w/2 + 10, h/2 - 15, w/2, h/2 - 5);
    ctx.fill();
  }

  // Flower 3: Soft rain hitting window
  drawRainIllustration(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1c2833');
    grad.addColorStop(1, '#2c3e50');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this.drawWatercolorSplatter(ctx, w/2, h/2, 60, 'rgba(52, 152, 219, 0.25)');

    // Cottage window silhouette
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 4;
    ctx.strokeRect(w/2 - 50, h/2 - 50, 100, 100);
    ctx.beginPath();
    ctx.moveTo(w/2, h/2 - 50); ctx.lineTo(w/2, h/2 + 50);
    ctx.moveTo(w/2 - 50, h/2); ctx.lineTo(w/2 + 50, h/2);
    ctx.stroke();

    // Rain lines
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

  // Flower 4: Stars & Constellations
  drawConstellationIllustration(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#040613');
    grad.addColorStop(1, '#0e122b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this.drawWatercolorSplatter(ctx, w/2, h/2, 50, 'rgba(135, 206, 250, 0.2)');

    // Draw a small custom constellation
    const starCoords = [
      {x: w/2 - 60, y: h/2 + 30},
      {x: w/2 - 20, y: h/2 - 20},
      {x: w/2 + 30, y: h/2 - 10},
      {x: w/2 + 70, y: h/2 + 40}
    ];

    // Constellation lines
    ctx.strokeStyle = 'rgba(255,255,224,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(starCoords[0].x, starCoords[0].y);
    for (let i = 1; i < starCoords.length; i++) {
      ctx.lineTo(starCoords[i].x, starCoords[i].y);
    }
    ctx.stroke();

    // Star hubs
    ctx.fillStyle = '#ffffe0';
    starCoords.forEach(sc => {
      ctx.beginPath(); ctx.arc(sc.x, sc.y, 4, 0, Math.PI*2); ctx.fill();
    });
  }

  // Flower 5: Airplane flying through clouds
  drawFlightIllustration(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#f9d5e5');
    grad.addColorStop(1, '#eeac99');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this.drawWatercolorSplatter(ctx, w/3, h/2, 45, 'rgba(255,255,255,0.4)');
    this.drawWatercolorSplatter(ctx, w * 0.7, h/2 + 10, 50, 'rgba(255,255,255,0.4)');

    // Airplane silhouette
    ctx.fillStyle = '#5c4e4e';
    ctx.beginPath();
    ctx.moveTo(w/2 - 40, h/2 - 10);
    ctx.quadraticCurveTo(w/2 - 10, h/2 - 15, w/2 + 30, h/2 - 5); // fuselage
    ctx.lineTo(w/2 + 40, h/2 - 8);
    ctx.lineTo(w/2 + 38, h/2 - 2);
    ctx.lineTo(w/2 - 40, h/2);
    ctx.closePath();
    ctx.fill();

    // Wings
    ctx.beginPath();
    ctx.moveTo(w/2, h/2 - 6);
    ctx.lineTo(w/2 - 15, h/2 - 28);
    ctx.lineTo(w/2 - 5, h/2 - 28);
    ctx.lineTo(w/2 + 10, h/2 - 6);
    ctx.fill();
  }

  // Flower 6: Two islands and bridge
  drawBridgeIllustration(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#ffe3e8');
    grad.addColorStop(1, '#ffc2d1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this.drawWatercolorSplatter(ctx, w/2, h/2, 50, 'rgba(255, 102, 170, 0.25)');

    // Left island silhouette
    ctx.fillStyle = '#655459';
    ctx.beginPath();
    ctx.arc(w/4 - 10, h - 20, 45, 0, Math.PI*2);
    ctx.fill();

    // Right island silhouette
    ctx.beginPath();
    ctx.arc(w * 0.75 + 10, h - 15, 40, 0, Math.PI*2);
    ctx.fill();

    // Glowing Bridge Line
    ctx.strokeStyle = '#ffe480';
    ctx.shadowColor = '#ffa64d';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w/4 + 10, h - 35);
    ctx.quadraticCurveTo(w/2, h - 45, w * 0.75 - 10, h - 32);
    ctx.stroke();
    
    // reset shadow
    ctx.shadowBlur = 0;
  }

  // Watercolor splat helper
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
