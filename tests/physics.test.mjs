import test from 'node:test'
import assert from 'node:assert/strict'
import { RuleWorld, HISTORY_LIMIT, STEP } from '../src/physics.ts'

const body = (id, x, y, w = 60, h = 40) => ({ id, x, y, w, h, vx: 0, vy: 0, angle: 0, spin: 0 })
const makeWorld = () => new RuleWorld([body('one', 150, 100), body('two', 350, 250)], 640, 480)
const snapshot = world => ({ bodies: structuredClone(world.bodies), elapsed: world.elapsed, gravity: world.gravity })

test('rewind restores the exact recorded state, including gestures and gravity', () => {
  const world = makeWorld()
  const frames = []
  world.scatter(73)
  for (let frame = 0; frame < 100; frame++) {
    if (frame === 45) world.gravity = -1
    frames.push(snapshot(world))
    world.step(frame < 30 ? 0 : -1, { x: 450, y: 180 })
  }
  for (const expected of frames.reverse()) {
    assert.equal(world.rewind(), true)
    assert.deepEqual(snapshot(world), expected)
  }
  assert.equal(world.rewind(), false)
  assert.equal(world.historySeconds, 0)
})

test('history remains bounded and preserves the most recent eight seconds across wraparound', () => {
  const world = makeWorld()
  const frames = []
  for (let frame = 0; frame < HISTORY_LIMIT * 3 + 37; frame++) {
    frames.push(snapshot(world))
    world.step()
    assert.ok(world.historySeconds <= 8)
  }
  assert.equal(world.historySeconds, HISTORY_LIMIT * STEP)
  for (const expected of frames.slice(-HISTORY_LIMIT).reverse()) {
    assert.equal(world.rewind(), true)
    assert.deepEqual(snapshot(world), expected)
  }
  const earliest = snapshot(world)
  assert.equal(world.rewind(), false)
  assert.deepEqual(snapshot(world), earliest)
})

test('resuming after rewind makes a new branch without restoring discarded future frames', () => {
  const world = makeWorld()
  for (let i = 0; i < 80; i++) world.step()
  for (let i = 0; i < 30; i++) world.rewind()
  const branchPoint = snapshot(world)
  const newFrames = []
  world.scatter(999)
  for (let i = 0; i < 20; i++) {
    newFrames.push(snapshot(world))
    world.step(0, { x: 550, y: 70 })
  }
  for (const expected of newFrames.reverse()) {
    world.rewind()
    assert.deepEqual(snapshot(world), expected)
  }
  assert.equal(world.elapsed, branchPoint.elapsed)
  assert.equal(world.historySeconds, 50 * STEP)
})

test('seeded starting impulses and simulation are deterministic without mutating inputs', () => {
  const input = [body('one', 150, 100)]
  const original = structuredClone(input)
  const a = new RuleWorld(input, 640, 480)
  const b = new RuleWorld(input, 640, 480)
  const c = new RuleWorld(input, 640, 480)
  a.scatter(0); b.scatter(0)
  c.scatter(1)
  assert.notDeepEqual(c.bodies, a.bodies)
  for (let i = 0; i < 240; i++) { a.step(); b.step() }
  assert.deepEqual(snapshot(a), snapshot(b))
  assert.deepEqual(input, original)
})

test('hit testing follows rotation and selects the topmost overlapping piece', () => {
  const world = new RuleWorld([body('bottom', 100, 100, 140, 20), body('top', 100, 100, 140, 20)], 640, 480)
  world.bodies[1].angle = Math.PI / 2
  assert.equal(world.hit(100, 155), 1)
  assert.equal(world.hit(155, 100), 0)
  assert.equal(world.hit(100, 100), 1)
  assert.equal(world.hit(500, 400), -1)
})

