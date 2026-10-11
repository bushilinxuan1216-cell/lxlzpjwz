import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import SpotlightCard from './SpotlightCard'
import './styles.css'

const createCaseImages = (count = 14, folder = 'showcase') => Array.from({ length: count }, (_, index) => ({
  number: String(index + 1).padStart(2, '0'),
  src: `/assets/${folder}/${index + 1}.jpg`,
}))

const miaoChapters = [
  { label: '项目封面', page: 0 },
  { label: '背景现状', page: 1 },
  { label: '策略推导', page: 2 },
  { label: '方案展示', page: 3 },
  { label: '复盘总结', page: 11 },
]

const toooChapters = [{ label: 'UI设计', page: 0 }]

const projects = [
  { id: 'pixel', code: '01', name: 'PIXEL', type: 'AI 创作社区', year: '2026', tint: 'violet', image: '/assets/project-1.png', caseImages: createCaseImages() },
  { id: 'miao', code: '02', name: '百度秒哒', type: 'AI 个人中心升级', year: '2026', tint: 'orange', image: '/assets/project-2.png', caseImages: createCaseImages(12, 'showcase-miao'), caseChapters: miaoChapters },
  { id: 'tooo', code: '03', name: '兔动 Tooo', type: '儿童成长与任务体验设计', year: '2026', tint: 'blue', image: '/assets/project-3.png', caseImages: createCaseImages(10, 'showcase-tooo'), caseChapters: toooChapters, flushImages: true, showIndexLabel: false, chapterOffset: 42 },
  { id: 'commerce', code: '04', name: '会员体验', type: '会员权益与支付链路', year: '2025', tint: 'blue', caseImages: createCaseImages() },
  { id: 'creator', code: '05', name: 'Creator Center', type: '多模态创作入口', year: '2025', tint: 'pink', caseImages: createCaseImages() },
  { id: 'brand', code: '06', name: '品牌探索', type: '视觉与交互实验', year: '2025', tint: 'white', caseImages: createCaseImages() },
]

function Arrow(){ return <span aria-hidden="true" className="arrow">↗</span> }

