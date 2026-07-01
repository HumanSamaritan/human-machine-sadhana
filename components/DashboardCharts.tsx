"use client"

import { useEffect, useMemo, useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { calculateScores, zone } from "@/lib/scoring"
import { MetricCard } from "./MetricCard"
import type { DailyEntry } from "@/lib/constants"

type ReportRange = "day" | "week" | "month"
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

function rangeEntries(entries: DailyEntry[], range: ReportRange) {
  if (range === "day") return entries.slice(-1)
  return groupWindow(entries, range === "week" ? 7 : 30)
}

function MiniBars({ entries, moods }: { entries: DailyEntry[]; moods: MoodEntry[] }) {
  const moodByDate = new Map(moods.map(m => [m.entry_date, m]))
  const data = entries.slice(-14).map(e => {
    const mood = moodByDate.get(e.entry_date)
    return {
      date: e.entry_date.slice(5),
      predicted: Number(e.predicted_next_day_energy ?? calculateScores(e).predicted_next_day_energy ?? 0),
      actual: Number(mood?.energy_score ?? e.energy_score ?? 0) * 10
    }
  })

  const width = 740
  const height = 260
  const plotLeft = 56
  const plotRight = width - 28
  const plotBottom = height - 34
  const plotTop = 44
  const plotHeight = plotBottom - plotTop
  const groupWidth = data.length > 1 ? (plotRight - plotLeft) / (data.length - 1) : 0
  const barWidth = data.length <= 3 ? 24 : 16

  if (!data.length) return <p>No chart data yet. Save daily entries to view trends.</p>

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart" role="img" aria-label="Predicted and actual energy bar chart">
      <g className="chart-legend">
        <rect x="458" y="24" width="14" height="14" rx="4" fill="#F3C768" />
        <text x="482" y="36" fill="#f6f8fb" fontSize="13">Predicted</text>
        <rect x="562" y="24" width="14" height="14" rx="4" fill="#69E7FF" />
        <text x="586" y="36" fill="#f6f8fb" fontSize="13">Actual</text>
      </g>
      {[0, 25, 50, 75, 100].map(v => {
        const y = plotBottom - (v / 100) * plotHeight
        return (
          <g key={v}>
            <line x1={plotLeft} x2={plotRight} y1={y} y2={y} stroke="rgba(255,255,255,.12)" />
            <text x="22" y={y + 4} fill="#aebcd0" fontSize="12">{v}</text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const center = data.length === 1 ? (plotLeft + plotRight) / 2 : plotLeft + i * groupWidth
        const predictedX = center - barWidth - 4
        const actualX = center + 4
        const predictedHeight = (Math.max(0, Math.min(100, d.predicted)) / 100) * plotHeight
        const actualHeight = (Math.max(0, Math.min(100, d.actual)) / 100) * plotHeight
        return (
          <g key={`${d.date}-${i}`}>
            <rect x={predictedX} y={plotBottom - predictedHeight} width={barWidth} height={predictedHeight} rx="5" fill="#F3C768" />
            <rect x={actualX} y={plotBottom - actualHeight} width={barWidth} height={actualHeight} rx="5" fill="#69E7FF" />
            <text x={center - 14} y={plotBottom + 22} fill="#aebcd0" fontSize="12">{d.date}</text>
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
  const [reportRange, setReportRange] = useState<ReportRange>("day")

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
  const latestMood = latest ? moods.find(m => m.entry_date === latest.entry_date) : undefined
  const printableEntries = rangeEntries(entries, reportRange)

  const summary = useMemo(() => {
    const score = (e: DailyEntry) => e.wellbeing_score ?? calculateScores(e).wellbeing_score
    const energy = (e: DailyEntry) => e.predicted_next_day_energy ?? calculateScores(e).predicted_next_day_energy
    const recentFeedback = feedback.filter(f => f.entry_date >= dateKey(30) && Number.isFinite(Number(f.prediction_delta)))
    const forecastAdjustment = recentFeedback.length ? avg(recentFeedback.map(f => Number(f.prediction_delta))) : 0
    const rawNextEnergy = latestScores?.predicted_next_day_energy ?? 0
    const stressPenalty = latestMood?.stress_score ? Math.max(0, Number(latestMood.stress_score) - 5) * 4 : 0
    return {
      weeklyWellbeing: avg(weekly.map(e => Number(score(e)))),
      monthlyWellbeing: avg(monthly.map(e => Number(score(e)))),
      weeklyEnergy: avg(weekly.map(e => Number(energy(e)))),
      monthlyEnergy: avg(monthly.map(e => Number(energy(e)))),
      gratitudeCount: gratitude.filter(g => g.entry_date >= dateKey(30)).reduce((a, b) => a + Number(b.item_count ?? 0), 0),
      feedbackCount: recentFeedback.length,
      forecastAdjustment,
      personalizedNextEnergy: Math.max(0, Math.min(100, rawNextEnergy + forecastAdjustment - stressPenalty))
    }
  }, [weekly, monthly, gratitude, feedback, latestScores, latestMood])

  const behaviorTrend = useMemo(() => {
    if (!moods.length) return "Add mood entries to reveal behavior patterns across mood, stress, energy and life factors."
    const recent = moods.slice(-7)
    const avgMood = avg(recent.map(m => Number(m.mood_score ?? 0) * 10))
    const avgEnergy = avg(recent.map(m => Number(m.energy_score ?? 0) * 10))
    const avgStress = avg(recent.map(m => Number(m.stress_score ?? 0) * 10))
    const factorCounts = new Map<string, number>()
    recent.forEach(m => (m.factors ?? []).forEach(f => factorCounts.set(f, (factorCounts.get(f) ?? 0) + 1)))
    const topFactor = [...factorCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    if (avgStress >= 70) return `Recent pattern: stress is high at ${avgStress}/100${topFactor ? ` and often linked with ${topFactor}` : ""}. Reduce overload and protect recovery.`
    if (avgMood >= 75 && avgEnergy >= 75) return `Recent pattern: mood and energy are strong${topFactor ? `, with ${topFactor} appearing often` : ""}. Continue this rhythm and observe what sustains it.`
    if (avgEnergy < 50) return `Recent pattern: energy is low at ${avgEnergy}/100${topFactor ? ` and often linked with ${topFactor}` : ""}. Improve sleep, food tracking and movement.`
    return `Recent pattern: mood ${avgMood}/100, energy ${avgEnergy}/100, stress ${avgStress}/100${topFactor ? `. Most common factor: ${topFactor}.` : "."}`
  }, [moods])

  const managementReport = useMemo(() => {
    const rows = printableEntries.map(entry => ({ entry, scores: calculateScores(entry), mood: moods.find(m => m.entry_date === entry.entry_date) }))
    const wellbeing = avg(rows.map(r => r.scores.wellbeing_score))
    const energy = avg(rows.map(r => r.scores.predicted_next_day_energy))
    const actualEnergy = avg(rows.map(r => Number(r.mood?.energy_score ?? r.entry.energy_score ?? 0) * 10))
    const stress = avg(rows.map(r => Number(r.mood?.stress_score ?? 0) * 10).filter(Boolean))
    const weakest = rows.length
      ? Object.entries(rows[rows.length - 1].scores.dimensions).sort((a, b) => a[1] - b[1])[0]
      : undefined
    return { rows, wellbeing, energy, actualEnergy, stress, weakest }
  }, [printableEntries, moods])

  function printDashboard() {
    window.print()
  }

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
    <div className="container section dashboard-page">
      <div className="dashboard-actions no-print">
        <div className="segmented-control" aria-label="Report period">
          {(["day", "week", "month"] as ReportRange[]).map(option => (
            <button key={option} className={reportRange === option ? "active" : ""} onClick={() => setReportRange(option)}>
              {option === "day" ? "Day" : option === "week" ? "Week" : "Month"}
            </button>
          ))}
        </div>
        <button className="primary-btn" onClick={printDashboard}>Print report</button>
      </div>

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
        <div className="form-card ai-assessment-card">
          <div className="ai-assessment-head">
            <span className="kicker">AI assessment</span>
            <span className="ai-badge">Daily reflection</span>
          </div>
          <h3>{latestScores.ai_assessment}</h3>
          <div className="ai-pattern">{behaviorTrend}</div>
          <div className="ai-metrics">
            <span>Mood <strong>{latestMood?.mood_score ?? latest.mood_score ?? "-"}/10</strong></span>
            <span>Actual energy <strong>{latestMood?.energy_score ?? latest.energy_score ?? "-"}/10</strong></span>
            <span>Stress <strong>{latestMood?.stress_score ?? "-"}/10</strong></span>
          </div>
          <p>
            {summary.feedbackCount
              ? `Energy learning: across ${summary.feedbackCount} saved day(s), actual energy has been ${summary.forecastAdjustment >= 0 ? "higher" : "lower"} than predicted by ${Math.abs(summary.forecastAdjustment)} points on average. Future predictions are adjusted using this gap, with high stress reducing the next-day energy score.`
              : "Save mood actual energy after daily entry to compare predicted and actual energy."}
          </p>
        </div>
      </section>

      <section className="form-card" style={{ marginTop: 16 }}>
        <span className="kicker">Predicted vs actual energy</span>
        <MiniBars entries={entries} moods={moods} />
      </section>

      <section className="form-card report-sheet" style={{ marginTop: 16 }}>
        <span className="kicker">Management report</span>
        <h3>{reportRange === "day" ? "Daily" : reportRange === "week" ? "Weekly" : "Monthly"} wellbeing summary</h3>
        <div className="report-grid">
          <div><span>Captured days</span><strong>{managementReport.rows.length}</strong></div>
          <div><span>Avg wellbeing</span><strong>{managementReport.wellbeing}</strong></div>
          <div><span>Predicted energy</span><strong>{managementReport.energy}</strong></div>
          <div><span>Actual energy</span><strong>{managementReport.actualEnergy || "-"}</strong></div>
          <div><span>Stress load</span><strong>{managementReport.stress || "-"}</strong></div>
          <div><span>Focus area</span><strong>{managementReport.weakest?.[0] ?? "Capture more data"}</strong></div>
        </div>
        <p>{behaviorTrend}</p>
        <p>Recommended management action: protect sleep recovery, track mood factors, and focus the next improvement cycle on {managementReport.weakest?.[0] ?? "the weakest dimension"}.</p>
      </section>

      <section className="dashboard-disclaimer notice" style={{ marginTop: 16 }}>
        <strong>Disclaimer</strong>
        <p>This dashboard is a wellbeing reflection tool, not a medical diagnosis or treatment recommendation. The word "quantum" is used as a metaphor for multi-state thinking, disciplined attention and error correction in the mind.</p>
      </section>
    </div>
  )
}
