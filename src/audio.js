// Procedural Romantic Orchestral Piano & Dynamic Nature Soundscapes Synth using Web Audio API
export class PianoSynth {
  constructor() {
    this.ctx = null;
    this.masterVolume = null;
    this.reverb = null;
    this.delay = null;
    this.isPlaying = false;
    
    // Ambient sound sources
    this.noiseBuffer = null;
    this.windSource = null;
    this.windGain = null;
    this.rainSource = null;
    this.rainGain = null;
    
    // Volume scales for programmatically scheduled chirps
    this.birdsVolumeScale = 0.0;
    this.cricketVolumeScale = 0.0;
    
    // Scheduler properties
    this.schedulerTimer = null;
    this.nextNoteTime = 0.0;
    this.notePointer = 0;
    this.chordPointer = 0;

    // Current weather/atmosphere setting
    this.currentWeather = 'dawn';

    // Beautiful Romantic Chord Progressions (MIDI values)
    this.progressions = [
      [
        { root: 41, notes: [53, 57, 60, 64, 67, 72, 76] }, // Fmaj7 / Fmaj9
        { root: 43, notes: [55, 59, 62, 64, 67, 71, 74] }, // G6 / Gadd9
        { root: 45, notes: [57, 60, 64, 67, 71, 76, 79] }, // Am9
        { root: 40, notes: [52, 55, 59, 62, 67, 71, 74] }  // Em7 / Em11
      ],
      [
        { root: 45, notes: [57, 60, 64, 67, 71, 76, 79] }, // Am9
        { root: 41, notes: [53, 57, 60, 64, 67, 72, 76] }, // Fmaj9
        { root: 36, notes: [48, 52, 55, 59, 62, 67, 72] }, // Cmaj9
        { root: 43, notes: [55, 59, 62, 67, 71, 74, 79] }  // G6/9
      ]
    ];
    this.currentProgressionIdx = 0;

    // Musical timing configurations
    this.tempo = 64; // Relaxed romantic tempo
  }

  init() {
    if (this.ctx) return;

    // Create audio context
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Master volume
    this.masterVolume = this.ctx.createGain();
    this.masterVolume.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.masterVolume.connect(this.ctx.destination);

    // Reverb: Grand space reverb
    this.reverb = this.createReverb(5.0, 2.8);
    this.reverb.connect(this.masterVolume);
    
    // Delay: Soft floating delay
    this.delay = this.ctx.createDelay(1.0);
    this.delayFeedback = this.ctx.createGain();
    this.delayFilter = this.ctx.createBiquadFilter();
    
    this.delay.delayTime.setValueAtTime(0.70, this.ctx.currentTime); // dotted eighth delay
    this.delayFeedback.gain.setValueAtTime(0.38, this.ctx.currentTime);
    this.delayFilter.type = 'lowpass';
    this.delayFilter.frequency.setValueAtTime(900, this.ctx.currentTime);

    // Wire up delay loop
    this.delay.connect(this.delayFilter);
    this.delayFilter.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delay);

    this.delay.connect(this.reverb);

