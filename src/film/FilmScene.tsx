import { Component, Suspense, useEffect, useMemo, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, MeshReflectorMaterial } from '@react-three/drei'
import gsap from 'gsap'
import { CanvasTexture, Color, DoubleSide, ExtrudeGeometry, Object3D, Path, RepeatWrapping, Shape, SRGBColorSpace, Vector3 } from 'three'
import type { DirectionalLight, Group, InstancedMesh, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, ShaderMaterial, SpotLight } from 'three'
import { products } from '../data'
import { cameraAt, productAt, smooth, windowed } from './timeline'
import type { FilmSignal } from './timeline'

type Props = { signal: RefObject<FilmSignal>; reduced: boolean; onReady: () => void }
const metal = { color: '#bec3c8', metalness: 1, roughness: .2 }

function makeLabel(index: number) {
  const product = products[index], canvas = document.createElement('canvas')
  canvas.width = 2048; canvas.height = 2048
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#101114'; ctx.fillRect(0, 0, 2048, 2048)
  // Printed grain belongs to the coating; it is not animated noise.
  let seed = 137
  for (let i = 0; i < 38000; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const x = seed % 2048; seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    ctx.fillStyle = i % 3 ? '#191a1c' : '#292b2d'; ctx.fillRect(x, seed % 2048, 1, 2)
  }
  ctx.textAlign = 'center'; ctx.fillStyle = '#deded8'; ctx.font = '500 38px "DM Sans Variable",sans-serif'
  ctx.fillText(index < 2 ? 'ENERGY DRINK' : 'SPARKLING MIXER', 1024, 139)
  ctx.font = '500 25px "DM Sans Variable",sans-serif'; ctx.fillText('ORIGINAL VOLD ATTITUDE', 1024, 191)
  ctx.fillStyle = product.color; ctx.fillRect(0, 1830, 2048, 120)
  ctx.fillStyle = '#080909'; ctx.font = '700 40px "Barlow Condensed",sans-serif'; ctx.fillText(product.label, 1024, 1910)
  ctx.save(); ctx.translate(1030, 990); ctx.rotate(-Math.PI / 2)
  ctx.font = '800 455px "Barlow Condensed",Impact,sans-serif'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#efeee6'
  ctx.fillText('VOLD', 0, 0)
  const w = ctx.measureText('VOLD').width, o = -w / 2 + ctx.measureText('V').width + ctx.measureText('O').width / 2
  ctx.translate(o, 0); ctx.fillStyle = product.color; ctx.beginPath()
  ctx.moveTo(22, -162); ctx.lineTo(-87, 12); ctx.lineTo(-8, 12); ctx.lineTo(-24, 160); ctx.lineTo(89, -38); ctx.lineTo(13, -38); ctx.closePath(); ctx.fill(); ctx.restore()
  ctx.font = '400 34px "DM Sans Variable",sans-serif'; ctx.fillStyle = '#b4b4b0'; ctx.fillText('250 ml', 1024, 1740)
  ctx.save(); ctx.translate(380, 1030); ctx.rotate(-Math.PI / 2); ctx.font = '500 27px "DM Sans Variable",sans-serif'; ctx.fillText('BORN IN INDIA. MADE TO STAND OUT.', 0, 0); ctx.restore()
  const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; texture.anisotropy = 4
  return texture
}

function makeSurface() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256
  const ctx = c.getContext('2d')!, pixels = ctx.createImageData(256, 256)
  let n = 99
  for (let i = 0; i < pixels.data.length; i += 4) { n = (Math.imul(n, 1103515245) + 12345) >>> 0; const v = 105 + n % 48; pixels.data[i] = v; pixels.data[i + 1] = v; pixels.data[i + 2] = v; pixels.data[i + 3] = 255 }
  ctx.putImageData(pixels, 0, 0)
  const map = new CanvasTexture(c); map.wrapS = map.wrapT = RepeatWrapping; map.repeat.set(7, 9)
  return map
}

