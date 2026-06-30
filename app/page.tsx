import { AuthPanel } from "@/components/AuthPanel"

export default function HomePage() {
  return (
    <main className="hero">
      <div className="container hero-grid">
        <section>
          <span className="eyebrow">Daily ritual for the AI era</span>
          <h1>Human + Machine Sadhana</h1>
          <p>
            A simple wellbeing and performance ritual for humans living in an ecosystem shaped by machines, AI and technology. Track physical vitality, inner practice, livelihood work, learning, AI partnership, family, seva, food, mood, gratitude and sleep.
          </p>
          <div className="cta-row">
            <a className="primary-btn" href="#login">Login with Google</a>
            <a className="ghost-btn" href="/method">View the method</a>
          </div>
          <div className="section grid grid-3">
            <div className="card"><span className="icon">🧘</span><h3>Inner operating system</h3><p>Prayer, meditation and healing help reduce mental noise and improve direction of mind.</p></div>
            <div className="card"><span className="icon">⚙️</span><h3>Human-machine partnership</h3><p>AI becomes a co-worker, not a replacement for human purpose, care and judgment.</p></div>
            <div className="card"><span className="icon">🌱</span><h3>Planetary sustainability</h3><p>Daily seva and sustainability acts keep personal growth connected to collective progress.</p></div>
          </div>
        </section>
        <section className="hero-card" id="login">
          <img src="/sadhana-hero.svg" alt="Human and machine in a nature-inspired future" />
          <div className="hero-caption">
            <AuthPanel />
          </div>
        </section>
      </div>
    </main>
  )
}
