import * as Tone from 'tone';

export class AudioManager {
  private initialized = false;
  private muted = false;
  private eatSynth: Tone.Synth | null = null;
  private deathSynth: Tone.NoiseSynth | null = null;
  private deathTone: Tone.Synth | null = null;

  async init(): Promise<void> {
    if (this.initialized) return;
    await Tone.start();

    this.eatSynth = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.05 },
      volume: -12,
    }).toDestination();

    this.deathSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.1 },
      volume: -18,
    }).toDestination();

    this.deathTone = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.2 },
      volume: -15,
    }).toDestination();

    this.initialized = true;
  }

  playEat(): void {
    if (this.muted || !this.eatSynth) return;
    this.eatSynth.triggerAttackRelease('C5', '16n');
  }

  playDeath(): void {
    if (this.muted) return;
    this.deathSynth?.triggerAttackRelease('8n');
    this.deathTone?.triggerAttackRelease('C2', '4n');
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  get isMuted(): boolean {
    return this.muted;
  }
}
