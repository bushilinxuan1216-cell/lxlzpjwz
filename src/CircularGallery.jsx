import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl'
import { useEffect, useRef } from 'react'

const lerp = (from, to, amount) => from + (to - from) * amount

export default function CircularGallery({ items, onSelect, bend = 3, scrollSpeed = 2, scrollEase = 0.055 }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined
    const renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 2) })
    const gl = renderer.gl
    const canvas = gl.canvas
    canvas.className = 'ogl-gallery-canvas'
    container.appendChild(canvas)
    const camera = new Camera(gl)
    camera.fov = 45
    camera.position.z = 20
    const scene = new Transform()
    const geometry = new Plane(gl, { heightSegments: 50, widthSegments: 100 })
    const scroll = { current: 0, target: 0, last: 0, ease: scrollEase }
    const media = []
    let screen = { width: 1, height: 1 }
    let viewport = { width: 1, height: 1 }
    let startX = 0
    let isDown = false
    let startScroll = 0
    let frame

    const vertex = `
      precision highp float;
      attribute vec3 position; attribute vec2 uv;
      uniform mat4 modelViewMatrix, projectionMatrix;
      uniform float uTime, uSpeed;
      varying vec2 vUv;
      void main(){
        vUv = uv;
        vec3 p = position;
        p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.10 + abs(uSpeed) * 0.55);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`
    const fragment = `
      precision highp float;
      uniform sampler2D tMap; uniform vec2 uImageSizes, uPlaneSizes;
      varying vec2 vUv;
      float roundedBoxSDF(vec2 p, vec2 b, float r){ vec2 d=abs(p)-b; return length(max(d,vec2(0.)))+min(max(d.x,d.y),0.)-r; }
      void main(){
        vec2 ratio=vec2(min((uPlaneSizes.x/uPlaneSizes.y)/(uImageSizes.x/uImageSizes.y),1.),min((uPlaneSizes.y/uPlaneSizes.x)/(uImageSizes.y/uImageSizes.x),1.));
        vec2 uv=vec2(vUv.x*ratio.x+(1.-ratio.x)*.5,vUv.y*ratio.y+(1.-ratio.y)*.5);
        vec4 color=texture2D(tMap,uv);
        float d=roundedBoxSDF(vUv-.5,vec2(.45),.05);
        float alpha=1.-smoothstep(-.002,.002,d);
        gl_FragColor=vec4(color.rgb,alpha);
      }`

    const createMedia = (item, index) => {
      const texture = new Texture(gl, { generateMipmaps: true })
      const program = new Program(gl, { vertex, fragment, transparent: true, depthTest: false, depthWrite: false, uniforms: { tMap: { value: texture }, uImageSizes: { value: [1, 1] }, uPlaneSizes: { value: [1, 1] }, uTime: { value: Math.random() * 100 }, uSpeed: { value: 0 } } })
      const plane = new Mesh(gl, { geometry, program })
      plane.setParent(scene)
      const image = new Image()
      image.src = item.image
      image.onload = () => { texture.image = image; program.uniforms.uImageSizes.value = [image.naturalWidth, image.naturalHeight] }
      return { item, index, plane, program, x: 0, width: 0, extra: 0 }
    }
    items.forEach((item, index) => media.push(createMedia(item, index)))

    const resize = () => {
      screen = { width: container.clientWidth, height: container.clientHeight }
      renderer.setSize(screen.width, screen.height)
      camera.perspective({ aspect: screen.width / screen.height })
      const fov = camera.fov * Math.PI / 180
      viewport = { height: 2 * Math.tan(fov / 2) * camera.position.z }
      viewport.width = viewport.height * camera.aspect
      const scale = screen.height / 1500
      const itemWidth = (viewport.width * (700 * scale)) / screen.width
      const itemHeight = (viewport.height * (900 * scale)) / screen.height
      media.forEach((entry, index) => {
        entry.plane.scale.set(itemWidth, itemHeight, 1)
        entry.program.uniforms.uPlaneSizes.value = [itemWidth, itemHeight]
        entry.width = itemWidth + 1.35
        entry.x = entry.width * (index - (media.length - 1) / 2)
      })
      scroll.target = Math.max(-media[media.length - 1].x, Math.min(-media[0].x, scroll.target))
    }

    const update = () => {
      scroll.current = lerp(scroll.current, scroll.target, scroll.ease)
      const speed = scroll.current - scroll.last
      media.forEach((entry) => {
        const x = entry.x - scroll.current
        const halfWidth = viewport.width / 2
        const radius = (halfWidth * halfWidth + bend * bend) / (2 * bend)
        const effectiveX = Math.min(Math.abs(x), halfWidth)
        const arc = radius - Math.sqrt(Math.max(0, radius * radius - effectiveX * effectiveX))
        entry.plane.position.x = x
        entry.plane.position.y = -arc - viewport.height * .175
        entry.plane.rotation.z = -Math.sign(x) * Math.asin(Math.min(1, effectiveX / radius))
        entry.program.uniforms.uTime.value += .04
        entry.program.uniforms.uSpeed.value = speed
      })
      renderer.render({ scene, camera })
      scroll.last = scroll.current
      frame = requestAnimationFrame(update)
    }

    const wheel = (event) => { event.preventDefault(); scroll.target += Math.sign(event.deltaY) * scrollSpeed * .7; scroll.target = Math.max(-media[media.length - 1].x, Math.min(-media[0].x, scroll.target)) }
    const pointerDown = (event) => { isDown = true; startX = event.clientX; startScroll = scroll.current; container.setPointerCapture?.(event.pointerId) }
    const pointerMove = (event) => { if (isDown) { scroll.target = startScroll + (startX - event.clientX) * .018; scroll.target = Math.max(-media[media.length - 1].x, Math.min(-media[0].x, scroll.target)) } }
    const pointerUp = (event) => {
      if (!isDown) return
      const distance = Math.abs(event.clientX - startX)
      isDown = false
      if (distance < 8) {
        const closest = media.reduce((best, entry) => Math.abs(entry.x - scroll.current) < Math.abs(best.x - scroll.current) ? entry : best, media[0])
        onSelect?.(closest.item)
      }
    }
    const keydown = (event) => { if (event.key === 'ArrowRight') scroll.target += scrollSpeed * 2; if (event.key === 'ArrowLeft') scroll.target -= scrollSpeed * 2; scroll.target = Math.max(-media[media.length - 1].x, Math.min(-media[0].x, scroll.target)) }
    resize(); update()
    window.addEventListener('resize', resize)
    container.addEventListener('wheel', wheel, { passive: false })
    container.addEventListener('pointerdown', pointerDown)
    container.addEventListener('pointermove', pointerMove)
    container.addEventListener('pointerup', pointerUp)
    container.addEventListener('keydown', keydown)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); container.removeEventListener('wheel', wheel); container.removeEventListener('pointerdown', pointerDown); container.removeEventListener('pointermove', pointerMove); container.removeEventListener('pointerup', pointerUp); container.removeEventListener('keydown', keydown); canvas.remove() }
  // The cards are static portfolio assets; mount the WebGL scene only once so
  // page-navigation state changes do not interrupt a drag gesture.
  }, [])

  return <div ref={containerRef} className="circular-gallery" tabIndex="0" role="region" aria-label="项目画廊，支持左右拖拽、滚轮和方向键浏览" />
}
