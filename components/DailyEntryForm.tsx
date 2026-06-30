"use client"

import { useEffect, useMemo, useState } from "react"
import { categories, type DailyEntry } from "@/lib/constants"
import { calculateScores, intelligentNudges, zone } from "@/lib/scoring"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

const today = () => new Date().toISOString().slice(0, 10)

const defaultEntry: DailyEntry = {
  entry_date: today(),
  day_type: "Flexible",
  entry_mode: "Human + AI",
  device_manual_note: "Manual entry with optional device evidence",
  physical_vitality_min: 0,
  inner_practice_min: 0,
  mindful_eating_score: 3,
  revenue_money_work_min: 0,
  growth_self_learning_min: 0,
  ai_human_partnership_min: 0,
  family_connection_min: 0,
  seva_planet_min: 0,
  joyful_relaxation_min: 0,
  sleep_preparation_min: 0,
  sleep_hours: null,
  sleep_quality: null,
  meals_captured: "Partial",
  breakfast_notes: "",
  lunch_notes: "",
  dinner_notes: "",
  water_litres: null,
  estimated_calories: null,
  energy_score: null,
  mood_score: null,
  one_short_reflection: "",
  tomorrow_focus: ""
}

function num(value: unknown) {
  if (value === "" || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function DailyEntryForm() {
  const [entry, setEntry] = useState<DailyEntry>(defaultEntry)
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const scores = useMemo(() => calculateScores(entry), [entry])
  const nudges = useMemo(() => intelligentNudges(entry), [entry])

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/"
        return
      }
      setUserId(data.user.id)
      upsertProfile(data.user.id, data.user.email ?? "", data.user.user_metadata?.full_name ?? data.user.email ?? "")
      loadEntry(data.user.id, entry.entry_date)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function upsertProfile(id: string, email: string, fullName: string) {
    const supabase = createBrowserSupabaseClient()
    await supabase.from("profiles").upsert({ id, email, full_name: fullName, timezone: "Asia/Singapore" })
    await supabase.from("reminder_preferences").upsert({
      user_id: id,
      email,
      timezone: "Asia/Singapore",
      enabled: true,
      morning_time: "08:00"
    }, { onConflict: "user_id" })
  }

  async function loadEntry(uid: string, date: string) {
    setLoading(true)
    const supabase = createBrowserSupabaseClient()
    const { data, error } = await supabase.from("daily_entries").select("*").eq("user_id", uid).eq("entry_date", date).maybeSingle()
    if (error) setStatus(error.message)
    setEntry(data ? { ...defaultEntry, ...data } : { ...defaultEntry, entry_date: date })
    setLoading(false)
  }

  function update<K extends keyof DailyEntry>(key: K, value: DailyEntry[K]) {
    setEntry(prev => ({ ...prev, [key]: value }))
  }

  async function save() {
    if (!userId) return
    setStatus("Saving...")
    const supabase = createBrowserSupabaseClient()
    const next = calculateScores(entry)
    const payload = {
      ...entry,
      user_id: userId,
      wellbeing_score: next.wellbeing_score,
      performance_score: next.performance_score,
      happiness_quotient: next.happiness_quotient,
      quantum_mind_score: next.quantum_mind_score,
      predicted_next_day_energy: next.predicted_next_day_energy,
      ai_assessment: next.ai_assessment,
      updated_at: new Date().toISOString()
    }
    const { error } = await supabase.from("daily_entries").upsert(payload, { onConflict: "user_id,entry_date" })
    setStatus(error ? error.message : "Saved. Dashboard updated.")
  }

  return (
    <div className="container section">
      <div className="grid grid-2">
        <section>
          <span className="kicker">Daily Quick Entry</span>
          <h2>Capture the day in one screen</h2>
          <p>Use simple dropdowns and sliders. The app calculates wellbeing, happiness quotient, performance, quantum-mind readiness and predicted next-day energy.</p>
        </section>
        <section className="notice">
          <strong>Intelligent UI logic</strong>
          <p>Low sleep, missing meals, low movement or low mood triggers guidance. The goal is gentle correction, not guilt.</p>
        </section>
      </div>

      <div className="form-card" style={{ marginTop: 20 }}>
        <div className="grid grid-4">
          <div className="field"><label>Date</label><input type="date" value={entry.entry_date} onChange={e => { update("entry_date", e.target.value); if (userId) loadEntry(userId, e.target.value) }} /></div>
          <div className="field"><label>Day Type</label><select value={entry.day_type ?? "Flexible"} onChange={e => update("day_type", e.target.value)}><option>Flexible</option><option>Work Day</option><option>Weekend</option><option>Travel</option><option>Recovery</option><option>High Pressure</option></select></div>
          <div className="field"><label>Entry Mode</label><select value={entry.entry_mode ?? "Human + AI"} onChange={e => update("entry_mode", e.target.value)}><option>Human</option><option>AI-assisted</option><option>Human + AI</option><option>Device + Manual</option><option>Manual only</option></select></div>
          <div className="field"><label>Device / Manual Note</label><input value={entry.device_manual_note ?? ""} onChange={e => update("device_manual_note", e.target.value)} placeholder="Apple Watch, phone, manual, calendar" /></div>
        </div>
      </div>

      {loading ? <p>Loading entry...</p> : null}

      <div className="grid grid-3" style={{ marginTop: 16 }}>
        {categories.map(cat => (
          <div className="form-card" key={cat.key}>
            <div className="field">
              <label>{cat.label}</label>
              <p className="small">Target: {cat.target} {cat.unit}. {cat.help}</p>
              <div className="range-line">
                <input type="range" min="0" max={cat.key === "revenue_money_work_min" ? "720" : "240"} step="5" value={Number(entry[cat.key as keyof DailyEntry] ?? 0)} onChange={e => update(cat.key as keyof DailyEntry, num(e.target.value) as never)} />
                <input type="number" value={Number(entry[cat.key as keyof DailyEntry] ?? 0)} onChange={e => update(cat.key as keyof DailyEntry, num(e.target.value) as never)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <section className="form-card">
          <span className="kicker">Food, water and mindful eating</span>
          <div className="grid grid-3">
            <div className="field"><label>Mindful Eating 0–5</label><select value={entry.mindful_eating_score ?? 3} onChange={e => update("mindful_eating_score", num(e.target.value))}>{[0,1,2,3,4,5].map(v => <option key={v}>{v}</option>)}</select></div>
            <div className="field"><label>Meals Captured?</label><select value={entry.meals_captured ?? "Partial"} onChange={e => update("meals_captured", e.target.value)}><option>None</option><option>Partial</option><option>Complete</option></select></div>
            <div className="field"><label>Water Litres</label><input type="number" step="0.1" value={entry.water_litres ?? ""} onChange={e => update("water_litres", num(e.target.value))} /></div>
          </div>
          <div className="field"><label>Breakfast Notes</label><input value={entry.breakfast_notes ?? ""} onChange={e => update("breakfast_notes", e.target.value)} placeholder="e.g. fruits, eggs, oats" /></div>
          <div className="field"><label>Lunch Notes</label><input value={entry.lunch_notes ?? ""} onChange={e => update("lunch_notes", e.target.value)} /></div>
          <div className="field"><label>Dinner Notes</label><input value={entry.dinner_notes ?? ""} onChange={e => update("dinner_notes", e.target.value)} /></div>
          <div className="field"><label>Estimated Calories</label><input type="number" value={entry.estimated_calories ?? ""} onChange={e => update("estimated_calories", num(e.target.value))} /></div>
        </section>

        <section className="form-card">
          <span className="kicker">Sleep, energy, mood and reflection</span>
          <div className="grid grid-2">
            <div className="field"><label>Sleep Hours</label><input type="number" step="0.25" value={entry.sleep_hours ?? ""} onChange={e => update("sleep_hours", num(e.target.value))} /></div>
            <div className="field"><label>Sleep Quality 1–5</label><select value={entry.sleep_quality ?? ""} onChange={e => update("sleep_quality", num(e.target.value))}><option value="">Select</option>{[1,2,3,4,5].map(v => <option key={v}>{v}</option>)}</select></div>
            <div className="field"><label>Actual Energy 1–10</label><select value={entry.energy_score ?? ""} onChange={e => update("energy_score", num(e.target.value))}><option value="">Select</option>{[1,2,3,4,5,6,7,8,9,10].map(v => <option key={v}>{v}</option>)}</select></div>
            <div className="field"><label>Actual Mood 1–10</label><select value={entry.mood_score ?? ""} onChange={e => update("mood_score", num(e.target.value))}><option value="">Select</option>{[1,2,3,4,5,6,7,8,9,10].map(v => <option key={v}>{v}</option>)}</select></div>
          </div>
          <div className="field"><label>One Short Reflection</label><textarea value={entry.one_short_reflection ?? ""} onChange={e => update("one_short_reflection", e.target.value)} placeholder="What happened? What helped? What must improve tomorrow?" /></div>
          <div className="field"><label>Tomorrow Focus</label><input value={entry.tomorrow_focus ?? ""} onChange={e => update("tomorrow_focus", e.target.value)} placeholder="One high-leverage correction" /></div>
        </section>
      </div>

      <section className="grid grid-4" style={{ marginTop: 16 }}>
        <div className="metric-card"><span>Wellbeing</span><strong>{scores.wellbeing_score}</strong><p className="small">{zone(scores.wellbeing_score)}</p></div>
        <div className="metric-card"><span>Happiness Quotient</span><strong>{scores.happiness_quotient}</strong><p className="small">Mood + relationships + joy + purpose</p></div>
        <div className="metric-card"><span>Next-Day Energy</span><strong>{scores.predicted_next_day_energy}</strong><p className="small">Prediction improves with sleep + food data</p></div>
        <div className="metric-card"><span>Quantum Mind Readiness</span><strong>{scores.quantum_mind_score}</strong><p className="small">Metaphor: disciplined mind + AI partnership</p></div>
      </section>

      {nudges.length ? <section className="notice" style={{ marginTop: 16 }}><strong>Suggested corrections</strong>{nudges.map(n => <p key={n}>• {n}</p>)}</section> : null}

      <div className="cta-row">
        <button className="primary-btn" onClick={save}>Save Daily Entry</button>
        <a className="ghost-btn" href="/mood">Log Mood</a>
        <a className="ghost-btn" href="/gratitude">Add Gratitude</a>
      </div>
      {status ? <p className="success">{status}</p> : null}
    </div>
  )
}
