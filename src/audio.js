// Procedural Romantic Orchestral Piano Synthesizer using Web Audio API
export class PianoSynth {
  constructor() {
    this.ctx = null;
    this.masterVolume = null;
    this.reverb = null;
    this.delay = null;
    this.isPlaying = false;
    this.schedulerTimer = null;
    this.nextNoteTime = 0.0;
    this.notePointer = 0;
    this.chordPointer = 0;

    // Beautiful Romantic Chord Progressions (MIDI values)
    // 1: Fmaj7 (F, A, C, E)
    // 2: G6 (G, B, D, E)
    // 3: Am9 (A, C, E, G, B)
    // 4: Em7 (E, G, B, D)
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
    this.tempo = 68; // Slow romantic tempo
    this.noteLength = 0.4; // duration of a 16th note approximately
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
    this.reverb = this.createReverb(4.5, 2.5);
    
    // Delay: Soft floating delay
    this.delay = this.ctx.createDelay(1.0);
    this.delayFeedback = this.ctx.createGain();
    this.delayFilter = this.ctx.createBiquadFilter();
    
    this.delay.delayTime.setValueAtTime(0.66, this.ctx.currentTime); // dotted eighth note delay
    this.delayFeedback.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.delayFilter.type = 'lowpass';
    this.delayFilter.frequency.setValueAtTime(1000, this.ctx.currentTime);

    // Wire up delay loop
    this.delay.connect(this.delayFilter);
    this.delayFilter.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delay);

