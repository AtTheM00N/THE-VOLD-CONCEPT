export type Body = {
  id: string; x: number; y: number; w: number; h: number
  vx: number; vy: number; angle: number; spin: number
}
type Frame = Float64Array
const STRIDE = 6
export const HISTORY_LIMIT = 480
export const STEP = 1 / 60
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

/** Small deterministic typography simulation. No rendering or browser dependencies. */
export class RuleWorld {
  bodies: Body[]
  width: number
  height: number
  gravity = 1
  elapsed = 0
  private frames: (Frame | undefined)[] = new Array(HISTORY_LIMIT)
  private head = 0
  private count = 0
  private times = new Float64Array(HISTORY_LIMIT)
  private gravities = new Float64Array(HISTORY_LIMIT)
  constructor(bodies: Body[], width: number, height: number) {
    this.bodies = bodies.map(body => ({ ...body }))
    this.width = width
    this.height = height
  }
  get historySeconds() { return this.count * STEP }
  constrain() {
    for (const b of this.bodies) {
      const c = Math.abs(Math.cos(b.angle)), s = Math.abs(Math.sin(b.angle))
      const ex = Math.min(this.width / 2 - 1, (b.w * c + b.h * s) / 2)
      const ey = Math.min(this.height / 2 - 1, (b.h * c + b.w * s) / 2)
      b.x = clamp(b.x, ex, this.width - ex); b.y = clamp(b.y, ey, this.height - ey)
    }
  }
  save() {
    const frame = this.frames[this.head] ?? new Float64Array(this.bodies.length * STRIDE)
    this.bodies.forEach((b, i) => frame.set([b.x, b.y, b.vx, b.vy, b.angle, b.spin], i * STRIDE))
    this.frames[this.head] = frame
    this.times[this.head] = this.elapsed
    this.gravities[this.head] = this.gravity
    this.head = (this.head + 1) % HISTORY_LIMIT
    this.count = Math.min(this.count + 1, HISTORY_LIMIT)
  }
  rewind() {
    if (!this.count) return false
    this.head = (this.head - 1 + HISTORY_LIMIT) % HISTORY_LIMIT
    const frame = this.frames[this.head]!
    this.bodies.forEach((b, i) => {
      const k = i * STRIDE
      b.x = frame[k]; b.y = frame[k + 1]; b.vx = frame[k + 2]
      b.vy = frame[k + 3]; b.angle = frame[k + 4]; b.spin = frame[k + 5]
    })
    this.elapsed = this.times[this.head]
    this.gravity = this.gravities[this.head]
    this.count--
    return true
  }
  hit(x: number, y: number) {
    return this.bodies.findLastIndex(b => {
      const dx = x - b.x, dy = y - b.y, c = Math.cos(b.angle), s = Math.sin(b.angle)
      return Math.abs(dx * c + dy * s) < b.w / 2 + 8 && Math.abs(-dx * s + dy * c) < b.h / 2 + 8
    })
  }
  step(held = -1, target?: { x: number; y: number }) {
    this.save()
    this.elapsed += STEP
    let impact = 0
    this.bodies.forEach((b, i) => {
      if (i === held && target) {
        b.vx = clamp((target.x - b.x) * 18, -1600, 1600)
        b.vy = clamp((target.y - b.y) * 18, -1600, 1600)
        b.spin *= 0.9
      } else { b.vy += 920 * this.gravity * STEP }
      b.vx *= 0.997; b.vy *= 0.997; b.spin *= 0.996
      b.x += b.vx * STEP; b.y += b.vy * STEP; b.angle += b.spin * STEP
      // Rotation-aware bounds keep every piece reachable, including on narrow phones.
      const c = Math.abs(Math.cos(b.angle)), s = Math.abs(Math.sin(b.angle))
      const ex = Math.min(this.width / 2 - 1, (b.w * c + b.h * s) / 2)
      const ey = Math.min(this.height / 2 - 1, (b.h * c + b.w * s) / 2)
      if (b.x < ex || b.x > this.width - ex) { b.x = clamp(b.x, ex, this.width - ex); impact = Math.max(impact, Math.abs(b.vx)); b.vx *= -0.52; b.spin *= 0.7 }
      if (b.y < ey || b.y > this.height - ey) {
        b.y = clamp(b.y, ey, this.height - ey); impact = Math.max(impact, Math.abs(b.vy))
        b.vy *= -0.42; b.vx *= 0.92; b.spin *= 0.72
        if (Math.abs(b.vy) < 28) b.vy = 0
      }
    })
    // Soft collision cores let large words overlap at the edges without jittering piles.
    for (let i = 0; i < this.bodies.length; i++) for (let j = i + 1; j < this.bodies.length; j++) {
      const a = this.bodies[i], b = this.bodies[j]
      const ra = Math.min(a.w, a.h) * 0.42, rb = Math.min(b.w, b.h) * 0.42
      const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy)
      if (dist > 0 && dist < ra + rb) {
        const nx = dx / dist, ny = dy / dist, depth = (ra + rb - dist) * 0.5
        a.x -= nx * depth; a.y -= ny * depth; b.x += nx * depth; b.y += ny * depth
        const velocity = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
        if (velocity < 0) {
          const impulse = velocity * 0.65
          a.vx += nx * impulse; a.vy += ny * impulse; b.vx -= nx * impulse; b.vy -= ny * impulse
          a.spin += nx * 0.2; b.spin -= nx * 0.2
        }
      }
    }
    // Pair separation can push a neighbour across an edge; project once more after solving.
    this.constrain()
    return impact
  }
  scatter(seed: number, reduced = false) {
    let n = seed >>> 0
    const random = () => { n = (Math.imul(1664525, n) + 1013904223) >>> 0; return n / 4294967296 }
    this.bodies.forEach(b => { b.vx = (random() - 0.5) * (reduced ? 160 : 800); b.vy = -random() * (reduced ? 130 : 450); b.spin = (random() - 0.5) * (reduced ? 0.5 : 3) })
  }
}