function lidTab() {
  const shape = new Shape(); shape.absellipse(0, 0, .102, .195, 0, Math.PI * 2, false, 0)
  const hole = new Path(); hole.absellipse(0, -.047, .057, .103, 0, Math.PI * 2, true, 0); shape.holes.push(hole)
  return new ExtrudeGeometry(shape, { depth: .014, steps: 1, bevelEnabled: true, bevelSize: .004, bevelThickness: .004, bevelSegments: 2, curveSegments: 32 })
}

function Condensation({ mobile }: { mobile: boolean }) {
  const ref = useRef<InstancedMesh>(null)
  const count = mobile ? 90 : 240
  useEffect(() => {
    const dummy = new Object3D(); let seed = 41
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2, y = (random() - .5) * 2.5, radius = .006 + Math.pow(random(), 3) * .026
      dummy.position.set(Math.sin(angle) * .536, y, Math.cos(angle) * .536)
      dummy.rotation.set(0, angle, 0); dummy.scale.set(radius, radius * (1.1 + random() * .6), radius * .55)
      dummy.updateMatrix(); ref.current!.setMatrixAt(i, dummy.matrix)
    }
    ref.current!.instanceMatrix.needsUpdate = true
  }, [count])
  return <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}><sphereGeometry args={[1, 10, 8]} /><meshPhysicalMaterial color="#ffffff" metalness={0} roughness={.045} clearcoat={1} clearcoatRoughness={.02} envMapIntensity={1.1} transmission={mobile ? 0 : .8} thickness={.012} ior={1.33} transparent opacity={mobile ? .35 : .85} depthWrite={false} /></instancedMesh>
}

function Product({ signal }: { signal: RefObject<FilmSignal> }) {
  const ref = useRef<Group>(null), coating = useRef<MeshStandardMaterial>(null)
  const { size } = useThree(), mobile = size.width < 760
  const textures = useMemo(() => products.map((_, i) => makeLabel(i)), [])
  const surface = useMemo(() => makeSurface(), []), tab = useMemo(() => lidTab(), [])
  useEffect(() => () => { textures.forEach(t => t.dispose()); surface.dispose(); tab.dispose() }, [textures, surface, tab])
  const previous = useRef(-1)
  useFrame(({ camera }) => {
    const p = signal.current.progress, index = productAt(p)
    if (coating.current && previous.current !== index) { coating.current.map = textures[index]; coating.current.needsUpdate = true; previous.current = index }
    if (!ref.current) return
    const reveal = smooth(.48, .54, p)
    ref.current.rotation.y = Math.atan2(camera.position.x, camera.position.z) * reveal + .1 * Math.sin(p * 9) * reveal
    ref.current.rotation.z = windowed(.455, .5, .55, .62, p) * -.065
    ref.current.position.y = windowed(.46, .51, .54, .62, p) * .08
  })
  return <group ref={ref}>
    <mesh><cylinderGeometry args={[.53, .53, 2.64, 96, 1, true, Math.PI]} /><meshStandardMaterial ref={coating} map={textures[0]} metalness={.63} roughness={.31} bumpMap={surface} bumpScale={.0008} envMapIntensity={1.3} /></mesh>
    {[-1, 1].map(side => <group key={side} position={[0, side * 1.34, 0]}>
      <mesh><cylinderGeometry args={side > 0 ? [.475, .53, .12, 64] : [.53, .476, .12, 64]} /><meshStandardMaterial {...metal} color="#8b9198" roughness={.28} /></mesh>
      <mesh position={[0, side * .069, 0]}><cylinderGeometry args={[.48, .48, .027, 64]} /><meshStandardMaterial {...metal} bumpMap={surface} bumpScale={.00045} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, side * .083, 0]}><torusGeometry args={[.483, .018, 8, 96]} /><meshStandardMaterial {...metal} roughness={.12} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, side * .085, 0]}><torusGeometry args={[.429, .006, 5, 64]} /><meshStandardMaterial {...metal} color="#727b86" /></mesh>
    </group>)}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.428, -.22]} scale={[.12, .16, 1]}><circleGeometry args={[1, 32]} /><meshStandardMaterial color="#111317" metalness={.7} roughness={.32} /></mesh>
    <mesh geometry={tab} rotation={[-Math.PI / 2, 0, .1]} position={[0, 1.447, .055]}><meshStandardMaterial {...metal} roughness={.18} bumpMap={surface} bumpScale={.0003} /></mesh>
    <mesh position={[0, 1.448, .058]}><sphereGeometry args={[.027, 16, 8]} /><meshStandardMaterial {...metal} roughness={.16} /></mesh>
    <Condensation mobile={mobile} />
  </group>
}

