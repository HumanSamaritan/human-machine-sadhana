import { AppShell } from "@/components/AppShell"

const sources = [
  ["Harvard Human Flourishing", "Happiness, health, meaning, character, relationships and financial stability."],
  ["Nature Communications alertness study", "Next-day alertness is linked to sleep, physical activity, breakfast composition and glucose response."],
  ["Apple State of Mind pattern", "Mood logging works best when feeling, associated factors and trends are captured."],
  ["Vedic balance", "A balanced daily rhythm of food, work, rest, inner practice, family and duty."],
  ["Human + Machine philosophy", "AI should amplify human values, not replace human purpose."]
]

export default function MethodPage() {
  return (
      <main className="container section">
         <a className="ghost-btn icon-nav" href="/" aria-label="Back to Home" title="Back to Home" style={{ marginBottom: 20 }}> ⌂
         </a>
        <span className="kicker">Scoring method</span>
        <h2>The Human + Machine Sadhana model</h2>
        <p>
          The app is not a medical diagnosis tool. It is a reflective operating system for life in the AI era. It combines human flourishing, practical energy science, spiritual balance and human-machine partnership.
        </p>
        <div className="grid grid-2">
          <section className="form-card">
            <h3>Core outputs</h3>
            <table className="table">
              <tbody>
                <tr><th>Wellbeing Score</th><td>Holistic score across body, mind, food, livelihood, relationships, purpose and sleep.</td></tr>
                <tr><th>Happiness Quotient</th><td>Mood plus inner practice, joy, family, seva and nutrition.</td></tr>
                <tr><th>Next-Day Energy</th><td>Forecast based mainly on sleep, food, movement, recovery, inner practice and work balance.</td></tr>
                <tr><th>Quantum Mind Readiness</th><td>A metaphorical score for disciplined attention, learning, error correction and AI partnership.</td></tr>
              </tbody>
            </table>
          </section>
          <section className="form-card">
            <h3>Source logic</h3>
            {sources.map(([title, body]) => <div className="card" style={{ marginBottom: 10 }} key={title}><strong>{title}</strong><p>{body}</p></div>)}
          </section>
        </div>
        <section className="notice" style={{ marginTop: 16 }}>
          <strong>About “quantum gates in the mind”</strong>
          <p>The app treats this as a metaphor. Human cognition is not literally turned into quantum computing. The useful idea is error correction: identify mental noise, bias, distraction and fatigue, then improve attention, reflection, learning, ethics and partnership with machines.</p>
        </section>
      </main>
      )
}
