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
            <a className="ghost-btn" href="/demo">Watch demo</a>
            <a className="ghost-btn" href="/method">Method</a>
          </div>
          <div className="section grid grid-3">
            <span className="icon" aria-hidden="true">●</span>
<span className="icon" aria-hidden="true">✦</span>
<span className="icon" aria-hidden="true">◆</span>
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