function App() {
  const [detail, setDetail] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeNav, setActiveNav] = useState(0)
  const [gooeyKey, setGooeyKey] = useState(0)
  const [profileOpen, setProfileOpen] = useState(false)
  const navItems = [
    { label: 'Home', href: '#home' },
    { label: '个人介绍', href: '#about' },
    { label: '作品目录', href: '#projects' },
    { label: '联系我', href: '#contact' },
  ]
  useEffect(() => {
    const hash = window.location.hash.replace('#project-', '')
    if (hash) setDetail(projects.find((item) => item.id === hash) || null)
  }, [])
  useEffect(() => {
    if (!profileOpen) return undefined
    const closeOnEscape = (event) => { if (event.key === 'Escape') setProfileOpen(false) }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [profileOpen])
  useEffect(() => {
    const sections = navItems.map((item) => document.querySelector(item.href)).filter(Boolean)
    const observer = new IntersectionObserver((entries) => {
      const current = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (current) setActiveNav(sections.indexOf(current.target))
    }, { threshold: [0.35, 0.55, 0.75] })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  const selectNav = (index) => {
    setActiveNav(index)
    setGooeyKey((key) => key + 1)
    setMenuOpen(false)
  }
  useEffect(() => {
    const media = [...document.querySelectorAll('.parallax-media')]
    let frame
    const updateParallax = () => {
      const viewportMid = window.innerHeight / 2
      media.forEach((element) => {
        const rect = element.parentElement.getBoundingClientRect()
        const offset = (rect.top + rect.height / 2 - viewportMid) / window.innerHeight
        const strength = element.dataset.parallax === 'hero' ? 64 : 18
        element.style.setProperty('--parallax-y', `${Math.max(-1, Math.min(1, offset)) * -strength}px`)
      })
      frame = undefined
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(updateParallax) }
    updateParallax()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])
  useEffect(() => {
    const screens = [...document.querySelectorAll('.screen-enter')]
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // Reset after a screen leaves the viewport so its arrival animation can
        // play again whether the visitor scrolls forward or back.
        entry.target.classList.toggle('is-entered', entry.isIntersecting)
      })
    }, { threshold: 0.12 })
    screens.forEach((screen) => observer.observe(screen))
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const spotlight = document.querySelector('.spotlight')
    if (!spotlight || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined
    let frame
    const moveSpotlight = (event) => {
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        spotlight.style.setProperty('--spotlight-x', `${event.clientX}px`)
        spotlight.style.setProperty('--spotlight-y', `${event.clientY}px`)
        spotlight.classList.add('is-active')
      })
    }
    const hideSpotlight = () => spotlight.classList.remove('is-active')
    window.addEventListener('pointermove', moveSpotlight, { passive: true })
    document.addEventListener('mouseleave', hideSpotlight)
    return () => {
      window.removeEventListener('pointermove', moveSpotlight)
      document.removeEventListener('mouseleave', hideSpotlight)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  const openProject = (project) => {
    window.history.pushState({}, '', `#project-${project.id}`)
    setDetail(project)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const closeProject = () => {
    window.history.pushState({}, '', '#projects')
    setDetail(null)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.querySelectorAll('.screen-enter').forEach((screen) => screen.classList.add('is-entered'))
      document.querySelector('#projects')?.scrollIntoView({ behavior: 'smooth' })
    }))
  }
  if (detail) return <ProjectDetail project={detail} onBack={closeProject} />

  return <main>
    <div className="spotlight" aria-hidden="true" />
    <header className="nav" aria-label="主导航">
      <div className="avatar-profile">
        <button className="avatar" type="button" onClick={() => setProfileOpen(true)} aria-label="打开个人信息卡片" aria-haspopup="dialog" aria-expanded={profileOpen}><img src="/assets/avatar.png" alt="" /></button>
        <span className="avatar-name">卢潇浪</span>
      </div>
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="展开导航">{menuOpen ? '×' : '☰'}</button>
      <nav className={menuOpen ? 'nav-links gooey-nav open' : 'nav-links gooey-nav'}>
        {navItems.map((item, index) => <a key={item.href} onClick={() => selectNav(index)} className={activeNav === index ? 'is-active' : ''} href={item.href}>{item.label}</a>)}
        <span className="gooey-particles" aria-hidden="true" key={gooeyKey}>
          {Array.from({ length: 15 }, (_, index) => <i key={index} style={{ '--particle': index, '--active-item': activeNav, '--x': `${(index % 5 - 2) * 11}px`, '--y': `${(Math.floor(index / 5) - 1) * 22 - 14}px` }} />)}
        </span>
      </nav>
    </header>

    {profileOpen && <div className="profile-overlay" role="presentation" onClick={() => setProfileOpen(false)}>
      <div className="profile-card-pop" role="dialog" aria-modal="true" aria-label="卢潇浪个人信息" onClick={(event) => event.stopPropagation()}>
        <img src="/assets/profile-card.png" alt="卢潇浪个人信息卡片" />
      </div>
    </div>}

    <section className="hero" id="home">
      <video className="hero-video parallax-media" data-parallax="hero" src="/assets/hero-video.mp4" autoPlay muted loop playsInline />
      <div className="hero-shade" />
      <div className="hero-content page-width">
        <img className="hero-title-image" src="/assets/design-presentation.png" alt="Design presentation" />
        <p className="hero-subtitle">A collection of product design works<br/>by a UIUX designer.</p>
      </div>
    </section>

    <section className="asset-screen screen-enter" id="about">
      <img className="parallax-media" src="/assets/profile.png" alt="个人介绍" />
      <div className="about-tag-hotspots" aria-label="个人能力标签">
        <span className="about-tag about-tag--baidu" aria-label="百度 AI 产品实习" />
        <span className="about-tag about-tag--aigc" aria-label="AIGC 全流程" />
        <span className="about-tag about-tag--experience" aria-label="体验设计" />
        <span className="about-tag about-tag--vibe" aria-label="Vibe Coding" />
      </div>
    </section>

    <section className="asset-screen catalog-screen screen-enter" id="projects">
      <img className="parallax-media" src="/assets/catalog.png" alt="作品目录" />
      <div className="catalog-mobile-title" aria-hidden="true">
        <strong>作品目录</strong>
        <em>Designer</em>
      </div>
      <div className="catalog-cards" aria-label="作品列表">
        {projects.slice(0, 3).map((project) => (
          <SpotlightCard className="catalog-spotlight" key={project.id} spotlightColor="#f7f8ff" intensity={0.1} spotlightSize={260} borderGlow={0.32} proximity={120}>
            <button className="catalog-card" type="button" onClick={() => openProject(project)} aria-label={`查看 ${project.name} 项目详情`}>
              <img src={project.image} alt="" />
            </button>
          </SpotlightCard>
        ))}
      </div>
    </section>

    <WorkShowcase />

    <section className="asset-screen screen-enter" id="contact">
      <img className="parallax-media" src="/assets/contact.png" alt="联系我" />
    </section>
  </main>
}

