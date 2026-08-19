export class AudioBus {
  private context?: AudioContext;
  constructor(private volume: number) {}

  setVolume(value: number): void { this.volume = value; }

  tone(frequency = 440, duration = .08, type: OscillatorType = 'sine', gain = .09): void {
    try {
      this.context ??= new AudioContext();
      const osc = this.context.createOscillator();
      const amp = this.context.createGain();
      osc.frequency.value = frequency;
      osc.type = type;
      amp.gain.setValueAtTime(gain * this.volume, this.context.currentTime);
      amp.gain.exponentialRampToValueAtTime(.0001, this.context.currentTime + duration);
      osc.connect(amp).connect(this.context.destination);
      osc.start(); osc.stop(this.context.currentTime + duration);
    } catch { /* Audio is optional. */ }
  }

  alert(): void { this.tone(170, .18, 'sawtooth', .12); }
  click(): void { this.tone(620, .045, 'square', .035); }
  success(): void { this.tone(760, .13, 'sine', .08); setTimeout(() => this.tone(980, .18, 'sine', .07), 90); }
  error(): void { this.tone(140, .24, 'square', .1); }
}