test('strong throws remain finite and isolated bodies stay inside rotation-aware boundaries', () => {
  const world = new RuleWorld([body('mobile-word', 160, 200, 150, 70)], 320, 500)
  for (let i = 0; i < 1200; i++) {
    if (i % 200 === 0) { world.scatter(i); world.gravity *= -1 }
    world.step(i % 20 < 10 ? 0 : -1, { x: i % 2 ? -5000 : 5000, y: i % 2 ? 5000 : -5000 })
    const b = world.bodies[0]
    for (const key of ['x', 'y', 'vx', 'vy', 'angle', 'spin']) assert.ok(Number.isFinite(b[key]))
    const ex = (b.w * Math.abs(Math.cos(b.angle)) + b.h * Math.abs(Math.sin(b.angle))) / 2
    const ey = (b.h * Math.abs(Math.cos(b.angle)) + b.w * Math.abs(Math.sin(b.angle))) / 2
    assert.ok(b.x >= ex - 1e-9 && b.x <= world.width - ex + 1e-9)
    assert.ok(b.y >= ey - 1e-9 && b.y <= world.height - ey + 1e-9)
  }
})

test('reduced-motion impulses are smaller for the same seeded incident', () => {
  const normal = makeWorld(), reduced = makeWorld()
  normal.scatter(57); reduced.scatter(57, true)
  normal.bodies.forEach((b, i) => {
    assert.ok(Math.abs(reduced.bodies[i].vx) < Math.abs(b.vx))
    assert.ok(Math.abs(reduced.bodies[i].vy) < Math.abs(b.vy))
    assert.ok(Math.abs(reduced.bodies[i].spin) < Math.abs(b.spin))
  })
})

test('pair separation cannot push a piece beyond the stage boundaries', () => {
  const world = new RuleWorld([body('left', 50, 450, 100, 100), body('right', 100, 450, 100, 100)], 320, 500)
  world.step()
  for (const b of world.bodies) {
    assert.ok(b.x - b.w / 2 >= 0, `${b.id} escaped the left edge`)
    assert.ok(b.x + b.w / 2 <= world.width, `${b.id} escaped the right edge`)
    assert.ok(b.y - b.h / 2 >= 0, `${b.id} escaped the top edge`)
    assert.ok(b.y + b.h / 2 <= world.height, `${b.id} escaped the bottom edge`)
  }
})

test('overlapping mobile piles stay finite and reachable through throws, flips, grabs, and rewind', () => {
  const pieces = Array.from({ length: 10 }, (_, i) => body(`piece-${i}`, 120 + i % 3 * 15, 300 + i % 4 * 20, 80 + i % 3 * 15, 35 + i % 4 * 10))
  const world = new RuleWorld(pieces, 320, 500)
  for (let frame = 0; frame < 1800; frame++) {
    if (frame % 113 === 0) world.scatter(frame)
    if (frame % 157 === 0) world.gravity *= -1
    if (frame % 251 === 0) for (let i = 0; i < 30; i++) world.rewind()
    world.step(frame % 7 === 0 ? frame % pieces.length : -1, { x: frame % 2 ? -1000 : 2000, y: frame % 3 ? 2000 : -1000 })
    for (const b of world.bodies) {
      for (const key of ['x', 'y', 'vx', 'vy', 'angle', 'spin']) assert.ok(Number.isFinite(b[key]), `${b.id}.${key} became non-finite`)
      const ex = (b.w * Math.abs(Math.cos(b.angle)) + b.h * Math.abs(Math.sin(b.angle))) / 2
      const ey = (b.h * Math.abs(Math.cos(b.angle)) + b.w * Math.abs(Math.sin(b.angle))) / 2
      assert.ok(b.x >= ex - 1e-9 && b.x <= world.width - ex + 1e-9, `${b.id} escaped horizontal bounds at frame ${frame}`)
      assert.ok(b.y >= ey - 1e-9 && b.y <= world.height - ey + 1e-9, `${b.id} escaped vertical bounds at frame ${frame}`)
    }
  }
})
