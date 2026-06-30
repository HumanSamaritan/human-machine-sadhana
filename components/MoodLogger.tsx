"use client"

import { useEffect, useMemo, useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { feelingLabels, moodFactors } from "@/lib/constants"

const today = () => new Date().toISOString().slice(0, 10)

export function MoodLogger() {
  const [userId, setUserId] = useState<string | null>(null)
  const [entryDate, setEntryDate] = useState(today())
  const [moodScore, setMoodScore] = useState(0)
  const [energyScore, setEnergyScore] = useState(0)
  const [stressScore, setStressScore] = useState(0)
  const [moodTime, setMoodTime] = useState("end_of_day")
  const [factors, setFactors] = useState<string[]>([])
  const [note, setNote] = useState("")
  const [status, setStatus] = useState("")

  const valence = useMemo(() => {
    if (moodScore <= 2) return feelingLabels[0]
    if (moodScore <= 4) return feelingLabels[1]
    if (moodScore === 5) return feelingLabels[3]
    if (moodScore <= 7) return feelingLabels[4]
    if (moodScore <= 9) return feelingLabels[5]
    return feelingLabels[6]
  }, [moodScore])

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = "/"
      else setUserId(data.user.id)
    })
  }, [])

  function toggleFactor(factor: string) {
    setFactors(prev => prev.includes(factor) ? prev.filter(f => f !== factor) : [...prev, factor])
  }

  async function save() {
    if (!userId) return
    const supabase = createBrowserSupabaseClient()
    setStatus("Saving mood...")
    const payload = {
      user_id: userId,
      entry_date: entryDate,
      mood_time: moodTime,
      mood_score: moodScore,
      energy_score: energyScore,
      stress_score: stressScore,
      valence_label: valence,
      factors,
      note,
      updated_at: new Date().toISOString()
    }
    const { error } = await supabase.from("mood_entries").upsert(payload, { onConflict: "user_id,entry_date,mood_time" })
    if (error) {
      setStatus(error.message)
      return
    }

    const { data: dailyEntry } = await supabase
      .from("daily_entries")
      .select("predicted_next_day_energy")
      .eq("user_id", userId)
      .eq("entry_date", entryDate)
      .maybeSingle()

    const predicted = Number(dailyEntry?.predicted_next_day_energy ?? 0)
    if (predicted > 0) {
      await supabase.from("prediction_feedback").upsert({
        user_id: userId,
        entry_date: entryDate,
        predicted_energy: predicted,
        actual_energy: energyScore * 10,
        actual_mood: moodScore * 10,
        prediction_delta: energyScore * 10 - predicted,
        notes: "Captured from mood logger",
        created_at: new Date().toISOString()
      }, { onConflict: "user_id,entry_date" })
    }

    setStatus("Mood saved. Dashboard can now compare predicted energy vs actual feeling.")
  }

  return (
    <div className="container section">
      <span className="kicker">State of Mind</span>
      <h2>How are you feeling?</h2>
      <p>This page follows the same simple pattern as modern wellbeing apps: log today’s overall mood, actual energy, stress, and the life factors behind it.</p>
      <div className="grid grid-2">
        <section className="form-card">
          <div className="grid grid-2">
            <div className="field"><label>Date</label><input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} /></div>
            <div className="field"><label>Timing</label><select value={moodTime} onChange={e => setMoodTime(e.target.value)}><option value="during_day">During the day</option><option value="end_of_day">End of day</option><option value="weekly_review">Weekly review</option></select></div>
          </div>
          <div className="field">
          <label>Mood: {moodScore ? `${moodScore}/10 — ${valence}` : "Not entered"}</label>
          <input type="range" min="0" max="10" value={moodScore} onChange={e => setMoodScore(Number(e.target.value))} />
          </div>

         <div className="field">
         <label>Actual Energy: {energyScore ? `${energyScore}/10` : "Not entered"}</label>
         <input type="range" min="0" max="10" value={energyScore} onChange={e => setEnergyScore(Number(e.target.value))} />
         </div>

         <div className="field">
         <label>Stress / Load: {stressScore ? `${stressScore}/10` : "Not entered"}</label>
         <input type="range" min="0" max="10" value={stressScore} onChange={e => setStressScore(Number(e.target.value))} />
         </div>
          <div className="field"><label>Additional context</label><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="What influenced the mood today?" /></div>
          <button className="primary-btn" onClick={save}>Save Mood</button>
          {status ? <p className="success">{status}</p> : null}
        </section>
        <section className="form-card">
          <span className="kicker">Associated factors</span>
          <p>Select what had the biggest impact today.</p>
          <div className="factor-list">
            {moodFactors.map(factor => (
              <label className="pill check-pill" key={factor}>
                <input type="checkbox" checked={factors.includes(factor)} onChange={() => toggleFactor(factor)} />{factor}
              </label>
            ))}
          </div>
          <div className="notice" style={{ marginTop: 18 }}>
            <strong>Why this matters</strong>
            <p>Prediction improves when the app can compare forecasted energy with the user’s actual feeling. Over time this helps tune the formula for the individual.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
