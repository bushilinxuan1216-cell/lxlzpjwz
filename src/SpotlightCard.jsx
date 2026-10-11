import { useEffect, useRef } from 'react'
import './SpotlightCard.css'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const stopList = (color, softness) => {
  const soft = clamp(softness, 0, 1)
  const core = (1 - soft) ** 1.5 * 0.85
  const stop = (alpha, at) => `color-mix(in srgb, ${color} ${(alpha * 100).toFixed(2)}%, transparent) ${(at * 100).toFixed(2)}%`
  const list = [stop(1, 0)]
  for (let i = 0; i <= 14; i += 1) {
    const t = core + ((1 - core) * i) / 14
    const g = (t - core) / (1 - core)
    const smooth = 1 - g * g * (3 - 2 * g)
    const glow = Math.exp(-4.6 * g * g) * (1 - g ** 6)
    list.push(stop(smooth + (glow - smooth) * soft, t))
  }
  return list.join(', ')
}

export default function SpotlightCard({ children, className = '', spotlightColor = '#f7f8ff', intensity = 0.18, spotlightSize = 240, softness = 0.72, borderGlow = 0.68, proximity = 96, smoothing = 0.28, ...props }) {
  const rootRef = useRef(null)
  const lightRef = useRef(null)
  const edgeRef = useRef(null)
  const stateRef = useRef({ x: 0, y: 0, presence: 0, flare: 0, down: false, raf: 0, last: 0 })

  useEffect(() => {
    const root = rootRef.current
    const light = lightRef.current
    const edge = edgeRef.current
    if (!root || !light || !edge) return undefined
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const pointer = { x: 0, y: 0, active: false }
    const s = stateRef.current
    let alive = true

    const wake = () => {
      if (!s.raf && alive) {
        s.last = performance.now()
        s.raf = requestAnimationFrame(tick)
      }
    }
    const tick = (now) => {
      s.raf = 0
      if (!alive) return
      const dt = Math.min(0.05, Math.max(0.001, (now - s.last) / 1000))
      s.last = now
      const rect = root.getBoundingClientRect()
      let tx = s.x
      let ty = s.y
      let target = 0
      if (pointer.active) {
        tx = pointer.x - rect.left
        ty = pointer.y - rect.top
        const gap = Math.hypot(Math.max(0, -tx, tx - rect.width), Math.max(0, -ty, ty - rect.height))
        target = gap === 0 ? 1 : Math.max(0, 1 - gap / proximity) ** 2
      }
      if (s.presence < 0.02 && target > 0) { s.x = tx; s.y = ty }
      const follow = reduce ? 1 : 1 - Math.exp(-dt / (0.015 + smoothing * 0.22))
      s.x += (tx - s.x) * follow
      s.y += (ty - s.y) * follow
      const fade = reduce ? 1 : 1 - Math.exp(-dt / (target > s.presence ? 0.1 : 0.32))
      s.presence += (target - s.presence) * fade
      const press = s.down && !reduce ? 1 : 0
      s.flare += (press - s.flare) * (1 - Math.exp(-dt / (press ? 0.05 : 0.28)))
      const size = spotlightSize * (1 + 0.2 * s.flare)
      const fill = `radial-gradient(circle ${size.toFixed(1)}px at ${s.x.toFixed(1)}px ${s.y.toFixed(1)}px, ${stopList(spotlightColor, softness)})`
      const rim = `radial-gradient(circle ${(size * 0.6).toFixed(1)}px at ${s.x.toFixed(1)}px ${s.y.toFixed(1)}px, ${stopList(spotlightColor, 1)})`
      light.style.background = fill
      edge.style.background = rim
      light.style.opacity = String(Math.min(1, s.presence * intensity * (1 + 0.7 * s.flare)))
      edge.style.opacity = String(Math.min(1, s.presence * borderGlow * (1 + 0.7 * s.flare)))
      if (Math.abs(tx - s.x) > 0.1 || Math.abs(ty - s.y) > 0.1 || Math.abs(target - s.presence) > 0.002 || Math.abs(press - s.flare) > 0.002) wake()
    }
    const onMove = (event) => { pointer.x = event.clientX; pointer.y = event.clientY; pointer.active = true; wake() }
    const onLeave = () => { pointer.active = false; wake() }
    const onDown = (event) => { pointer.x = event.clientX; pointer.y = event.clientY; pointer.active = true; s.down = true; wake() }
    const onUp = () => { s.down = false; wake() }
    root.addEventListener('pointermove', onMove)
    root.addEventListener('pointerleave', onLeave)
    root.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    return () => { alive = false; cancelAnimationFrame(s.raf); root.removeEventListener('pointermove', onMove); root.removeEventListener('pointerleave', onLeave); root.removeEventListener('pointerdown', onDown); window.removeEventListener('pointerup', onUp) }
  }, [spotlightColor, intensity, spotlightSize, softness, borderGlow, proximity, smoothing])

  return <div ref={rootRef} className={`spotlight-card ${className}`} {...props}>
    <span ref={lightRef} className="spotlight-card__light" aria-hidden="true" />
    <span className="spotlight-card__border" aria-hidden="true" />
    {children}
    <span ref={edgeRef} className="spotlight-card__edge" aria-hidden="true" />
  </div>
}
