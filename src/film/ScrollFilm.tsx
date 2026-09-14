import { Component, lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import gsap from 'gsap'
import { Brand, Arrow } from '../components/Brand'
import { products } from '../data'
import { seekPage } from '../useExperience'
import { FilmSound } from './FilmSound'
import { clamp01, productAt, SHOTS, shotAt, smooth, windowed } from './timeline'
import type { FilmSignal } from './timeline'
import './film.css'

const FilmScene = lazy(() => import('./FilmScene'))
const duration = 74
const timestamp = (progress: number) => { const s = Math.round(progress * duration); return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}` }

class SceneLoaderBoundary extends Component<{ children: ReactNode; onUnavailable: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onUnavailable() }
  render() { return this.state.failed ? null : this.props.children }
}

export default function ScrollFilm({ reduced }: { reduced: boolean }) {
  const track = useRef<HTMLElement>(null), stage = useRef<HTMLDivElement>(null)
  const slider = useRef<HTMLInputElement>(null), time = useRef<HTMLOutputElement>(null)
  const signal = useRef<FilmSignal>({ progress: 0, velocity: 0, visible: true })
  const sound = useRef<FilmSound | null>(null), playing = useRef(false)
  const bounds = useRef({ top: 0, distance: 1 })
  const [loaded, setLoaded] = useState(false), [fonts, setFonts] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [stillFrames, setStillFrames] = useState(false)
  const calm = reduced || stillFrames, calmRef = useRef(calm)
  const [chapter, setChapter] = useState(0), [flavour, setFlavour] = useState(0)
  const [audioOn, setAudioOn] = useState(false), [audioFailed, setAudioFailed] = useState(false), [isPlaying, setIsPlaying] = useState(false)
  const onReady = useCallback(() => setLoaded(true), [])
  const pause = useCallback(() => { playing.current = false; setIsPlaying(false) }, [])
  const onUnavailable = useCallback(() => { setUnavailable(true); pause() }, [pause])
  useLayoutEffect(() => {
    calmRef.current = calm
    // The preference change must also stop the external GSAP playback clock.
    // oxlint-disable-next-line react/set-state-in-effect
    pause()
  }, [calm, pause])
  const seek = useCallback((progress: number) => {
    pause(); seekPage(bounds.current.top + clamp01(progress) * bounds.current.distance)
  }, [pause])

  useEffect(() => {
    let active = true
    document.fonts.ready.then(() => { if (active) setFonts(true) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const element = track.current!
    const score = new FilmSound(); sound.current = score
    let intersecting = true, previous = -1, previousChapter = -1, previousProduct = -1
    const measure = () => {
      const rect = element.getBoundingClientRect()
      bounds.current = { top: rect.top + window.scrollY, distance: Math.max(1, rect.height - window.innerHeight) }
    }
    const visibility = () => { signal.current.visible = intersecting && !document.hidden; if (document.hidden) pause() }
    const observer = new IntersectionObserver(entries => { intersecting = entries[0].isIntersecting; visibility(); if (!intersecting) pause() })
    observer.observe(element)
    const resize = new ResizeObserver(measure); resize.observe(element)
    measure()
    const tick = (_time: number, delta: number) => {
      let p = clamp01((window.scrollY - bounds.current.top) / bounds.current.distance)
      if (playing.current) {
        p = Math.min(1, p + Math.min(delta, 50) / (duration * 1000))
        seekPage(bounds.current.top + p * bounds.current.distance)
        if (p >= 1) pause()
      }
      const shot = shotAt(p), product = productAt(p)
      const cinematic = calmRef.current ? Math.min(.985, (SHOTS[shot].at + (SHOTS[shot + 1]?.at ?? 1)) / 2) : p
      signal.current.velocity = previous < 0 ? 0 : (p - previous) / Math.max(delta / 1000, .001)
      signal.current.progress = cinematic
      score.update(p, signal.current.velocity, signal.current.visible)
      if (p === previous) return
      previous = p
      if (shot !== previousChapter) { setChapter(shot); previousChapter = shot }
      if (product !== previousProduct) { setFlavour(product); previousProduct = product }
      if (slider.current) { slider.current.value = String(p * 1000); slider.current.setAttribute('aria-valuetext', `${timestamp(p)} — ${SHOTS[shot].name}`) }
      if (time.current) time.current.textContent = timestamp(p)
      const style = stage.current!.style
      style.setProperty('--film-progress', `${p * 100}%`)
      style.setProperty('--intro', String(1 - smooth(.035, .075, p)))
      style.setProperty('--product-copy', String(windowed(.54, .57, .856, .875, p)))
      style.setProperty('--quiet', String(windowed(.87, .891, .946, .965, p)))
      style.setProperty('--no-rules', String(windowed(.879, .892, .912, .921, p)))
      style.setProperty('--just-vold', String(windowed(.923, .936, .953, .965, p)))
      style.setProperty('--ending', String(smooth(.958, .984, p)))
      style.setProperty('--film-accent', products[product].color)
    }
    const stopOnInput = (event: Event) => {
      if (event instanceof KeyboardEvent && !['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) return
      pause()
    }
    gsap.ticker.add(tick)
    window.addEventListener('resize', measure)
    window.addEventListener('wheel', stopOnInput, { passive: true })
    window.addEventListener('touchstart', stopOnInput, { passive: true })
    window.addEventListener('keydown', stopOnInput)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      gsap.ticker.remove(tick); observer.disconnect(); resize.disconnect(); score.dispose(); sound.current = null
      window.removeEventListener('resize', measure); window.removeEventListener('wheel', stopOnInput)
      window.removeEventListener('touchstart', stopOnInput); window.removeEventListener('keydown', stopOnInput)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [pause])

  const togglePlay = () => {
    if (playing.current) { pause(); return }
    if (signal.current.progress > .995) seek(0)
    playing.current = true; setIsPlaying(true)
  }
  const jumpToScene = (index: number) => seek((SHOTS[index].at + (SHOTS[index + 1]?.at ?? 1)) / 2)
  const toggleSound = async () => {
    const wasOn = audioOn, enabled = await sound.current?.toggle() ?? false
    setAudioOn(enabled); setAudioFailed(!wasOn && !enabled)
  }

  return <section id="top" ref={track} className={`film-track${calm ? ' film-reduced' : ''}${unavailable ? ' film-unavailable' : ''}`} aria-label="BREACH, an interactive VOLD product film">
    <div className={`film-stage${loaded ? ' is-ready' : ''}`} ref={stage}>
      <div className="film-image">{unavailable ? <div className="film-fallback"><img src="/images/can_classic.webp" alt="VOLD Classic energy drink" /><h1>STILL VOLD.</h1><p>Your browser is showing the still edition.</p><a href="#range">Explore the drinks →</a></div> : fonts && <SceneLoaderBoundary onUnavailable={onUnavailable}><Suspense fallback={null}><FilmScene signal={signal} onReady={onReady} onUnavailable={onUnavailable} /></Suspense></SceneLoaderBoundary>}</div>
      <div className="film-vignette" aria-hidden="true" />
      <header className="film-header">
        <a href="#top" aria-label="VOLD home" onClick={pause}><Brand /></a>
        <span className="film-credit">VOLD PRESENTS <span>BREACH</span></span>
        <div className="film-header-actions"><button className={`film-sound${audioOn ? ' is-on' : ''}`} onClick={toggleSound} aria-pressed={audioOn} aria-label={audioOn ? 'Turn sound off' : 'Turn sound on'}><span className="sound-lines" aria-hidden="true"><i /><i /><i /><i /></span><span>{audioFailed ? 'Sound unavailable' : audioOn ? 'Sound on' : 'Sound off'}</span></button><a href="#range" onClick={pause}>Skip film <Arrow diagonal /></a></div>
      </header>

      <div className="film-intro" aria-hidden={chapter > 1}>
        <span className="film-kicker">A VOLD ORIGINAL / INTERACTIVE FILM</span>
        <h1>BREACH<span>®</span></h1>
        <p>Everything has a breaking point.</p>
        <span className="film-instruction">{loaded ? calm ? 'SCROLL TO EXPLORE THE STILL EDITION' : 'SCROLL TO MOVE THE CAMERA' : 'SETTING THE LIGHT…'} <span aria-hidden="true">↓</span></span>
      </div>

      <div className="film-product-copy" aria-hidden={chapter < 6 || chapter > 9}>
        <span className="film-kicker">0{flavour + 1} / {products[flavour].category}</span>
        <p key={flavour}>{['THE\nORIGINAL.', 'BITE\nBACK.', 'SLOW\nBURN.', 'CLEAR\nINTENT.'][flavour].split('\n').map(line => <span key={line}>{line}</span>)}</p>
        <span className="film-flavour">{products[flavour].name}<span>250 ML / {flavour < 2 ? 'ENERGY DRINK' : 'CAFFEINE-FREE MIXER'}</span></span>
      </div>

      <div className="film-silence" aria-hidden="true"><span className="no-rules">NO RULES.</span><span className="just-vold">JUST <Brand /></span></div>
      <div className="film-ending" inert={chapter !== 11}>
        <div><span className="film-kicker">THE FILM ENDS. THE ATTITUDE DOESN’T.</span><h2>TAKE IT<br />FROM HERE.</h2></div>
        <div className="film-ending-actions"><a href="#range" className="button button-white" onClick={pause}>Meet the drinks <Arrow diagonal /></a><a href="#find" className="film-text-link" onClick={pause}>Find your VOLD <Arrow /></a><button className="film-replay" onClick={() => seek(0)}>↶ Play it your way again</button></div>
      </div>

      <div className="film-controls" data-lenis-prevent>
        <div className="film-controls-top">
          <span className="film-scene"><span>{String(chapter + 1).padStart(2, '0')}</span> / {SHOTS[chapter].name}</span>
          <div className="film-control-options"><button className="film-motion" aria-label="Use still frames" aria-pressed={calm} disabled={reduced} onClick={() => setStillFrames(value => !value)}>{calm ? 'STILLS' : 'MOTION'} <span aria-hidden="true">{calm ? '○' : '◉'}</span></button><label className="film-chapter-picker"><span className="sr-only">Jump to a scene</span><select aria-label="Jump to a scene" value={chapter} onChange={event => jumpToScene(Number(event.target.value))}>{SHOTS.map((shot, i) => <option key={shot.name} value={i}>{String(i + 1).padStart(2, '0')} / {shot.name}</option>)}</select><span aria-hidden="true">SCENES ↗</span></label></div>
        </div>
        <div className="film-transport">
          <button className="film-play" disabled={!loaded || calm} aria-hidden={calm} tabIndex={calm ? -1 : 0} onClick={togglePlay} aria-label={isPlaying ? 'Pause film' : 'Play film'}>{isPlaying ? <span aria-hidden="true">Ⅱ</span> : <span aria-hidden="true">▶</span>}</button>
          <input ref={slider} className="film-seek" type="range" min="0" max="1000" step="1" defaultValue="0" aria-label="Film position" onChange={event => seek(Number(event.target.value) / 1000)} />
          <span className="film-time"><output ref={time}>00:00</output><span> / 01:14</span></span>
        </div>
        <p className="sr-only" aria-live="polite">Scene {chapter + 1}: {SHOTS[chapter].name}. {SHOTS[chapter].cue}</p>
      </div>
    </div>
  </section>
}
