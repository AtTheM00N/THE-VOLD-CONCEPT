import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { CanvasTexture, Color, MathUtils, SRGBColorSpace } from 'three'
import type { Group, MeshStandardMaterial, ShaderMaterial } from 'three'
import type { Product, SceneMotion } from '../data'

type Props = { product: Product; motion: RefObject<SceneMotion>; reduced: boolean; turn: number }

function createLabel(product: Product) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#141416'
  ctx.fillRect(0, 0, 1024, 1024)
  // A small deterministic printed grain, generated once per label.
  for (let i = 0; i < 3000; i++) {
    const x = (i * 73.37) % 1024
    const y = (i * 31.91) % 1024
    ctx.fillStyle = i % 2 ? '#1d1d20' : '#0e0e10'
    ctx.fillRect(x, y, 1.5, 3)
  }
  ctx.fillStyle = product.color
  ctx.fillRect(0, 884, 1024, 90)
  ctx.fillRect(0, 58, 1024, 5)
  ctx.fillStyle = '#101011'
  ctx.font = 'bold 29px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(product.label, 512, 940)
  ctx.save()
  ctx.translate(512, 481)
  ctx.rotate(-Math.PI / 2)
  ctx.font = '900 231px Arial'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#f1f0e9'
  ctx.fillText('VOLD', 0, 0)
  const wordWidth = ctx.measureText('VOLD').width
  const o = -wordWidth / 2 + ctx.measureText('V').width + ctx.measureText('O').width / 2
  ctx.save()
  ctx.translate(o, 0)
  ctx.fillStyle = product.color
  ctx.beginPath()
  ctx.moveTo(10, -92); ctx.lineTo(-55, 9); ctx.lineTo(-4, 9); ctx.lineTo(-14, 89); ctx.lineTo(57, -24); ctx.lineTo(9, -24); ctx.closePath(); ctx.fill()
  ctx.restore()
  ctx.font = 'bold 23px Arial'
  ctx.fillStyle = '#c3c3c5'
  ctx.fillText(product.category.toUpperCase(), 0, 152)
  ctx.restore()
  ctx.fillStyle = '#dddde0'
  ctx.font = 'bold 20px Arial'
  ctx.fillText('NO RULES. JUST VOLD.', 512, 117)
  ctx.font = '18px Arial'
  ctx.fillText('250 ml', 512, 832)
  ctx.save()
  ctx.translate(60, 500)
  ctx.rotate(-Math.PI / 2)
  ctx.font = 'bold 32px Arial'
  ctx.fillText('VOLD ENERGY ASIA', 0, 0)
  ctx.font = '19px Arial'
  ctx.fillText('BORN IN INDIA. MADE TO STAND OUT.', 0, 48)
  ctx.restore()
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

const vertex = `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`
const fragment = `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uAspect;
  void main(){
    vec2 p=(vUv-.5)*vec2(uAspect,1.0);
    float t=uTime*.12;
    float wave=sin(p.x*2.4+p.y*3.0+t)*.18+sin(p.y*5.0-p.x*1.7-t*.7)*.08;
    float ribbon=exp(-abs(p.y-p.x*.34+wave+.08)*18.0);
    float outer=exp(-abs(p.y-p.x*.34+wave+.08)*4.5);
    float cut=sin(p.x*2.0-p.y*1.8+t)*.5+.5;
    float glow=exp(-length(p-vec2(.45,-.03))*2.6);
    float grain=fract(sin(dot(vUv,vec2(12.9898,78.233)))*43758.5453)*.018;
    vec3 col=uColor*(ribbon*.21+outer*.065)*cut+uColor*glow*.04;
    col+=vec3(grain);
    gl_FragColor=vec4(col,1.0);
  }
`

function Liquid({ color, reduced }: { color: string; reduced: boolean }) {
  const ref = useRef<ShaderMaterial>(null)
  const { viewport } = useThree()
  const target = useMemo(() => new Color(color), [color])
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uColor: { value: new Color('#FF3131') }, uAspect: { value: 1 } }), [])
  useFrame(({ clock }, delta) => {
    if (!ref.current) return
    ref.current.uniforms.uTime.value = reduced ? 0 : clock.elapsedTime
    ref.current.uniforms.uColor.value.lerp(target, 1 - Math.exp(-delta * 3))
    ref.current.uniforms.uAspect.value = viewport.aspect
  })
  return <mesh position={[0, 0, -4]} scale={[viewport.width * 1.8, viewport.height * 1.8, 1]}><planeGeometry args={[1, 1]} /><shaderMaterial ref={ref} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} depthWrite={false} /></mesh>
}