const liquidVertex = `varying vec2 vUv; varying vec3 vPos; void main(){vUv=uv;vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`
const liquidFragment = `
varying vec2 vUv; uniform float uProgress; uniform vec3 uColor;
void main(){vec2 p=vUv;float t=uProgress*20.;float wave=sin(p.x*24.-t)*.06+sin(p.x*41.+t*.7)*.02;
float body=1.-smoothstep(.12,.22,abs(p.y-.5+wave));float edge=exp(-abs(abs(p.y-.5+wave)-.16)*160.);
float ripple=pow(max(0.,sin(p.x*43.+p.y*14.-t)),16.);vec3 c=mix(uColor*.12,vec3(.7,.78,.8),edge*.9)+uColor*ripple*.3;
gl_FragColor=vec4(c,body*.8+edge*.16);}`

const seamEdge = [[.26, 4], [.26, 1.2], [-.22, .06], [.24, .06], [-.25, -1.35], [-.25, -4]]
function shutterShape(side: number) {
  const s = new Shape(); s.moveTo(side * 5, 4)
  for (const [x, y] of seamEdge) s.lineTo(x, y)
  s.lineTo(side * 5, -4); s.closePath()
  return new ExtrudeGeometry(s, { depth: .18, bevelEnabled: true, bevelSize: .025, bevelThickness: .025, bevelSegments: 1, steps: 1 })
}

