import * as Tone from 'tone';

type MusicState = 'menu' | 'gameplay' | 'death' | 'off';

export class MusicPlayer {
  private initialized = false;
  private currentState: MusicState = 'off';
  private volume = -20;
  private muted = false;

  // Synths for each layer
  private menuPad: Tone.PolySynth | null = null;
  private menuLoop: Tone.Loop | null = null;

  private gameBassSynth: Tone.Synth | null = null;
  private gameBassLoop: Tone.Loop | null = null;
  private gameArpSynth: Tone.Synth | null = null;
  private gameArpLoop: Tone.Loop | null = null;

  private deathDrone: Tone.Synth | null = null;
  private deathLoop: Tone.Loop | null = null;

  async init(): Promise<void> {
    if (this.initialized) return;
    await Tone.start();

    // Menu: warm pad chords
    this.menuPad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.5, decay: 1.0, sustain: 0.6, release: 1.0 },
      volume: this.volume,
    }).toDestination();

    const menuChords = [['C3', 'E3', 'G3'], ['A2', 'C3', 'E3'], ['F2', 'A2', 'C3'], ['G2', 'B2', 'D3']];
    let menuIdx = 0;
    this.menuLoop = new Tone.Loop((time) => {
      if (this.muted || !this.menuPad) return;
      this.menuPad.triggerAttackRelease(menuChords[menuIdx % menuChords.length]!, '2n', time);
      menuIdx++;
    }, '1m');

    // Gameplay: bass line + arpeggio
    this.gameBassSynth = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.1 },
      volume: this.volume - 5,
    }).toDestination();

    const bassNotes = ['C2', 'C2', 'G2', 'A1', 'A1', 'F2', 'F2', 'G2'];
    let bassIdx = 0;
    this.gameBassLoop = new Tone.Loop((time) => {
      if (this.muted || !this.gameBassSynth) return;
      this.gameBassSynth.triggerAttackRelease(bassNotes[bassIdx % bassNotes.length]!, '8n', time);
      bassIdx++;
    }, '4n');

    this.gameArpSynth = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.05 },
      volume: this.volume - 10,
    }).toDestination();

    const arpNotes = ['C4', 'E4', 'G4', 'E4', 'C4', 'G3', 'A3', 'C4'];
    let arpIdx = 0;
    this.gameArpLoop = new Tone.Loop((time) => {
      if (this.muted || !this.gameArpSynth) return;
      this.gameArpSynth.triggerAttackRelease(arpNotes[arpIdx % arpNotes.length]!, '16n', time);
      arpIdx++;
    }, '8n');

    // Death: low drone
    this.deathDrone = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 1.0, decay: 2.0, sustain: 0.8, release: 2.0 },
      volume: this.volume - 3,
    }).toDestination();

    this.deathLoop = new Tone.Loop((time) => {
      if (this.muted || !this.deathDrone) return;
      this.deathDrone.triggerAttackRelease('C1', '2m', time);
    }, '2m');

    this.initialized = true;
  }

  transition(newState: MusicState): void {
    if (!this.initialized || newState === this.currentState) return;

    // Stop current
    this.stopAll();

    this.currentState = newState;

    // Start new
    switch (newState) {
      case 'menu':
        this.menuLoop?.start(0);
        Tone.getTransport().bpm.value = 70;
        Tone.getTransport().start();
        break;
      case 'gameplay':
        this.gameBassLoop?.start(0);
        this.gameArpLoop?.start(0);
        Tone.getTransport().bpm.value = 120;
        Tone.getTransport().start();
        break;
      case 'death':
        this.deathLoop?.start(0);
        Tone.getTransport().bpm.value = 60;
        Tone.getTransport().start();
        break;
      case 'off':
        break;
    }
  }

  private stopAll(): void {
    Tone.getTransport().stop();
    this.menuLoop?.stop(0);
    this.gameBassLoop?.stop(0);
    this.gameArpLoop?.stop(0);
    this.deathLoop?.stop(0);
  }

  setVolume(db: number): void {
    this.volume = db;
    if (this.menuPad) this.menuPad.volume.value = db;
    if (this.gameBassSynth) this.gameBassSynth.volume.value = db - 5;
    if (this.gameArpSynth) this.gameArpSynth.volume.value = db - 10;
    if (this.deathDrone) this.deathDrone.volume.value = db - 3;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  get isMuted(): boolean {
    return this.muted;
  }
}