    // Wire master channels
    // Synth -> Delay -> Reverb -> Master
    // Synth -> Reverb -> Master
    // Synth -> Master (dry)
    this.delay.connect(this.reverb);
    this.reverb.connect(this.masterVolume);
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
      // Create stereo width by slightly dephasing left/right noise
      left[i] = (Math.random() * 2 - 1) * envelope;
      right[i] = (Math.random() * 2 - 1) * envelope;
    }

    const convolver = this.ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }

  // Generate a piano-like note sound using additive/subtractive synthesis
  playPianoNote(midiNote, time, velocity = 0.5) {
    const freq = Math.pow(2, (midiNote - 69) / 12) * 440;
    
    // 1. Core strike oscillator (triangle for woody hollow punch)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);

    // 2. Brightness/harmonic oscillator (sine at 2nd harmonic)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, time);

    // 3. String resonance/air oscillator (sine at fundamental)
    const osc3 = this.ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq, time);

    // Gain nodes for volume envelopes
    const noteGain = this.ctx.createGain();
    const osc2Gain = this.ctx.createGain();
    
    osc2Gain.gain.setValueAtTime(0.12 * velocity, time);
    osc2Gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3); // Brightness dies quickly

    // Master volume envelope for this specific note (Piano ADSR)
    noteGain.gain.setValueAtTime(0.0, time);
    noteGain.gain.linearRampToValueAtTime(0.4 * velocity, time + 0.015); // soft strike attack
    noteGain.gain.exponentialRampToValueAtTime(0.12 * velocity, time + 0.8); // decay to sustain
    noteGain.gain.exponentialRampToValueAtTime(0.0001, time + 4.5); // long release

    // Lowpass filter envelope for natural warm damping
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(1, time);
    filter.frequency.setValueAtTime(1200, time);
    filter.frequency.exponentialRampToValueAtTime(350, time + 1.8); // mellow out over time

    // Connections
    osc1.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    osc3.connect(filter);

    // Soft warm compression before outputting to effects
    filter.connect(noteGain);
    
    // Send to reverb, delay, and dry output
    noteGain.connect(this.reverb);
    noteGain.connect(this.delay);
    
    // Limit direct dry signal to create a distant, dreamlike feel
    const dryGain = this.ctx.createGain();
    dryGain.gain.setValueAtTime(0.08, time);
    noteGain.connect(dryGain);
    dryGain.connect(this.masterVolume);

    // Start & Stop oscillators
    osc1.start(time);
    osc2.start(time);
    osc3.start(time);

    osc1.stop(time + 5.0);
    osc2.stop(time + 5.0);
    osc3.stop(time + 5.0);
  }

  // Soft pad strings to create the orchestra atmosphere
  playOrchestralPad(chord, time, duration = 4.0) {
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, time);

    const padGain = this.ctx.createGain();
    padGain.gain.setValueAtTime(0.0, time);
    padGain.gain.linearRampToValueAtTime(0.08, time + 1.5); // Slow attack
    padGain.gain.setValueAtTime(0.08, time + duration - 1.5);
    padGain.gain.linearRampToValueAtTime(0.0001, time + duration); // Slow release

    filter.connect(padGain);
    padGain.connect(this.reverb);

    // Play 3 voice chord using soft filtered sine/triangle waves
    const voices = [];
    const notesToPlay = [chord.notes[0] - 12, chord.notes[1], chord.notes[2]]; // bass + mids

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

  // Generative music scheduler
  scheduler() {
    // Schedule ahead 200ms
    while (this.nextNoteTime < this.ctx.currentTime + 0.2) {
      this.scheduleNextNote(this.notePointer, this.nextNoteTime);
      this.advanceNote();
    }
    this.schedulerTimer = setTimeout(() => this.scheduler(), 50);
  }

  advanceNote() {
    const secondsPerBeat = 60.0 / this.tempo;
    // Step sizes (16th note, 8th note, etc.)
    const step = 0.5 * secondsPerBeat; // 8th notes
    this.nextNoteTime += step;

    this.notePointer++;
    // Chord lasts 16 eighth notes (8 beats)
    if (this.notePointer >= 16) {
      this.notePointer = 0;
      this.chordPointer++;
      
      const progression = this.progressions[this.currentProgressionIdx];
      if (this.chordPointer >= progression.length) {
        this.chordPointer = 0;
        // Swap progressions occasionally for variety
        if (Math.random() < 0.3) {
          this.currentProgressionIdx = (this.currentProgressionIdx + 1) % this.progressions.length;
        }
      }
    }
  }

  scheduleNextNote(step, time) {
    const progression = this.progressions[this.currentProgressionIdx];
    const currentChord = progression[this.chordPointer];
    
    // Play root bass note on step 0
    if (step === 0) {
      this.playPianoNote(currentChord.root, time, 0.6); // Deep bass note
      this.playOrchestralPad(currentChord, time, 60.0 / this.tempo * 8); // Long orchestral pad
    }
    
    // Play root octave note on step 8
    if (step === 8) {
      this.playPianoNote(currentChord.root + 12, time, 0.4);
    }

    // Melodic arpeggio patterns
    // We decide whether to play a melodic note based on musical probability
    let playNote = false;
    let noteToPlay = 60;
    let velocity = 0.3;

    // Define custom arpeggio probabilities for romantic drifting feel
    const notePatterns = [0, 4, 6, 8, 10, 12, 14];
    if (notePatterns.includes(step) || (Math.random() < 0.4 && step % 2 === 1)) {
      playNote = true;
      
      // Select note from active chord
      // Root notes/lower notes on early steps, higher melodic notes on later steps
      const chordNotes = currentChord.notes;
      if (step < 6) {
        // Lower arpeggio
        noteToPlay = chordNotes[Math.floor(Math.random() * 3)];
        velocity = 0.2 + Math.random() * 0.15;
      } else {
        // High melody note
        noteToPlay = chordNotes[2 + Math.floor(Math.random() * (chordNotes.length - 2))];
        velocity = 0.25 + Math.random() * 0.2;
      }

      // Humanization: slight timing and velocity offsets
      const humanizedTime = time + (Math.random() * 2 - 1) * 0.015;
      this.playPianoNote(noteToPlay, humanizedTime, velocity);
    }
  }

  start() {
    this.init();
    if (this.isPlaying) return;
    
    this.ctx.resume();
    this.isPlaying = true;
    
    // Fade in master volume
    this.masterVolume.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterVolume.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.masterVolume.gain.linearRampToValueAtTime(0.7, this.ctx.currentTime + 3.0); // 3 seconds fade in

    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.notePointer = 0;
    this.chordPointer = 0;
    
    this.scheduler();
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    clearTimeout(this.schedulerTimer);
    
    if (this.masterVolume) {
      // Fade out master volume
      this.masterVolume.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterVolume.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.5);
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
      return true; // is now muted
    } else {
      this.start();
      return false; // is now playing
    }
  }
}
export const audioInstance = new PianoSynth();
