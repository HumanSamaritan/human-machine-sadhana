"use client"

import { useEffect, useMemo, useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { calculateScores, zone } from "@/lib/scoring"
import { MetricCard } from "./MetricCard"
import type { DailyEntry } from "@/lib/constants"

type MoodEntry = {
  entry_date: string
  mood_score: number | null
  energy_score: number | null
  stress_score: number | null
  factors?: string[] | null
  note?: string | null
}
type GratitudeEntry = { entry_date: string; item_count: number }
type PredictionFeedback = { entry_date: string; predicted_energy: number | null; actual_energy: number | null; prediction_delta: number | null }

function avg(values: number[]) {
  const v = values.filter(x => Number.isFinite(x))
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0
}

function dateKey(daysAgo: number) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

function groupWindow(entries: DailyEntry[], days: number) {
  const start = dateKey(days)
  return entries.filter(e => e.entry_date >= start)
}

function MiniBars({ entries, moods }: { entries: DailyEntry[]; moods: MoodEntry[] }) {
  const moodByDate = new Map(moods.map(m => [m.entry_date, m]))

  const data = entries.slice(-14).map(e => {
    const mood = moodByDate.get(e.entry_date)
    return {
      date: e.entry_date.slice(5),
      predicted: Number(e.predicted_next_day_energy ?? 0),
      actual: Number(mood?.energy_score ?? 0) * 10
    }
  })

  if (!data.length) {
    return (
      <div className="chart-empty">
        <p>Save daily entries to see predicted energy. Add mood logs to compare actual energy.</p>
      </div>
    )
  }

  const width = 740
  const height = 280
  const chartTop = 44
  const chartBottom = 42
  const chartHeight = height - chartTop - chartBottom
  const groupWidth = (width - 64) / data.length
  const barWidth = Math.max(10, Math.min(24, groupWidth * 0.28))

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart" role="img" aria-label="Predicted and actual energy bar chart">
      {[0, 25, 50, 75, 100].map(v => {
        const y = chartTop + chartHeight - (v / 100) * chartHeight
        return (
          <g key={v}>
            <line x1="42" x2={width - 22} y1={y} y2={y} stroke="rgba(255,255,255,.14)" />
            <text x="10" y={y + 4} fill="#aebcd0" fontSize="12">{v}</text>
          </g>
        )
      })}

      <g transform={`translate(${width - 260}, 24)`}>
      <rect x="0" y="-12" width="14" height="14" rx="3" fill="#F3C768" />
      <text x="22" y="0" fill="#eaf0f7" fontSize="13">Predicted</text>
      <rect x="120" y="-12" width="14" height="14" rx="3" fill="#69E7FF" />
      <text x="142" y="0" fill="#eaf0f7" fontSize="13">Actual</text>
      </g>

      {data.map((d, i) => {
      const groupX = data.length === 1 ? width / 2 - barWidth - 8 : 52 + i * groupWidth
      const predictedX = groupX
      const actualX = groupX + barWidth + 8        
        const predictedHeight = (Math.max(0, Math.min(100, d.predicted)) / 100) * chartHeight
        const actualHeight = (Math.max(0, Math.min(100, d.actual)) / 100) * chartHeight
        const baseY = chartTop + chartHeight

        return (
          <g key={`${d.date}-${i}`}>
            <rect x={predictedX} y={baseY - predictedHeight} width={barWidth} height={predictedHeight} rx="4" fill="#F3C768" />
            <rect x={actualX} y={baseY - actualHeight} width={barWidth} height={actualHeight} rx="4" fill="#69E7FF" opacity={d.actual ? 1 : .18} />
            <text x={groupX} y={height - 14} fill="#aebcd0" fontSize="10">{d.date}</text>
          </g>
        )
      })}
    </svg>
  )
}