function Chamber({ signal }: { signal: RefObject<FilmSignal> }) {
  const rings = useRef<Group>(null), fins = useRef<Group>(null), warm = useRef<Group>(null), glass = useRef<Group>(null), shutters = useRef<Group>(null), ribbon = useRef<Mesh>(null), fluid = useRef<ShaderMaterial>(null)
  const left = useMemo(() => shutterShape(-1), []), right = useMemo(() => shutterShape(1), [])
  const seamMaterial = useRef<MeshBasicMaterial>(null)
  const seam = useMemo(() => {
    const s = new Shape(); s.moveTo(seamEdge[0][0] - .065, seamEdge[0][1])
    seamEdge.slice(1).forEach(([x, y]) => s.lineTo(x - .065, y))
    seamEdge.toReversed().forEach(([x, y]) => s.lineTo(x + .065, y)); s.closePath(); return s
  }, [])
  const liquid = useMemo(() => ({ uProgress: { value: 0 }, uColor: { value: new Color('#ff3131') } }), [])
  const colors = useMemo(() => products.map(p => new Color(p.color)), [])
  useEffect(() => () => { left.dispose(); right.dispose() }, [left, right])
  useFrame(() => {
    const p = signal.current.progress, release = smooth(.466, .52, p), end = 1 - smooth(.865, .95, p)
    if (rings.current) {
      rings.current.visible = p > .19 && p < .72
      rings.current.rotation.y = p * 1.7
      rings.current.children.forEach((ring, i) => { ring.position.y = -1.6 + i * .55; ring.scale.setScalar(1 + release * 1.2); ring.rotation.x = release * .09 * (i % 2 ? 1 : -1) })
    }
    if (shutters.current) {
      shutters.current.visible = p > .30 && p < .61
      shutters.current.position.z = -3 + smooth(.30, .365, p) * 4.1
      shutters.current.children.slice(0, 2).forEach((panel, i) => { const side = i ? 1 : -1; panel.position.x = side * (.052 + release * 5.6); panel.rotation.y = side * release * .45 })
      if (seamMaterial.current) seamMaterial.current.opacity = (1 - release) * smooth(.345, .38, p)
    }
    if (fins.current) {
      const weight = windowed(.605, .635, .704, .734, p); fins.current.visible = weight > .001
      fins.current.children.forEach((fin, i) => { const a = i / 14 * Math.PI * 2; fin.position.set(Math.sin(a) * (2.5 + (1 - weight) * 8), .15, Math.cos(a) * (2.5 + (1 - weight) * 8)); fin.rotation.y = -a + p * 5; fin.rotation.z = Math.sin(i) * .12 })
    }
    if (warm.current) {
      const weight = windowed(.696, .727, .784, .81, p); warm.current.visible = weight > .001
      warm.current.scale.setScalar(.7 + weight * .3); warm.current.rotation.y = p * 8
      warm.current.children.forEach((band, i) => { band.rotation.z = p * 2.5 + i * .8; band.rotation.x = .45 + i * .28; band.position.y = -.35 + i * .58 })
    }
    if (glass.current) {
      const weight = windowed(.778, .811, .865, .901, p); glass.current.visible = weight > .001
      glass.current.children.forEach((plane, i) => { plane.position.x = (i - 3) * (1.0 + (1 - weight) * 3); plane.position.z = -2.8 - Math.sin(i) * 1.3; plane.rotation.y = .35 + p * 2 + i * .12 })
    }
    if (ribbon.current && fluid.current) {
      ribbon.current.visible = p > .22 && p < .925
      ribbon.current.rotation.z = -.25 + Math.sin(p * 9) * .25
      ribbon.current.position.y = -1.28 + release * .23
      ribbon.current.scale.set(8 * end, 2.5, 1)
      fluid.current.uniforms.uProgress.value = p; fluid.current.uniforms.uColor.value.copy(colors[productAt(p)])
    }
  })
  return <>
    <group ref={rings}>{Array.from({ length: 6 }, (_, i) => <mesh key={i} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[2.15 + i * .17, .07, 6, 64]} /><meshStandardMaterial color="#272a30" metalness={.95} roughness={.24} /></mesh>)}</group>
    <group ref={shutters}><mesh geometry={left}><meshStandardMaterial color="#15181e" metalness={.85} roughness={.28} /></mesh><mesh geometry={right}><meshStandardMaterial color="#15181e" metalness={.85} roughness={.28} /></mesh><mesh position={[0, 0, -.025]}><shapeGeometry args={[seam]} /><meshBasicMaterial ref={seamMaterial} color="#ff4538" transparent toneMapped={false} /></mesh></group>
    <group ref={fins}>{Array.from({ length: 14 }, (_, i) => <group key={i}><mesh><boxGeometry args={[.12, 4.8, 1.1]} /><meshStandardMaterial color="#121816" metalness={.85} roughness={.15} /></mesh><mesh position={[.066, 0, .5]}><boxGeometry args={[.008, 4.7, .018]} /><meshBasicMaterial color="#39ff14" /></mesh></group>)}</group>
    <group ref={warm}>{[0, 1, 2].map(i => <mesh key={i} rotation={[.4, 0, 0]}><torusGeometry args={[1.9 + i * .43, .105, 8, 96, Math.PI * 1.65]} /><meshStandardMaterial color="#be7130" metalness={.94} roughness={.14} /></mesh>)}</group>
    <group ref={glass}>{Array.from({ length: 7 }, (_, i) => <group key={i}><mesh><boxGeometry args={[.05, 5, 1.8]} /><meshPhysicalMaterial color="#56828a" metalness={.4} roughness={.06} transparent opacity={.3} depthWrite={false} clearcoat={1} /></mesh><mesh position={[.03, 0, .89]}><boxGeometry args={[.008, 5, .014]} /><meshBasicMaterial color="#88eaff" /></mesh></group>)}</group>
    <mesh ref={ribbon} position={[0, -1.28, -.65]}><planeGeometry args={[1, 1]} /><shaderMaterial ref={fluid} uniforms={liquid} vertexShader={liquidVertex} fragmentShader={liquidFragment} transparent depthWrite={false} side={DoubleSide} /></mesh>
  </>
}