    // Initialize noise-based synths (Wind and Rain)
    this.createAmbianceSynths();
  }

  // Create a synthetic reverb impulse response (exponentially decaying white noise)
  createReverb(duration, decay) {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const percent = i / length;
      const envelope = Math.pow(1 - percent, decay);
      left[i] = (Math.random() * 2 - 1) * envelope;
      right[i] = (Math.random() * 2 - 1) * envelope;
    }

    const convolver = this.ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }

  // Generates shared 2-second white noise buffer
  createNoiseBuffer() {
    const bufferSize = this.ctx.sampleRate * 2.0;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  createAmbianceSynths() {
    this.noiseBuffer = this.createNoiseBuffer();

    // 1. Wind Synthesizer (White noise modulated by a lowpass sweep and slow LFO)
    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = this.noiseBuffer;
    this.windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.Q.setValueAtTime(3.5, this.ctx.currentTime); // resonance creates whistle
    this.windFilter.frequency.setValueAtTime(400, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.04, this.ctx.currentTime); // initial dawn level

    // Connect LFO to modulate filter cutoff dynamically on audio thread
    const windLfo = this.ctx.createOscillator();
    windLfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // slow sway frequency
    
    const windLfoGain = this.ctx.createGain();
    windLfoGain.gain.setValueAtTime(200, this.ctx.currentTime); // sweep width

    windLfo.connect(windLfoGain);
    windLfoGain.connect(this.windFilter.frequency);
    
    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.reverb);

    // Start wind oscillators
    windLfo.start();
    this.windSource.start();

    // 2. Rain Synthesizer (Highpass filtered white noise)
    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = this.noiseBuffer;
    this.rainSource.loop = true;

    this.rainFilter = this.ctx.createBiquadFilter();
    this.rainFilter.type = 'highpass';
    this.rainFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.0, this.ctx.currentTime); // start silent

    this.rainSource.connect(this.rainFilter);
    this.rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterVolume);
    this.rainSource.start();
  }

  // Soft piano oscillator trigger
  playPianoNote(midiNote, time, velocity = 0.5) {
    const freq = Math.pow(2, (midiNote - 69) / 12) * 440;
    
    // Core triangle strike for woody body
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);

    // Bright 2nd harmonic sine
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, time);

    // Air/sustain fundamental sine
    const osc3 = this.ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq, time);

    const noteGain = this.ctx.createGain();
    const osc2Gain = this.ctx.createGain();
    
    osc2Gain.gain.setValueAtTime(0.12 * velocity, time);
    osc2Gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    // Natural ADSR curve
    noteGain.gain.setValueAtTime(0.0, time);
    noteGain.gain.linearRampToValueAtTime(0.42 * velocity, time + 0.015); // soft strike attack
    noteGain.gain.exponentialRampToValueAtTime(0.14 * velocity, time + 0.7); // decay to sustain
    noteGain.gain.exponentialRampToValueAtTime(0.0001, time + 4.8); // release

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(1, time);
    filter.frequency.setValueAtTime(1100, time);
    filter.frequency.exponentialRampToValueAtTime(320, time + 2.0); // decay filter brightness

    osc1.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    osc3.connect(filter);

    filter.connect(noteGain);
    
    // Send to Reverb and Delay loops
    noteGain.connect(this.reverb);
    noteGain.connect(this.delay);
    
    const dryGain = this.ctx.createGain();
    dryGain.gain.setValueAtTime(0.06, time);
    noteGain.connect(dryGain);
    dryGain.connect(this.masterVolume);

    osc1.start(time);
    osc2.start(time);
    osc3.start(time);

    osc1.stop(time + 5.0);
    osc2.stop(time + 5.0);
    osc3.stop(time + 5.0);
  }

  // Soft string swell
  playOrchestralPad(chord, time, duration = 4.0) {
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, time);

    const padGain = this.ctx.createGain();
    padGain.gain.setValueAtTime(0.0, time);
    padGain.gain.linearRampToValueAtTime(0.07, time + 2.0); // slow swelling string attack
    padGain.gain.setValueAtTime(0.07, time + duration - 2.0);
    padGain.gain.linearRampToValueAtTime(0.0001, time + duration);

    filter.connect(padGain);
    padGain.connect(this.reverb);

    const voices = [];
    const notesToPlay = [chord.notes[0] - 12, chord.notes[1], chord.notes[2]];

    notesToPlay.forEach(note => {
      const freq = Math.pow(2, (note - 69) / 12) * 440;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      osc.connect(filter);
      osc.start(time);
      osc.stop(time + duration + 0.1);
      voices.push(osc);
    });
  }

  // Programmatic natural soundscape schedulers
  scheduleCricketChirp(time) {
    if (this.cricketVolumeScale <= 0.01) return;

    let t = time;
    const numChirps = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numChirps; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(4200 + Math.random() * 300, t);

      const chirpGain = this.ctx.createGain();
      chirpGain.gain.setValueAtTime(0.0, t);
      chirpGain.gain.linearRampToValueAtTime(0.07 * this.cricketVolumeScale, t + 0.01);
      chirpGain.gain.setValueAtTime(0.07 * this.cricketVolumeScale, t + 0.04);
      chirpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

      osc.connect(chirpGain);
      chirpGain.connect(this.reverb);
      osc.start(t);
      osc.stop(t + 0.1);

      t += 0.13; // gap
    }
  }

  scheduleBirdChirp(time) {
    if (this.birdsVolumeScale <= 0.01) return;

    let t = time;
    const numTweets = 2 + Math.floor(Math.random() * 3);
    const baseFreq = 2400 + Math.random() * 600;

    for (let i = 0; i < numTweets; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, t);
      // Sweep pitch upwards to simulate real birds
      osc.frequency.exponentialRampToValueAtTime(baseFreq + 1000, t + 0.07);

      const tweetGain = this.ctx.createGain();
      tweetGain.gain.setValueAtTime(0.0, t);
      tweetGain.gain.linearRampToValueAtTime(0.04 * this.birdsVolumeScale, t + 0.01);
      tweetGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);

      osc.connect(tweetGain);
      tweetGain.connect(this.reverb);
      osc.start(t);
      osc.stop(t + 0.08);

      t += 0.11;
    }
  }

  scheduleThunder(time) {
    if (this.currentWeather !== 'rain' || Math.random() > 0.15) return;

    // Distant rumble: Low frequency filtered noise
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(30 + Math.random() * 20, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(60, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0, time);
    gain.gain.linearRampToValueAtTime(0.35, time + 0.3); // swelling thunder
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 3.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterVolume);

    osc.start(time);
    osc.stop(time + 4.0);
  }

  // Generative music & ambient scheduler loop
  scheduler() {
    while (this.nextNoteTime < this.ctx.currentTime + 0.25) {
      this.scheduleNextNote(this.notePointer, this.nextNoteTime);
      
      // Schedule bird chirps occasionally during day/sunrise
      if (this.notePointer === 4 && Math.random() < 0.45) {
        this.scheduleBirdChirp(this.nextNoteTime + Math.random() * 0.5);
      }
      
      // Schedule cricket chirps during night
      if (this.notePointer === 12 && Math.random() < 0.65) {
        this.scheduleCricketChirp(this.nextNoteTime + Math.random() * 0.5);
      }

      // Schedule thunder rumbles during rain
      if (this.notePointer === 0) {
        this.scheduleThunder(this.nextNoteTime);
      }

      this.advanceNote();
    }
    this.schedulerTimer = setTimeout(() => this.scheduler(), 50);
  }

  advanceNote() {
    const secondsPerBeat = 60.0 / this.tempo;
    const step = 0.5 * secondsPerBeat; // 8th notes
    this.nextNoteTime += step;

    this.notePointer++;
    if (this.notePointer >= 16) {
      this.notePointer = 0;
      this.chordPointer++;
      
      const progression = this.progressions[this.currentProgressionIdx];
      if (this.chordPointer >= progression.length) {
        this.chordPointer = 0;
        if (Math.random() < 0.2) {
          this.currentProgressionIdx = (this.currentProgressionIdx + 1) % this.progressions.length;
        }
      }
    }
  }

  scheduleNextNote(step, time) {
    const progression = this.progressions[this.currentProgressionIdx];
    const currentChord = progression[this.chordPointer];
    
    // Play root bass note
    if (step === 0) {
      this.playPianoNote(currentChord.root, time, 0.55);
      this.playOrchestralPad(currentChord, time, 60.0 / this.tempo * 8);
    }
    
    if (step === 8) {
      this.playPianoNote(currentChord.root + 12, time, 0.35);
    }

    // Melodic notes selector
    const notePatterns = [0, 3, 6, 8, 11, 14];
    if (notePatterns.includes(step) || (Math.random() < 0.35 && step % 2 === 1)) {
      const chordNotes = currentChord.notes;
      let noteToPlay;
      let val = 0.3;

      if (step < 6) {
        noteToPlay = chordNotes[Math.floor(Math.random() * 3)];
        val = 0.22 + Math.random() * 0.12;
      } else {
        noteToPlay = chordNotes[2 + Math.floor(Math.random() * (chordNotes.length - 2))];
        val = 0.26 + Math.random() * 0.18;
      }

      const humanizedTime = time + (Math.random() * 2 - 1) * 0.012;
      this.playPianoNote(noteToPlay, humanizedTime, val);
    }
  }

  // Adjust volumes of procedural sound channels smoothly based on weather transitions
  fadeAmbiance(weather) {
    this.currentWeather = weather;
    if (!this.ctx) return;

    let targetWind = 0.03;
    let targetRain = 0.0;
    let targetBirds = 0.0;
    let targetCrickets = 0.0;

    switch (weather) {
      case 'sunny':
        targetWind = 0.02;
        targetRain = 0.0;
        targetBirds = 1.0;
        targetCrickets = 0.0;
        break;
      case 'golden':
        targetWind = 0.03;
        targetRain = 0.0;
        targetBirds = 0.65;
        targetCrickets = 0.45;
        break;
      case 'rain':
        targetWind = 0.08; // stormy wind
        targetRain = 0.18; // loud rain drops
        targetBirds = 0.0;
        targetCrickets = 0.0;
        break;
      case 'fog':
        targetWind = 0.06;
        targetRain = 0.0;
        targetBirds = 0.2;
        targetCrickets = 0.0;
        break;
      case 'night':
        targetWind = 0.02;
        targetRain = 0.0;
        targetBirds = 0.0;
        targetCrickets = 1.0; // chirping crickets
        break;
      case 'stars':
        targetWind = 0.01;
        targetRain = 0.0;
        targetBirds = 0.0;
        targetCrickets = 1.0;
        break;
      case 'dawn':
      default:
        targetWind = 0.03;
        targetRain = 0.0;
        targetBirds = 0.5;
        targetCrickets = 0.15;
        break;
    }

    const t = this.ctx.currentTime + 2.0; // fade duration 2s
    if (this.windGain) {
      this.windGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.windGain.gain.linearRampToValueAtTime(targetWind, t);
    }
    if (this.rainGain) {
      this.rainGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.rainGain.gain.linearRampToValueAtTime(targetRain, t);
    }
    
    // Scale programmable volumes
    this.birdsVolumeScale = targetBirds;
    this.cricketVolumeScale = targetCrickets;
  }

  start() {
    this.init();
    if (this.isPlaying) return;
    
    this.ctx.resume();
    this.isPlaying = true;
    
    // Fade in master volume
    this.masterVolume.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterVolume.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.masterVolume.gain.linearRampToValueAtTime(0.7, this.ctx.currentTime + 2.5);

    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.notePointer = 0;
    this.chordPointer = 0;
    
    // Set initial volumes based on default weather
    this.fadeAmbiance(this.currentWeather);

    this.scheduler();
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    clearTimeout(this.schedulerTimer);
    
    if (this.masterVolume) {
      this.masterVolume.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterVolume.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
      return true; // muted
    } else {
      this.start();
      return false; // playing
    }
  }
}
export const audioInstance = new PianoSynth();
