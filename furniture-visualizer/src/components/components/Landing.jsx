import { useState, useEffect, useRef, useCallback } from 'react'

/* ── data ── */
const COLLECTIONS = [
  {
    name: 'Table',
    img: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&h=1000&fit=crop',
  },
  {
    name: 'Chair',
    img: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=1000&fit=crop',
  },
  {
    name: 'Sofa',
    img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=1000&fit=crop',
  },
  {
    name: 'Bed',
    img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=1000&fit=crop',
  },
]

const PROJECTS = [
  {
    name: 'AZURE LOFT STUDIO',
    img: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=700&h=500&fit=crop',
  },
  {
    name: 'THE GRAND RESIDENCE',
    img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=700&h=500&fit=crop',
  },
  {
    name: 'NORDIC EMBASSY SUITE',
    img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=700&h=500&fit=crop',
  },
  {
    name: 'HILLSIDE VILLA',
    img: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=700&h=500&fit=crop',
  },
  {
    name: 'COASTAL MODERN HOME',
    img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700&h=500&fit=crop',
  },
  {
    name: 'ARTISAN WORKSPACE',
    img: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=700&h=500&fit=crop',
  },
]

const MATERIAL_SLIDES = [
  {
    img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&h=800&fit=crop&q=80',
    title: 'Natural Walnut',
    subtitle: 'Sustainably sourced hardwood with rich grain patterns',
  },
  {
    img: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&h=800&fit=crop&q=80',
    title: 'Italian Marble',
    subtitle: 'Timeless elegance in every surface',
  },
  {
    img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&h=800&fit=crop&q=80',
    title: 'Hand-Woven Fabric',
    subtitle: 'Artisanal textiles crafted with care',
  },
]

