export const SHOTS = [
  { at: 0, name: 'A hairline in the dark', time: '00:00', cue: 'Enter the dark.' },
  { at: .06, name: 'The crown', time: '00:04', cue: 'Follow the light.' },
  { at: .14, name: 'Cold enough to touch', time: '00:10', cue: 'Closer.' },
  { at: .23, name: 'The can becomes architecture', time: '00:17', cue: 'Something is holding it in.' },
  { at: .34, name: 'Containment', time: '00:25', cue: 'Keep going.' },
  { at: .45, name: 'Breach', time: '00:33', cue: 'Containment is a suggestion.' },
  { at: .52, name: 'The original', time: '00:38', cue: 'Classic / Energy drink' },
  { at: .62, name: 'Green has teeth', time: '00:46', cue: 'Green Apple / Energy drink' },
  { at: .71, name: 'Heat, without fire', time: '00:52', cue: 'Ginger Ale / Sparkling mixer' },
  { at: .79, name: 'Clear the air', time: '00:58', cue: 'Tonic Water / Sparkling mixer' },
  { at: .87, name: 'The quiet', time: '01:04', cue: 'Let it settle.' },
  { at: .95, name: 'VOLD remains', time: '01:10', cue: 'No rules. Just VOLD.' },
] as const

export type FilmSignal = { progress: number; velocity: number; visible: boolean }
export const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
export const smooth = (a: number, b: number, p: number) => { const t = clamp01((p - a) / (b - a)); return t * t * (3 - 2 * t) }
export const windowed = (a: number, b: number, c: number, d: number, p: number) => smooth(a, b, p) * (1 - smooth(c, d, p))
export const shotAt = (p: number) => Math.max(0, SHOTS.findLastIndex(s => p >= s.at))
export const productAt = (p: number) => p >= .63 && p < .714 ? 1 : p >= .714 && p < .797 ? 2 : p >= .797 && p < .883 ? 3 : 0

// Nonuniform Hermite interpolation preserves camera velocity across shot boundaries.
const CAMERA = [
  [0, .10, 1.47, .92, .02, 1.42, .12, 29],
  [.06, .38, 1.61, 1.04, .04, 1.39, .07, 28],
  [.14, .88, 1.71, 1.25, .04, 1.29, .04, 28],
  [.23, .64, .44, .92, .08, .37, .34, 30],
  [.34, 1.65, .2, 3.6, 0, .1, 0, 34],
  [.425, -.2, .1, 5.6, 0, .1, 1.1, 30],
  [.455, .06, .08, 5.2, 0, .02, 1.1, 32],
  [.52, 2.35, .9, 6.6, 0, .06, 0, 35],
  [.62, 1.30, .45, 6.8, 0, -.02, 0, 33],
  [.71, -2.30, .75, 5.4, 0, .04, 0, 34],
  [.79, -1.45, 1.5, 5.2, 0, .18, 0, 35],
  [.87, 1.5, .55, 5.8, 0, .04, 0, 33],
  [.95, .7, .4, 6.7, 0, .05, 0, 32],
  [1, .6, .42, 7.4, 0, .1, 0, 32],
] as const

export function cameraAt(progress: number) {
  const p = clamp01(progress)
  const i = Math.min(CAMERA.length - 2, Math.max(0, CAMERA.findLastIndex(k => p >= k[0])))
  const a = CAMERA[i], b = CAMERA[i + 1], before = CAMERA[Math.max(0, i - 1)], after = CAMERA[Math.min(CAMERA.length - 1, i + 2)]
  const dt = b[0] - a[0], t = (p - a[0]) / dt, t2 = t * t, t3 = t2 * t
  const value = (k: number) => {
    const m0 = (b[k] - before[k]) / (b[0] - before[0]) * dt
    const m1 = (after[k] - a[k]) / (after[0] - a[0]) * dt
    return (2 * t3 - 3 * t2 + 1) * a[k] + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * b[k] + (t3 - t2) * m1
  }
  return { position: [value(1), value(2), value(3)] as [number, number, number], target: [value(4), value(5), value(6)] as [number, number, number], fov: value(7) }
}