export function DashboardCharts() {
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [moods, setMoods] = useState<MoodEntry[]>([])
  const [gratitude, setGratitude] = useState<GratitudeEntry[]>([])
  const [feedback, setFeedback] = useState<PredictionFeedback[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = "/"; return }
      const [daily, mood, grat, prediction] = await Promise.all([
        supabase.from("daily_entries").select("*").eq("user_id", data.user.id).order("entry_date", { ascending: true }).limit(120),
        supabase.from("mood_entries").select("entry_date,mood_score,energy_score,stress_score,factors,note").eq("user_id", data.user.id).order("entry_date", { ascending: true }).limit(120),
        supabase.from("gratitude_entries").select("entry_date,item_count").eq("user_id", data.user.id).order("entry_date", { ascending: true }).limit(120),
        supabase.from("prediction_feedback").select("entry_date,predicted_energy,actual_energy,prediction_delta").eq("user_id", data.user.id).order("entry_date", { ascending: true }).limit(120)
      ])
      setEntries((daily.data ?? []) as DailyEntry[])
      setMoods((mood.data ?? []) as MoodEntry[])
      setGratitude((grat.data ?? []) as GratitudeEntry[])
      setFeedback((prediction.data ?? []) as PredictionFeedback[])
      setLoading(false)
    })
  }, [])

  const latest = entries[entries.length - 1]
  const latestScores = latest ? calculateScores(latest) : null
  const weekly = groupWindow(entries, 7)
  const monthly = groupWindow(entries, 30)
  const latestMood = latest ? moods.find(m => m.entry_date === latest.entry_date):undefined

  const summary = useMemo(() => {
    const score = (e: DailyEntry) => e.wellbeing_score ?? calculateScores(e).wellbeing_score
    const energy = (e: DailyEntry) => e.predicted_next_day_energy ?? calculateScores(e).predicted_next_day_energy
    const recentFeedback = feedback.filter(f => f.entry_date >= dateKey(30) && Number.isFinite(Number(f.prediction_delta)))
    const forecastAdjustment = recentFeedback.length ? avg(recentFeedback.map(f => Number(f.prediction_delta))) : 0
    const rawNextEnergy = latestScores?.predicted_next_day_energy ?? 0
    return {
      weeklyWellbeing: avg(weekly.map(e => Number(score(e)))),
      monthlyWellbeing: avg(monthly.map(e => Number(score(e)))),
      weeklyEnergy: avg(weekly.map(e => Number(energy(e)))),
      monthlyEnergy: avg(monthly.map(e => Number(energy(e)))),
      gratitudeCount: gratitude.filter(g => g.entry_date >= dateKey(30)).reduce((a, b) => a + Number(b.item_count ?? 0), 0),
      feedbackCount: recentFeedback.length,
      forecastAdjustment,
      personalizedNextEnergy: Math.max(0, Math.min(100, rawNextEnergy + forecastAdjustment))
    }
  }, [weekly, monthly, gratitude, feedback, latestScores])

  const behaviorTrend = useMemo(() => {
  if (!moods.length) {
    return "Add mood entries to reveal behavior patterns across mood, stress, energy and life factors."
  }

  const recent = moods.slice(-7)
  const avgMood = avg(recent.map(m => Number(m.mood_score ?? 0) * 10))
  const avgEnergy = avg(recent.map(m => Number(m.energy_score ?? 0) * 10))
  const avgStress = avg(recent.map(m => Number(m.stress_score ?? 0) * 10))

  const factorCounts = new Map<string, number>()
  recent.forEach(m => {
    ;(m.factors ?? []).forEach(f => factorCounts.set(f, (factorCounts.get(f) ?? 0) + 1))
  })

  const topFactor = [...factorCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]

  if (avgStress >= 70) {
    return `Recent pattern: stress is high at ${avgStress}/100${topFactor ? `, often linked with ${topFactor}` : ""}. Reduce overload and protect recovery.`
  }

  if (avgMood >= 75 && avgEnergy >= 75) {
    return `Recent pattern: mood and energy are strong${topFactor ? `, with ${topFactor} appearing often` : ""}. Continue this rhythm and observe what sustains it.`
  }

  if (avgEnergy < 50) {
    return `Recent pattern: energy is low at ${avgEnergy}/100${topFactor ? `, often linked with ${topFactor}` : ""}. Improve sleep, food tracking and movement.`
  }

  return `Recent pattern: mood ${avgMood}/100, energy ${avgEnergy}/100, stress ${avgStress}/100${topFactor ? `. Most common factor: ${topFactor}.` : "."}`
}, [moods])

  if (loading) return <div className="container section"><p>Loading dashboard...</p></div>

  if (!latest || !latestScores) {
    return (
      <div className="container section">
        <h2>Your dashboard is ready</h2>
        <p>Save your first daily entry to generate charts.</p>
        <a className="primary-btn" href="/entry">Create first entry</a>
      </div>
    )
  }

  return (
    <div className="container section">
      <span className="kicker">Outcome Dashboard</span>
      <h2>Wellbeing, happiness quotient and energy forecast</h2>
      <p>Daily, weekly and monthly views compare predicted energy with actual feeling. The model can be tuned as more data is collected.</p>

      <section className="grid grid-4">
        <MetricCard label="Today Wellbeing" value={latestScores.wellbeing_score} sub={zone(latestScores.wellbeing_score)} />
        <MetricCard label="Happiness Quotient" value={latestScores.happiness_quotient} sub="Mood + joy + family + purpose" />
        <MetricCard label="Next-Day Energy" value={summary.personalizedNextEnergy} sub={summary.feedbackCount ? `Personalized by ${summary.forecastAdjustment >= 0 ? "+" : ""}${summary.forecastAdjustment} pts` : "Prediction for tomorrow"} />
        <MetricCard label="Quantum Mind Readiness" value={latestScores.quantum_mind_score} sub="Disciplined mind + AI partnership" />
      </section>

      <section className="grid grid-3" style={{ marginTop: 16 }}>
        <MetricCard label="Weekly Wellbeing" value={summary.weeklyWellbeing} sub={`${weekly.length} day(s) captured`} />
        <MetricCard label="Monthly Wellbeing" value={summary.monthlyWellbeing} sub={`${monthly.length} day(s) captured`} />
        <MetricCard label="Gratitude Items" value={summary.gratitudeCount} sub="Last 30 days, private content hidden" />
      </section>

      <section className="grid grid-2" style={{ marginTop: 16 }}>
        <div className="form-card">
          <span className="kicker">Dimension chart</span>
          {Object.entries(latestScores.dimensions).map(([label, score]) => (
            <div className="bar-row" key={label}>
              <span className="small">{label}</span>
              <div className="progress"><div style={{ width: `${Math.max(0, Math.min(100, score))}%` }} /></div>
              <strong>{Math.round(score)}</strong>
            </div>
          ))}
        </div>
        <div className="form-card">
          <span className="kicker">AI assessment
          <p>{behaviorTrend}</p>
          </span>
          <h3>{latestScores.ai_assessment}</h3>
          <p>Latest actual mood: {latestMood?.mood_score ?? latest.mood_score ?? "not captured"}/10. Latest actual energy: {latestMood?.energy_score ?? latest.energy_score ?? "not captured"}/10.</p>
          <p> Energy learning: {summary.feedbackCount ? `Across ${summary.feedbackCount} saved day(s), actual energy has been ${summary.forecastAdjustment >= 0 ? "higher" : "lower"} than predicted by ${Math.abs(summary.forecastAdjustment)} points on average. Future predictions are adjusted using this gap.`
  : "Save mood actual energy after daily entry to compare predicted and actual energy."}</p>
          <p className="small">This is a wellbeing reflection tool, not a medical diagnosis. The word “quantum” is used as a metaphor for multi-state thinking, disciplined attention and error correction in the mind.</p>
        </div>
      </section>

      <section className="form-card" style={{ marginTop: 16 }}>
        <span className="kicker">Predicted vs actual energy</span>
<MiniBars entries={entries} moods={moods} />
      </section>
    </div>
  )
}