/* ── Intersection Observer hook ── */
function useReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.unobserve(el)
        }
      },
      { threshold: 0.12 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return [ref, visible]
}

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, visible] = useReveal()
  return (
    <div
      ref={ref}
      className={`ee-reveal ${visible ? 'ee-revealed' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/* ── Component ── */
export default function Landing({ onLogin, onStart }) {
  const [pageReady, setPageReady] = useState(false)
  const [matSlide, setMatSlide] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setPageReady(true))
  }, [])

  /* auto-rotate material slider */
  const timerRef = useRef(null)
  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setMatSlide((s) => (s + 1) % MATERIAL_SLIDES.length)
    }, 5000)
  }, [])

  useEffect(() => {
    resetTimer()
    return () => clearInterval(timerRef.current)
  }, [resetTimer])

  const goSlide = (i) => {
    setMatSlide(i)
    resetTimer()
  }

  return (
    <div className={`ee-landing ${pageReady ? 'ee-ready' : ''}`}>
      {/* ===== NAV ===== */}
      <header className="ee-nav">
        <div className="ee-nav-inner">
          <button
            className="ee-hamburger"
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className="ee-nav-left">
            <nav className={`ee-nav-links ${menuOpen ? 'open' : ''}`}>
              <button type="button" onClick={onStart}>PRODUCTS</button>
              <button type="button" onClick={onStart}>PROJECT</button>
              <button type="button" onClick={onStart}>ABOUT</button>
            </nav>
          </div>

          <div className="ee-nav-logo" onClick={onStart}>
            <span className="ee-logo-text">RoomCraft</span>
          </div>

          <div className="ee-nav-right-group">
            <nav className={`ee-nav-links ee-nav-right ${menuOpen ? 'open' : ''}`}>
              <button type="button" onClick={onStart}>BESPOKE</button>
              <button type="button" onClick={onStart}>STORE</button>
              <button type="button" onClick={onLogin}>CONTACT</button>
            </nav>
            <div className="ee-nav-actions">
              <button
                type="button"
                className="ee-nav-icon-btn"
                onClick={onLogin}
                aria-label="Login"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
                </svg>
              </button>
              <button
                type="button"
                className="ee-nav-icon-btn"
                onClick={onStart}
                aria-label="Cart"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="ee-hero">
        <div className="ee-hero-img-wrap">
          <img
            src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1800&h=900&fit=crop"
            alt="Luxury modern living room with designer furniture"
            loading="eager"
          />
          <div className="ee-hero-overlay" />
        </div>
        <div className="ee-hero-content">
          <Reveal>
            <h1>Bridging Craft<br />to Contemporary Living</h1>
          </Reveal>
          <Reveal delay={200}>
            <p>Where traditional artisanship meets modern design sensibility</p>
          </Reveal>
          <Reveal delay={400}>
            <button className="ee-btn-outline" onClick={onStart}>
              Discover the Collection
            </button>
          </Reveal>
        </div>
      </section>

      {/* ===== MATERIALS ===== */}
      <section className="ee-section ee-materials">
        <Reveal>
          <h2 className="ee-section-label">MATERIALS</h2>
        </Reveal>
        <div className="ee-mat-slider">
          {MATERIAL_SLIDES.map((slide, i) => (
            <div
              key={slide.title}
              className={`ee-mat-slide ${i === matSlide ? 'active' : ''}`}
            >
              <img src={slide.img} alt={slide.title} loading="lazy" />
              <div className="ee-mat-slide-overlay">
                <h3>{slide.title}</h3>
                <p>{slide.subtitle}</p>
                <button className="ee-btn-outline ee-btn-outline--light" onClick={onStart}>
                  Discover the Collection Story
                </button>
              </div>
            </div>
          ))}
          <div className="ee-mat-dots">
            {MATERIAL_SLIDES.map((_, i) => (
              <button
                key={i}
                className={`ee-dot ${i === matSlide ? 'active' : ''}`}
                onClick={() => goSlide(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== SHOP COLLECTIONS ===== */}
      <section className="ee-section ee-collections">
        <Reveal>
          <h2 className="ee-section-label">SHOP OUR COLLECTIONS</h2>
        </Reveal>
        <div className="ee-coll-grid">
          {COLLECTIONS.map((item, i) => (
            <Reveal key={item.name} delay={i * 120}>
              <div className="ee-coll-card" onClick={onStart}>
                <div className="ee-coll-img">
                  <img src={item.img} alt={item.name} loading="lazy" />
                </div>
                <span className="ee-coll-name">{item.name}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== PROJECTS ===== */}
      <section className="ee-section ee-projects">
        <div className="ee-projects-header">
          <Reveal>
            <h2 className="ee-section-label">PROJECTS</h2>
          </Reveal>
          <Reveal delay={100}>
            <button className="ee-link-btn" onClick={onStart}>
              Discover more →
            </button>
          </Reveal>
        </div>
        <div className="ee-proj-grid">
          {PROJECTS.map((proj, i) => (
            <Reveal key={proj.name} delay={i * 100}>
              <div className="ee-proj-card" onClick={onStart}>
                <img src={proj.img} alt={proj.name} loading="lazy" />
                <div className="ee-proj-overlay">
                  <span>{proj.name}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== PHILOSOPHY ===== */}
      <section className="ee-philosophy">
        <div className="ee-phil-bg">
          <img
            src="https://images.unsplash.com/photo-1616137466211-f73a09f6ae9d?w=1800&h=800&fit=crop"
            alt="Artisan workshop"
            loading="lazy"
          />
        </div>
        <div className="ee-phil-content">
          <Reveal>
            <h5 className="ee-phil-eyebrow">Bridging the Past, to the Future</h5>
          </Reveal>
          <Reveal delay={200}>
            <h2>Our Philosophy</h2>
          </Reveal>
          <Reveal delay={350}>
            <p>
              We breathe new life into heritage craftsmanship through contemporary
              design, creating furniture that honors tradition while embracing
              the modern lifestyle.
            </p>
          </Reveal>
          <Reveal delay={500}>
            <button className="ee-btn-outline ee-btn-outline--light" onClick={onStart}>
              Learn Our Philosophy
            </button>
          </Reveal>
        </div>
      </section>

      {/* ===== ARCHIVES & BESPOKE ===== */}
      <section className="ee-section ee-twin">
        <div className="ee-twin-grid">
          <Reveal>
            <div className="ee-twin-card">
              <h3>ARCHIVES</h3>
              <p>
                Discover the various activities and achievements of RoomCraft,
                where the beauty of natural materials blends with modern
                aesthetics to be reborn in contemporary design.
              </p>
              <button className="ee-link-btn" onClick={onStart}>
                Learn more →
              </button>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="ee-twin-card">
              <h3>BESPOKE</h3>
              <p>
                RoomCraft offers customized furniture consulting services
                tailored to a variety of spaces, including private residences,
                galleries, hotels, offices, and restaurants.
              </p>
              <button className="ee-link-btn" onClick={onStart}>
                Learn more →
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="ee-footer">
        <div className="ee-footer-inner">
          <div className="ee-footer-col">
            <h4>CONTACT</h4>
            <button type="button" onClick={onLogin}>T. 070. 8129. 1111</button>
            <button type="button" onClick={onLogin}>E. info@roomcraft.com</button>
          </div>
          <div className="ee-footer-col">
            <h4>PRODUCTS</h4>
            <button type="button" onClick={onStart}>By Category</button>
            <button type="button" onClick={onStart}>Lounge</button>
            <button type="button" onClick={onStart}>Dining</button>
            <button type="button" onClick={onStart}>Office</button>
            <button type="button" onClick={onStart}>Bedroom</button>
          </div>
          <div className="ee-footer-col">
            <h4>CLIENT SERVICE</h4>
            <button type="button" onClick={onLogin}>FAQ</button>
            <button type="button" onClick={onLogin}>Contact</button>
            <button type="button" onClick={onLogin}>Location</button>
          </div>
          <div className="ee-footer-col">
            <h4>LEGAL INFO</h4>
            <button type="button" onClick={onStart}>Privacy Policy</button>
            <button type="button" onClick={onStart}>Terms of Use</button>
          </div>
        </div>
        <div className="ee-footer-bottom">
          <span>© 2025 RoomCraft. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