function Stage(props: Props) {
  const { size, invalidate } = useThree()
  const { signal, onReady } = props
  const key = useRef<DirectionalLight>(null), rim = useRef<DirectionalLight>(null), red = useRef<SpotLight>(null)
  const focal = useMemo(() => new Vector3(), []), colors = useMemo(() => products.map(p => new Color(p.color)), [])
  useEffect(() => {
    let previous = -1
    const tick = () => { if (signal.current.visible && previous !== signal.current.progress) { previous = signal.current.progress; invalidate() } }
    gsap.ticker.add(tick); onReady(); invalidate()
    return () => gsap.ticker.remove(tick)
  }, [signal, onReady, invalidate])
  useFrame(({ camera, gl }) => {
    const p = props.signal.current.progress, frame = cameraAt(p), lens = camera as PerspectiveCamera
    focal.fromArray(frame.target); lens.position.fromArray(frame.position)
    if (size.width < 760) lens.position.sub(focal).multiplyScalar(1 + smooth(.45, .54, p) * .42).add(focal)
    lens.fov = frame.fov; lens.lookAt(focal); lens.updateProjectionMatrix()
    const reveal = smooth(.475, .545, p), discover = smooth(0, .105, p), quiet = smooth(.87, .97, p)
    gl.toneMappingExposure = .25 + discover * .75
    if (key.current) key.current.intensity = (.035 + discover * .85 + reveal * 2.1) * (1 - quiet * .18)
    if (rim.current) { rim.current.color.copy(colors[productAt(p)]); rim.current.intensity = .15 + discover * .65 + reveal * 1.2 }
    if (red.current) { red.current.intensity = 8 + windowed(.32, .452, .49, .53, p) * 75; red.current.color.copy(colors[productAt(p)]) }
  })
  return <>
    <color attach="background" args={['#000000']} /><fog attach="fog" args={['#000000', 8, 24]} />
    <ambientLight intensity={.025} />
    <directionalLight ref={key} position={[-3, 4, 5]} intensity={1} color="#eef3ff" />
    <directionalLight ref={rim} position={[3, 1, -2]} intensity={1} color="#ff3131" />
    <spotLight ref={red} position={[0, 3, 2]} angle={.52} penumbra={.6} intensity={20} distance={12} color="#ff3131" />
    <Environment frames={1} resolution={size.width < 760 ? 128 : 256} environmentIntensity={.8}>
      <Lightformer intensity={4} position={[-3, 1, 3]} scale={[.8, 7, 1]} rotation={[0, .4, 0]} />
      <Lightformer intensity={3} position={[3, 1, 1]} scale={[.35, 8, 1]} rotation={[0, -.5, 0]} />
      <Lightformer intensity={2} position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[4, 2, 1]} />
      <Lightformer intensity={.5} position={[0, 0, 5]} scale={[3, 5, 1]} />
    </Environment>
    <Product signal={props.signal} /><Chamber signal={props.signal} />
    <mesh position={[0, -1.455, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[50, 50]} /><MeshReflectorMaterial resolution={size.width < 760 ? 128 : 256} blur={[100, 20]} mixBlur={1} mixStrength={2.5} roughness={.38} metalness={.75} color="#111216" mirror={.6} depthScale={.3} minDepthThreshold={.5} maxDepthThreshold={1.2} /></mesh>
  </>
}

function Fallback() {
  return <div className="film-fallback"><img src="/images/can_classic.webp" alt="VOLD Classic energy drink" /><p>Your browser is showing the still edition.</p><a href="#range">Explore the drinks →</a></div>
}
class FilmBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <Fallback /> : this.props.children }
}
export default function FilmScene(props: Props) {
  return <FilmBoundary><Canvas className="cinema-canvas" dpr={[1, 1.5]} gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }} camera={{ position: [.1, 1.47, .92], fov: 29, near: .025, far: 60 }} frameloop="demand" shadows={false} fallback={<Fallback />} aria-hidden="true"><Suspense fallback={null}><Stage {...props} /></Suspense></Canvas></FilmBoundary>
}