function WorkShowcase({ rootId = 'showcase', images = createCaseImages(), chapters: chapterItems, flushImages = false, showIndexLabel = true, chapterOffset = 0, onBack }) {
  const [activeChapter, setActiveChapter] = useState(0)
  const showcaseImages = images
  const defaultChapters = [
    { label: '项目封面', page: 0 },
    { label: '背景现状', page: 1 },
    { label: '用户洞察', page: 2 },
    { label: '策略推导', page: 3 },
    { label: 'AI验证', page: 4 },
    { label: '方案展示', page: 5 },
    { label: '复盘总结', page: showcaseImages.length - 1 },
  ]
  const chapters = chapterItems ?? defaultChapters
  useEffect(() => {
    let frame
    const syncActiveChapter = () => {
      frame = undefined
      const marker = window.innerHeight * 0.42
      const current = [...chapters].reverse().find((chapter) => {
        const target = document.getElementById(`${rootId}-${chapter.page}`)
        return target && target.getBoundingClientRect().top <= marker
      })
      const nextPage = current?.page ?? 0
      setActiveChapter((page) => page === nextPage ? page : nextPage)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(syncActiveChapter) }
    syncActiveChapter()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [rootId])
  return <section className={`work-showcase${flushImages ? ' work-showcase--flush' : ''}`} id={rootId} aria-label="作品展示详情">
    <aside className="showcase-rail">
      {onBack ? <button className="showcase-back" type="button" onClick={onBack}>← <span>返回目录</span></button> : <a href="#projects" className="showcase-back">← <span>返回目录</span></a>}
      {showIndexLabel && <p className="showcase-label">PROJECT INDEX</p>}
      <nav className="showcase-chapters" style={chapterOffset ? { marginTop: chapterOffset } : undefined} aria-label="案例章节">
        {chapters.map((chapter) => <a key={chapter.label} className={activeChapter === chapter.page ? 'is-current' : ''} onClick={() => setActiveChapter(chapter.page)} href={`#${rootId}-${chapter.page}`}>{chapter.label}</a>)}
      </nav>
      {!onBack && <a href="#contact" className="showcase-contact">联系我 <b>↗</b></a>}
    </aside>

    <div className="showcase-canvas">
      <article className="case-sheet case-sheet--hero" id={`${rootId}-0`}>
        <img className="showcase-image showcase-image--cover" src={showcaseImages[0].src} alt="作品展示图 1" />
      </article>

      {showcaseImages.slice(1).map((image, index) => <article className="case-sheet case-sheet--asset" id={`${rootId}-${index + 1}`} key={image.number}>
        <img className="showcase-image" src={image.src} alt={`作品展示图 ${index + 2}`} loading="lazy" />
      </article>)}
    </div>
  </section>
}

function ProjectDetail({ project, onBack }) {
  return <main className="detail-page">
    <WorkShowcase rootId={`project-${project.id}-showcase`} images={project.caseImages} chapters={project.caseChapters} flushImages={project.flushImages} showIndexLabel={project.showIndexLabel !== false} chapterOffset={project.chapterOffset} onBack={onBack} />
  </main>
}

createRoot(document.getElementById('root')).render(<App />)
