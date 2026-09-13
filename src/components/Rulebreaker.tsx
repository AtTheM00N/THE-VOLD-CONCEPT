import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { RuleWorld, STEP } from '../physics'
import { VOLDsound } from '../sound'
import { Arrow, Bolt, Brand } from './Brand'

type Commands = { break: () => void; reset: () => void; rewind: (on: boolean) => void; pause: () => void; throw: () => void; flip: () => void; sound: () => Promise<boolean>; receipt: () => string }
const getSeed = () => {
  const supplied = new URLSearchParams(window.location.search).get('incident')
  return supplied && /^[a-z0-9]{1,7}$/i.test(supplied) ? parseInt(supplied, 36) >>> 0 : crypto.getRandomValues(new Uint32Array(1))[0]
}

export default function Rulebreaker({ reduced }: { reduced: boolean }) {
  const stage = useRef<HTMLDivElement>(null)
  const api = useRef<Commands | null>(null)
  const receiptDialog = useRef<HTMLDialogElement>(null)
  const [seed] = useState(getSeed)
  const [active, setActive] = useState(false)
  const [paused, setPaused] = useState(false)
  const [rewinding, setRewinding] = useState(false)
  const [sound, setSound] = useState(false)
  const [status, setStatus] = useState('Pull the red word. See what happens.')
  const [shareStatus, setShareStatus] = useState('')
  const [poster, setPoster] = useState('')
  const code = seed.toString(36).toUpperCase().padStart(6, '0')
  const shareURL = new URL(window.location.pathname, window.location.origin)
  shareURL.searchParams.set('incident', seed.toString(36))

  useEffect(() => {
    const el = stage.current!
    const pieces = Array.from(el.querySelectorAll<HTMLElement>('[data-piece]'))
    const readout = el.querySelector<HTMLElement>('[data-time]')!
    const meter = el.querySelector<HTMLElement>('[data-history]')!
    const pull = el.querySelector<HTMLElement>('[data-pull]')!
    const after = el.querySelector<HTMLElement>('.world-after')!
    const audio = new VOLDsound()
    let world: RuleWorld | null = null, isActive = false, isPaused = false, isRewinding = false
    let visible = true, held = -1, pointer: number | null = null, start = { x: 0, y: 0 }, target = { x: 0, y: 0 }
    let lastInteraction = 0
    let accumulator = 0, lastReadout = 0, viewWidth = 0, viewHeight = 0, keySequence = ''
    const animate = gsap.context(() => {}, el)
    const point = (e: PointerEvent) => { const r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }
    const draw = () => {
      world?.bodies.forEach((body, i) => {
        const item = pieces[i]
        item.style.transform = `translate3d(${body.x - body.w / 2 - item.offsetLeft}px,${body.y - body.h / 2 - item.offsetTop}px,0) rotate(${body.angle}rad)`
      })
      if (world) {
        after.style.opacity = String(Math.min(1, world.elapsed * 3))
        readout.textContent = `${isRewinding ? '◀◀' : isPaused ? 'Ⅱ' : 'REC'} ${world.elapsed.toFixed(1).padStart(4, '0')} S`
        meter.style.width = `${world.historySeconds / 8 * 100}%`
      }
    }
    const build = () => {
      const r = el.getBoundingClientRect()
      viewWidth = r.width; viewHeight = r.height
      return new RuleWorld(pieces.map(item => {
        const p = item.getBoundingClientRect()
        return { id: item.dataset.piece!, x: p.left - r.left + p.width / 2, y: p.top - r.top + p.height / 2, w: item.offsetWidth, h: item.offsetHeight, vx: 0, vy: 0, angle: 0, spin: 0 }
      }), r.width, r.height - 32)
    }
    const begin = () => {
      if (isActive) return
      gsap.killTweensOf(pieces)
      world = build(); world.save(); world.scatter(seed, reduced)
      isActive = true; isPaused = reduced; isRewinding = false; lastInteraction = performance.now()
      setActive(true); setPaused(isPaused); setRewinding(false)
      setStatus(reduced ? 'Rules removed. Motion is paused. Use Throw to play, or Resume.' : 'You broke the layout. Grab anything. Then hold rewind.')
      el.dataset.active = 'true'; el.style.setProperty('--pull', '0')
      draw(); audio.tone(270, 35, 0.5, 0.8)
      if (!reduced) animate.add(() => { gsap.fromTo(after, { y: 30 }, { y: 0, duration: 0.65, ease: 'power3.out' }) })
    }
    const endRewind = () => {
      isRewinding = false; setRewinding(false); el.dataset.rewind = 'false'
      draw()
      if (isActive) setStatus('Your timeline. Your mess. Throw it somewhere new.')
    }
    const release = () => {
      if (pointer !== null && el.hasPointerCapture(pointer)) el.releasePointerCapture(pointer)
      pointer = null; held = -1; lastInteraction = performance.now()
      if (!isActive) {
        gsap.to(pull, { x: 0, y: 0, rotation: 0, duration: reduced ? 0 : 0.55, ease: 'elastic.out(1, .5)' })
        el.style.setProperty('--pull', '0')
      }
    }
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || pointer !== null || (e.target as HTMLElement).closest('.world-hud')) return
      if (!isActive && !(e.target as HTMLElement).closest('[data-pull]')) return
      if (isRewinding) endRewind()
      target = point(e); start = target
      held = isActive ? world!.hit(target.x, target.y) : -1
      if (isActive && held < 0) return
      if (isActive) { isPaused = false; setPaused(false) }
      lastInteraction = performance.now()
      pointer = e.pointerId; el.setPointerCapture(e.pointerId)
      gsap.killTweensOf(pull)
    }
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return
      target = point(e)
      if (!isActive) {
        const dx = target.x - start.x, dy = target.y - start.y, distance = Math.hypot(dx, dy)
        const threshold = Math.min(130, el.clientWidth * 0.25)
        const tension = Math.min(1, distance / threshold)
        pull.style.transform = `translate(${dx * 0.65}px,${dy * 0.65}px) rotate(${dx * 0.035}deg)`
        el.style.setProperty('--pull', String(tension))
        if (distance > threshold) { begin(); held = pieces.indexOf(pull) }
      }
    }
    const up = (e: PointerEvent) => { if (e.pointerId === pointer) release() }
    const rewind = (on: boolean) => {
      if (!isActive) return
      release(); isRewinding = on; setRewinding(on); el.dataset.rewind = String(on)
      if (on) { setStatus('That’s your last eight seconds. Going backwards.'); audio.tone(480, 75, 0.65, 0.3) }
      else endRewind()
    }
    const blur = () => { release(); if (isRewinding) endRewind() }
    const visibility = () => { if (document.hidden) blur() }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (!visible) blur() }, { threshold: 0.05 })
    observer.observe(el)
    const resize = new ResizeObserver(() => {
      if (!world || !isActive || (viewWidth === el.clientWidth && viewHeight === el.clientHeight)) return
      const sx = el.clientWidth / viewWidth, sy = el.clientHeight / viewHeight
      // Old trajectories have obsolete boundaries after an orientation change.
      const gravity = world.gravity, elapsed = world.elapsed
      world = new RuleWorld(world.bodies.map((b, i) => ({ ...b, x: b.x * sx, y: b.y * sy, w: pieces[i].offsetWidth, h: pieces[i].offsetHeight })), el.clientWidth, el.clientHeight - 32)
      world.gravity = gravity; world.elapsed = elapsed; world.constrain()
      viewWidth = el.clientWidth; viewHeight = el.clientHeight; draw()
    })
    resize.observe(el)
    const tick = (_time: number, delta: number) => {
      if (!world || !isActive || !visible || document.hidden || (isPaused && !isRewinding)) return
      // Keep meaningful movement in the tape rather than overwriting it with a settled pile.
      if (!isRewinding && held < 0 && performance.now() - lastInteraction > 5500) {
        isPaused = true; setPaused(true); setStatus('Your move. Grab a piece, throw it, or rewind the mess.'); draw(); return
      }
      accumulator += Math.min(delta / 1000, 0.05)
      while (accumulator >= STEP) {
        if (isRewinding) { world.rewind(); world.rewind() }
        else audio.impact(world.step(held, target))
        accumulator -= STEP
      }
      draw()
      if (isRewinding && performance.now() - lastReadout > 650) { audio.tone(180 + world.historySeconds * 25, 90, 0.2, 0.12); lastReadout = performance.now() }
    }
    const flip = () => { if (world && isActive) { world.save(); world.gravity *= -1; isPaused = false; lastInteraction = performance.now(); setPaused(false); setStatus('Even gravity was just a suggestion.'); audio.tone(80, 400, 0.25) } }
    const keydown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input,textarea,select,dialog') || e.ctrlKey || e.metaKey || !visible) return
      keySequence = (keySequence + e.key.toLowerCase()).slice(-4)
      if (keySequence === 'vold') flip()
      if (e.key === 'Escape') blur()
    }
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up)
    window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility); window.addEventListener('keydown', keydown)
    gsap.ticker.add(tick)
    api.current = {
      break: begin, rewind, flip,
      reset: () => {
        blur(); world = null; isActive = false; isPaused = false; accumulator = 0
        el.dataset.active = 'false'; el.dataset.rewind = 'false'; el.style.setProperty('--pull', '0')
        gsap.killTweensOf(pieces); pieces.forEach(item => { item.style.transform = '' })
        setActive(false); setPaused(false); setStatus('All very sensible again. Pull the red word.')
      },
      pause: () => { isPaused = !isPaused; lastInteraction = performance.now(); if (isRewinding) endRewind(); setPaused(isPaused); draw(); setStatus(isPaused ? 'Time stopped. Take a breath.' : 'Back to making a mess.') },
      throw: () => { if (!world) return; world.save(); world.scatter((seed + Math.round(world.elapsed * 1000)) >>> 0, reduced); isPaused = false; lastInteraction = performance.now(); setPaused(false); if (isRewinding) endRewind(); setStatus('That’s your doing. Hold rewind to take it back.'); audio.tone(100, 250, 0.18) },
      sound: async () => { if (audio.enabled) { audio.mute(); return false }; return audio.enable() },
      receipt: () => {
        const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1350
        const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#efeee8'; ctx.fillRect(0, 0, 1080, 1350)
        ctx.fillStyle = '#111'; ctx.font = '24px monospace'; ctx.fillText(`VOLD / INCIDENT ${seed.toString(36).toUpperCase()}`, 70, 90)
        ctx.font = '800 200px "Barlow Condensed", sans-serif'; ctx.fillText('I BROKE', 60, 290); ctx.fillText('THE RULES.', 60, 465)
        ctx.fillStyle = '#ff3131'; ctx.fillRect(65, 525, 950, 620)
        if (world) world.bodies.forEach((b, i) => {
          ctx.save(); ctx.translate(65 + b.x / world!.width * 950, 540 + b.y / world!.height * 580); ctx.rotate(b.angle)
          const text = pieces[i].dataset.receipt ?? pieces[i].textContent ?? 'VOLD'
          ctx.fillStyle = '#111'; ctx.font = `800 ${Math.max(25, b.h / world!.height * 390)}px "Barlow Condensed", sans-serif`; ctx.textAlign = 'center'; ctx.fillText(text, 0, 0); ctx.restore()
        })
        ctx.fillStyle = '#111'; ctx.font = '800 70px "Barlow Condensed", sans-serif'; ctx.fillText('NO RULES. JUST VOLD.', 65, 1230)
        ctx.font = '21px monospace'; ctx.fillText('YOUR TURN. PULL THE RED WORD.', 70, 1290)
        return canvas.toDataURL('image/png')
      },
    }
    return () => {
      gsap.ticker.remove(tick); observer.disconnect(); resize.disconnect(); audio.dispose(); animate.revert()
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.removeEventListener('lostpointercapture', up)
      window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('keydown', keydown)
      api.current = null
    }
  }, [seed, reduced])

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'VOLD — I broke the rules.', text: 'Pull the red word. Then rewind what you did.', url: shareURL.href })
      else { await navigator.clipboard.writeText(shareURL.href); setShareStatus('Link copied. Send it to your favourite troublemaker.') }
    } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) setShareStatus('Copy the link below to pass it on.') }
  }

  return <section id="top" className={`rulebreaker ${active ? 'is-broken' : ''}`} aria-labelledby="rulebreaker-title">
    <div className="experiment-top mono"><span><i /> VOLD / DEPARTMENT OF BAD IDEAS</span><span>INDIA. INDEPENDENT. UNCONTAINED.</span></div>
    <div className="rule-world" ref={stage} data-active="false" data-rewind="false" aria-label="Interactive typography playground">
      <h1 id="rulebreaker-title" className="sr-only">No rules. Just VOLD. Pull the word RULES to break this page, then rewind your movements.</h1>
      <div className="world-grid" aria-hidden="true" />
      <div className="world-after" aria-hidden="true"><span>NO RULES.</span><span>JUST <Brand /><span className="red-period">.</span></span></div>
      <div className="world-intro-note mono">A PERFECTLY<br />WELL-BEHAVED WEBSITE.</div>
      <span className="physical-piece word-please" data-piece="please" aria-hidden="true">PLEASE</span>
      <span className="physical-piece word-obey" data-piece="obey" aria-hidden="true">OBEY</span>
      <span className="physical-piece word-the" data-piece="the" aria-hidden="true">THE</span>
      <button className="physical-piece word-rules" data-piece="rules" data-pull aria-label="Pull RULES out of the page. Or press Enter to break the rules." onClick={e => { if (e.detail === 0) api.current?.break() }}><span className="pull-hole" />RULES<span className="pull-grip" aria-hidden="true"><i /><i /><i /></span></button>
      <span className="physical-piece rule-chip chip-one" data-piece="stay" aria-hidden="true"><small>01</small> STAY IN LINE.</span>
      <span className="physical-piece rule-chip chip-two" data-piece="quiet" aria-hidden="true"><small>02</small> KEEP IT DOWN.</span>
      <span className="physical-piece rule-chip chip-three" data-piece="safe" aria-hidden="true"><small>03</small> PLAY IT SAFE.</span>
      <span className="physical-piece world-bolt bolt-one" data-piece="bolt" data-receipt="↯" aria-hidden="true"><Bolt /></span>
      <span className="physical-piece world-stamp" data-piece="stamp" aria-hidden="true">100%<small>BAD INFLUENCE</small></span>
      <span className="physical-piece world-can" data-piece="can" data-receipt="VOLD" aria-hidden="true"><img src="/images/can_classic.webp" alt="" draggable="false" width="120" height="280" /></span>
      <div className="pull-annotation"><svg viewBox="0 0 140 100" fill="none" aria-hidden="true"><path d="M130 7C132 90 52 108 12 35m-3 25 3-25 24 7" stroke="currentColor" strokeWidth="1.5" /></svg><span>Pull this out.<br />We dare you.</span></div>
      <div className="world-hud mono"><span>INCIDENT / {code}</span><span data-time>{active ? 'REC 00.0 S' : 'AWAITING BAD DECISION'}</span><div className="history-bar" aria-hidden="true"><i data-history /></div></div>
      <div className="rewind-overlay" aria-hidden="true"><span>◀◀</span> UNDOING YOUR GOOD WORK.</div>
    </div>
    <div className="experiment-controls">
      <div className="control-copy"><span className="eyebrow">{active ? rewinding ? '02 / TIME HAS NO RULES EITHER' : '02 / WELL, THAT ESCALATED.' : '01 / YOUR FIRST BAD DECISION'}</span><p role="status">{status}</p></div>
      <div className="play-controls">
        {!active ? <button className="button button-accent break-button" onClick={() => api.current?.break()}>Or just break the rules <Arrow /></button> : <>
          <button className="rewind-button" aria-pressed={rewinding} aria-label="Rewind time. Hold with pointer, or activate to toggle." onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); api.current?.rewind(true) }} onPointerUp={() => api.current?.rewind(false)} onPointerCancel={() => api.current?.rewind(false)} onLostPointerCapture={() => api.current?.rewind(false)} onClick={e => { if (e.detail === 0) api.current?.rewind(!rewinding) }}><span>◀◀</span> HOLD TO REWIND</button>
          <button className="utility-control" onClick={() => api.current?.throw()} aria-label="Throw the typography">Throw ↗</button>
          <button className="utility-control" onClick={() => api.current?.pause()} aria-label={paused ? 'Resume motion' : 'Pause motion'}>{paused ? 'Resume ▷' : 'Pause Ⅱ'}</button>
          <button className="utility-control reset-control" aria-label="Reset experiment" onClick={() => api.current?.reset()}><span>Reset </span>↺</button>
        </>}
      </div>
    </div>
    <div className="experiment-footer mono"><button aria-pressed={sound} onClick={async () => setSound(await api.current?.sound() ?? false)}>{sound ? '▥ SOUND ON' : '▥ SOUND OFF'}<span> / OPTIONAL. MISBEHAVIOUR ISN’T.</span></button>{active ? <button className="share-trigger" onClick={() => { api.current?.rewind(false); if (!paused) api.current?.pause(); setShareStatus(''); setPoster(''); receiptDialog.current?.showModal() }}>PASS THE TROUBLE ON <Arrow diagonal /></button> : <a href="#range">JUST HERE FOR THE DRINKS? ↓</a>}</div>
    <dialog className="incident-dialog" ref={receiptDialog} aria-labelledby="incident-title" data-lenis-prevent>
      <button className="close-button" aria-label="Close incident receipt" onClick={() => receiptDialog.current?.close()}>×</button>
      <span className="eyebrow">VOLD / INCIDENT REPORT {code}</span><h2 id="incident-title" className={poster ? 'sr-only' : ''}>YOU WERE<br />NEVER <span>HERE.</span></h2>
      {poster ? <img className="incident-poster" src={poster} alt={`Your VOLD incident ${code}: the typography you threw, turned into a poster.`} width="1080" height="1350" /> : <p>Except there’s a receipt. Save your mess, or send someone the same starting point and see what they do.</p>}
      {poster ? <a className="button button-accent" href={poster} download={`VOLD-incident-${code}.png`}>Save poster as PNG ↓</a> : <button className="button button-accent" onClick={() => setPoster(api.current?.receipt() ?? '')}>Make my incident poster ↓</button>}
      <button className="button button-white" onClick={share}>Pass the trouble on <Arrow diagonal /></button>
      <label className="mono" htmlFor="incident-link">YOUR INCIDENT LINK</label><input id="incident-link" readOnly value={shareURL.href} onFocus={e => e.currentTarget.select()} />
      <p className="share-status" role="status">{shareStatus}</p>
      {['localhost', '127.0.0.1'].includes(window.location.hostname) && <p className="helper">Local preview: this link works on this computer. Publish the site to share it with friends.</p>}
      <button className="gravity-secret mono" onClick={() => { api.current?.flip(); receiptDialog.current?.close() }}>P.S. GRAVITY IS A RULE TOO. ↑</button>
    </dialog>
  </section>
}
