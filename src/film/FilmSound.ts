import { smooth, windowed } from './timeline'

/** A quiet, opt-in score; all progression is driven by the film playhead. */
export class FilmSound {
  private ctx?: AudioContext
  private master?: GainNode
  private bass?: OscillatorNode
  private bassGain?: GainNode
  private noiseGain?: GainNode
  private filter?: BiquadFilterNode
  private noise?: AudioBufferSourceNode
  private previous = 0
  private lastImpact = -10
  enabled = false
  async toggle() {
    if (this.enabled) { this.enabled = false; await this.ctx?.suspend(); return false }
    try {
      if (!this.ctx) {
        const ctx = new AudioContext(); this.ctx = ctx
        this.master = ctx.createGain(); this.master.gain.value = .14; this.master.connect(ctx.destination)
        this.bass = ctx.createOscillator(); this.bass.type = 'sine'; this.bass.frequency.value = 39
        this.bassGain = ctx.createGain(); this.bassGain.gain.value = 0
        this.bass.connect(this.bassGain); this.bassGain.connect(this.master); this.bass.start()
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), data = buffer.getChannelData(0)
        let previous = 0
        for (let i = 0; i < data.length; i++) { previous = (previous + (Math.random() * 2 - 1) * .025) / 1.025; data[i] = previous * 3.5 }
        this.noise = ctx.createBufferSource(); this.noise.buffer = buffer; this.noise.loop = true
        this.filter = ctx.createBiquadFilter(); this.filter.type = 'lowpass'; this.filter.frequency.value = 160
        this.noiseGain = ctx.createGain(); this.noiseGain.gain.value = 0
        this.noise.connect(this.filter); this.filter.connect(this.noiseGain); this.noiseGain.connect(this.master); this.noise.start()
      }
      await this.ctx.resume(); this.enabled = true; return true
    } catch { return false }
  }
  update(p: number, velocity: number, visible: boolean) {
    if (!this.ctx || !this.enabled) { this.previous = p; return }
    const t = this.ctx.currentTime, build = windowed(.23, .44, .47, .54, p), quiet = 1 - smooth(.855, .96, p)
    this.bassGain!.gain.setTargetAtTime(visible ? (.12 + build * .3) * quiet : 0, t, .2)
    this.noiseGain!.gain.setTargetAtTime(visible ? Math.min(.4, .03 + Math.abs(velocity) * 4 + build * .1) * quiet : 0, t, .13)
    this.filter!.frequency.setTargetAtTime(180 + build * 1600 + smooth(.62, .85, p) * 400, t, .13)
    this.bass!.frequency.setTargetAtTime(36 + build * 20, t, .13)
    if (visible && (p - .487) * (this.previous - .487) < 0 && Math.abs(p - this.previous) < .06 && t - this.lastImpact > 1.1) {
      this.lastImpact = t
      const osc = this.ctx.createOscillator(), gain = this.ctx.createGain(), reverse = p < this.previous
      osc.frequency.setValueAtTime(reverse ? 42 : 140, t); osc.frequency.exponentialRampToValueAtTime(reverse ? 140 : 32, t + .45)
      gain.gain.setValueAtTime(.001, t); gain.gain.exponentialRampToValueAtTime(.8, t + .02); gain.gain.exponentialRampToValueAtTime(.001, t + .6)
      osc.connect(gain); gain.connect(this.master!); osc.start(); osc.stop(t + .62)
      osc.onended = () => { osc.disconnect(); gain.disconnect() }
    }
    this.previous = p
  }
  dispose() { this.enabled = false; this.bass?.stop(); this.noise?.stop(); void this.ctx?.close() }
}
