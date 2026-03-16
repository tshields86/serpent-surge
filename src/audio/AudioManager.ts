import * as Tone from 'tone';

export class AudioManager {
  private initialized = false;
  private muted = false;
  private eatSynth: Tone.Synth | null = null;
  private goldenEatSynth: Tone.PolySynth | null = null;
  private shrinkSynth: Tone.Synth | null = null;
  private deathSynth: Tone.NoiseSynth | null = null;
  private deathTone: Tone.Synth | null = null;
  private fanfareSynth: Tone.PolySynth | null = null;
  private chimeSynth: Tone.Synth | null = null;
  private whooshSynth: Tone.NoiseSynth | null = null;

  async init(): Promise<void> {
    if (this.initialized) return;
    await Tone.start();

    this.eatSynth = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.05 },
      volume: -12,
    }).toDestination();

    this.goldenEatSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.3 },
      volume: -10,
    }).toDestination();

    this.shrinkSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0, release: 0.1 },
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

    this.fanfareSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.2 },
      volume: -14,
    }).toDestination();

    this.chimeSynth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.4 },
      volume: -10,
    }).toDestination();

    this.whooshSynth = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0, release: 0.05 },
      volume: -20,
    }).toDestination();

    this.initialized = true;
  }

  playEat(): void {
    if (this.muted || !this.eatSynth) return;
    this.eatSynth.triggerAttackRelease('C5', '16n');
  }

  playGoldenEat(): void {
    if (this.muted || !this.goldenEatSynth) return;
    const now = Tone.now();
    this.goldenEatSynth.triggerAttackRelease(['C5', 'E5', 'G5'], '8n', now);
  }

  playShrinkEat(): void {
    if (this.muted || !this.shrinkSynth) return;
    this.shrinkSynth.triggerAttackRelease('E5', '16n');
    setTimeout(() => {
      this.shrinkSynth?.triggerAttackRelease('C5', '16n');
    }, 80);
  }

  playDeath(): void {
    if (this.muted) return;
    this.deathSynth?.triggerAttackRelease('8n');
    this.deathTone?.triggerAttackRelease('C2', '4n');
  }

  playWaveClear(): void {
    if (this.muted || !this.fanfareSynth) return;
    const now = Tone.now();
    this.fanfareSynth.triggerAttackRelease(['C5', 'E5'], '16n', now);
    this.fanfareSynth.triggerAttackRelease(['E5', 'G5'], '16n', now + 0.15);
  }

  playArenaClear(): void {
    if (this.muted || !this.fanfareSynth) return;
    const now = Tone.now();
    this.fanfareSynth.triggerAttackRelease(['C5', 'E5', 'G5'], '8n', now);
    this.fanfareSynth.triggerAttackRelease(['E5', 'G5', 'C6'], '8n', now + 0.2);
  }

  playPowerUpChime(): void {
    if (this.muted || !this.chimeSynth) return;
    const now = Tone.now();
    this.chimeSynth.triggerAttackRelease('G5', '16n', now);
    this.chimeSynth.triggerAttackRelease('C6', '8n', now + 0.1);
  }

  playNearMiss(): void {
    if (this.muted) return;
    this.whooshSynth?.triggerAttackRelease('16n');
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  get isMuted(): boolean {
    return this.muted;
  }
}
