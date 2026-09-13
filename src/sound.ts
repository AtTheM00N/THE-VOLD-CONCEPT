/** Opt-in, locally synthesized sound. Nothing downloads or records. */
export class VOLDsound {
  private context?: AudioContext
  private master?: GainNode
  private lastImpact = 0
  enabled = false
  async enable() {
    try {
      this.context ??= new AudioContext()
      if (!this.master) { this.master = this.context.createGain(); this.master.gain.value = 0.16; this.master.connect(this.context.destination) }
      await this.context.resume()
      this.enabled = true
      this.tone(220, 90, 0.12)
      return true
    } catch { return false }
  }
  mute() { this.enabled = false; void this.context?.suspend() }
  tone(from: number, to: number, duration: number, volume = 0.5) {
    if (!this.enabled || !this.context || !this.master || this.context.state !== 'running') return
    const ctx = this.context, now = ctx.currentTime, oscillator = ctx.createOscillator(), gain = ctx.createGain()
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(from, now)
    oscillator.frequency.exponentialRampToValueAtTime(to, now + duration)
    gain.gain.setValueAtTime(0.001, now); gain.gain.exponentialRampToValueAtTime(volume, now + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
    oscillator.connect(gain); gain.connect(this.master); oscillator.start(); oscillator.stop(now + duration)
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
  }
  impact(speed: number) {
    if (speed < 180 || performance.now() - this.lastImpact < 110) return
    this.lastImpact = performance.now(); this.tone(110, 38, 0.14, Math.min(0.6, speed / 1600))
  }
  dispose() { this.enabled = false; void this.context?.close() }
}
