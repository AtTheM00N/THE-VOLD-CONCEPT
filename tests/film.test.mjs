import test from 'node:test'
import assert from 'node:assert/strict'
import { cameraAt, productAt, SHOTS, shotAt, windowed } from '../src/film/timeline.ts'

test('the complete camera path remains finite and outside the product', () => {
  for (let step = 0; step <= 10000; step++) {
    const { position, target, fov } = cameraAt(step / 10000)
    assert.ok([...position, ...target, fov].every(Number.isFinite))
    assert.ok(Math.hypot(position[0], position[2]) > .7, 'camera never enters the can')
    assert.ok(fov >= 25 && fov <= 40, 'lens stays within its authored range')
    assert.ok(Math.hypot(...position.map((v, i) => v - target[i])) > .35, 'focus never crosses the lens')
  }
})

test('reversing and seeking reconstructs the identical camera pose without history', () => {
  const forward = Array.from({ length: 501 }, (_, i) => cameraAt(i / 500))
  for (let i = 500; i >= 0; i--) assert.deepEqual(cameraAt(i / 500), forward[i])
  assert.deepEqual(cameraAt(-1), cameraAt(0))
  assert.deepEqual(cameraAt(2), cameraAt(1))
})

test('small scroll steps cannot teleport the camera or its focus', () => {
  let previous = cameraAt(0)
  for (let i = 1; i <= 10000; i++) {
    const next = cameraAt(i / 10000)
    for (const field of ['position', 'target']) assert.ok(Math.hypot(...next[field].map((v, j) => v - previous[field][j])) < .035)
    previous = next
  }
})

test('the four held product shots identify the actual product and category order', () => {
  assert.deepEqual([.575, .67, .75, .835].map(productAt), [0, 1, 2, 3])
  assert.equal(productAt(.99), 0)
  assert.equal(shotAt(0), 0)
  assert.equal(shotAt(1), SHOTS.length - 1)
  assert.equal(windowed(.87, .891, .946, .965, .9), 1)
  assert.equal(windowed(.87, .891, .946, .965, .98), 0)
})