function Can({ product, motion, reduced, turn }: Props) {
  const group = useRef<Group>(null)
  const material = useRef<MeshStandardMaterial>(null)
  const { viewport, size } = useThree()
  const label = useMemo(() => createLabel(product), [product])
  useEffect(() => () => label.dispose(), [label])
  useFrame(({ clock, pointer }, delta) => {
    if (!group.current) return
    const t = reduced ? 0 : clock.elapsedTime
    const p = motion.current.progress
    const mobile = size.width < 760
    const intoRange = MathUtils.smoothstep(p, 0.04, 0.49)
    const intoDetails = MathUtils.smoothstep(p, 0.53, 0.93)
    const x = mobile ? 0 : viewport.width * (0.225 - intoRange * 0.45 + intoDetails * 0.45)
    // On phones the hero can moves with its section; the range uses product cutouts.
    const scrollY = motion.current.scrollY || 0
    const y = mobile ? -0.45 + scrollY / size.height * viewport.height : 0.03
    group.current.visible = !mobile || scrollY < 950
    const damping = reduced ? 1 : 1 - Math.exp(-delta * 5)
    group.current.position.x = MathUtils.lerp(group.current.position.x, x, damping)
    group.current.position.y = y + Math.sin(t * 0.7) * 0.045
    group.current.rotation.z = -0.17 + intoRange * 0.27 - intoDetails * 0.18
    const yaw = turn * Math.PI * 2 + (reduced ? 0 : Math.sin(t * 0.4) * 0.08 + pointer.x * 0.08)
    group.current.rotation.y = MathUtils.lerp(group.current.rotation.y, yaw, damping)
    group.current.rotation.x = 0.09 + (reduced ? 0 : pointer.y * 0.035)
    const scale = mobile ? 0.52 : 1.11 + intoDetails * 0.1
    group.current.scale.setScalar(scale)
  })
  return <group ref={group}>
    <mesh><cylinderGeometry args={[0.53, 0.53, 2.65, 64, 1, true, Math.PI]} /><meshStandardMaterial ref={material} map={label} metalness={0.64} roughness={0.32} envMapIntensity={1.15} /></mesh>
    {[-1, 1].map(side => <group key={side} position={[0, side * 1.34, 0]}>
      <mesh><cylinderGeometry args={side === 1 ? [0.49, 0.53, 0.12, 48] : [0.53, 0.49, 0.12, 48]} /><meshStandardMaterial color="#363638" metalness={0.9} roughness={0.23} /></mesh>
      <mesh position={[0, side * 0.065, 0]}><cylinderGeometry args={[0.5, 0.5, 0.038, 48]} /><meshStandardMaterial color="#c0c3c6" metalness={0.94} roughness={0.2} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, side * 0.088, 0]}><torusGeometry args={[0.48, 0.016, 6, 48]} /><meshStandardMaterial color="#eceff0" metalness={0.96} roughness={0.18} /></mesh>
    </group>)}
    <mesh position={[0, 1.44, 0.06]} scale={[0.085, 0.011, 0.18]}><cylinderGeometry args={[1, 1, 1, 20]} /><meshStandardMaterial color="#888b8e" metalness={0.95} roughness={0.2} /></mesh>
    <mesh position={[0, 1.43, -0.21]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.11, 0.16, 1]}><circleGeometry args={[1, 24]} /><meshStandardMaterial color="#252527" metalness={0.4} roughness={0.5} /></mesh>
  </group>
}

function Scene(props: Props) {
  return <>
    <Liquid color={props.product.color} reduced={props.reduced} />
    <ambientLight intensity={0.6} />
    <directionalLight position={[3, 4, 5]} intensity={2.8} color="#fff8ef" />
    <directionalLight position={[-3, 1, 2]} intensity={2} color={props.product.color} />
    <Environment resolution={128} frames={1}>
      <Lightformer intensity={4} position={[-3, 1, 3]} scale={[2, 8, 1]} />
      <Lightformer intensity={3} position={[3, 2, 1]} scale={[1, 6, 1]} />
      <Lightformer intensity={2} position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[5, 5, 1]} />
    </Environment>
    <Can {...props} />
  </>
}

export function ProductFallback({ product }: { product: Product }) {
  return <div className="scene-fallback"><img src={`/images/${product.image}.webp`} alt={`${product.name} VOLD can`} /></div>
}

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

export default function EnergyScene(props: Props) {
  const [active, setActive] = useState(true)
  useEffect(() => {
    const target = document.getElementById('experience')
    let intersecting = true
    const update = () => setActive(intersecting && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; update() })
    if (target) observer.observe(target)
    document.addEventListener('visibilitychange', update)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update) }
  }, [])
  return <SceneBoundary fallback={<ProductFallback product={props.product} />}>
    <Canvas dpr={[1, 1.5]} gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }} camera={{ position: [0, 0, 7], fov: 36, near: 0.1, far: 25 }} shadows={false} frameloop={active ? 'always' : 'never'} fallback={<ProductFallback product={props.product} />} aria-hidden="true">
      <Suspense fallback={null}><Scene {...props} /></Suspense>
    </Canvas>
  </SceneBoundary>
}
