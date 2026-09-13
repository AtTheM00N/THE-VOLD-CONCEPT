import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'

gsap.registerPlugin(ScrollTrigger)

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReduced(media.matches)
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  return reduced
}

export function useExperience(root: RefObject<HTMLElement | null>, reduced: boolean) {
  useEffect(() => {
    if (!root.current) return
    // GSAP supplies seconds; Lenis expects milliseconds. Only one scroll clock.
    const lenis = reduced ? null : new Lenis({ duration: 0.9, smoothWheel: true, syncTouch: false })
    const tick = (time: number) => lenis?.raf(time * 1000)
    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
    }
    const context = gsap.context(() => {
      if (!reduced) {
        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach(element => {
          gsap.from(element, { y: 36, opacity: 0, duration: 0.8, ease: 'power2.out', scrollTrigger: { trigger: element, start: 'top 94%', once: true } })
        })
      }
    }, root)
    const refresh = () => { lenis?.resize(); ScrollTrigger.refresh() }
    document.fonts.ready.then(() => { if (active) refresh() })
    let active = true
    window.addEventListener('load', refresh)
    return () => {
      active = false
      window.removeEventListener('load', refresh)
      context.revert()
      gsap.ticker.remove(tick)
      lenis?.destroy()
    }
  }, [root, reduced])
}
