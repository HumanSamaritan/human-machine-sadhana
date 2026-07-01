"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { calculateScores, zone } from "@/lib/scoring"
import { MetricCard } from "./MetricCard"
import type { DailyEntry } from "@/lib/constants"
import {
  calculateScientificDashboardMetrics,
  clampScore,
  firstNumber,
  formatScore,
  formatTenScore,
  ReportRange,
  MoodEntry,
  GratitudeEntry,
  PredictionFeedback,
  toNumberOrNull
} from "@/lib/scoring"

function MiniBars({ entries, moods }: { entries: DailyEntry[]; moods: MoodEntry[] }) {
  const moodByDate = new Map(moods.map(m => [m.entry_date, m]))

  const data = entries.slice(-14).map(e => {
    const mood = moodByDate.get(e.entry_date)

    const predicted =
      toNumberOrNull(e.predicted_next_day_energy) ??
      calculateScores(e).predicted_next_day_energy ??
      0

    const actualRaw = firstNumber(mood?.energy_score, e.energy_score)
    const actual = actualRaw === null ? null : actualRaw * 10

    return {
      date: e.entry_date.slice(5),
      predicted,
      actual
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
  const height = 260
  const plotLeft = 56
  const plotRight = width - 28
  const plotBottom = height - 34
  const plotTop = 44
  const plotHeight = plotBottom - plotTop
  const groupWidth = data.length > 1 ? (plotRight - plotLeft) / (data.length - 1) : 0
  const barWidth = data.length <= 3 ? 24 : 16

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="chart"
      role="img"
      aria-label="Predicted and actual energy bar chart"
    >
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

        const predictedHeight = (clampScore(Number(d.predicted ?? 0)) / 100) * plotHeight
        const actualHeight = d.actual === null ? 0 : (clampScore(d.actual) / 100) * plotHeight

        return (
          <g key={`${d.date}-${i}`}>
            <rect
              x={predictedX}
              y={plotBottom - predictedHeight}
              width={barWidth}
              height={predictedHeight}
              rx="5"
              fill="#F3C768"
            />

            <rect
              x={actualX}
              y={plotBottom - actualHeight}
              width={barWidth}
              height={actualHeight}
              rx="5"
              fill="#69E7FF"
              opacity={d.actual === null ? 0.18 : 1}
            />

            <text x={center - 14} y={plotBottom + 22} fill="#aebcd0" fontSize="12">
              {d.date}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function DashboardCharts() {
  const router = useRouter()

  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [moods, setMoods] = useState<MoodEntry[]>([])
  const [gratitude, setGratitude] = useState<GratitudeEntry[]>([])
  const [feedback, setFeedback] = useState<PredictionFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [reportRange, setReportRange] = useState<ReportRange>("day")

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      const supabase = createBrowserSupabaseClient()

      try {
        setLoading(true)
        setErrorMessage("")

        const { data: authData, error: authError } = await supabase.auth.getUser()

        if (authError) {
          throw new Error(`Authentication error: ${authError.message}`)
        }

        if (!authData.user) {
          router.replace("/")
          return
        }

        const userId = authData.user.id

        const [daily, mood, grat, prediction] = await Promise.all([
          supabase
            .from("daily_entries")
            .select("*")
            .eq("user_id", userId)
            .order("entry_date", { ascending: true })
            .limit(120),

          supabase
            .from("mood_entries")
            .select("entry_date,mood_score,energy_score,stress_score,factors,note")
            .eq("user_id", userId)
            .order("entry_date", { ascending: true })
            .limit(120),

          supabase
            .from("gratitude_entries")
            .select("entry_date,item_count")
            .eq("user_id", userId)
            .order("entry_date", { ascending: true })
            .limit(120),

          supabase
            .from("prediction_feedback")
            .select("entry_date,predicted_energy,actual_energy,prediction_delta")
            .eq("user_id", userId)
            .order("entry_date", { ascending: true })
            .limit(120)
        ])

        const errors = [
          daily.error ? `Daily entries: ${daily.error.message}` : null,
          mood.error ? `Mood entries: ${mood.error.message}` : null,
          grat.error ? `Gratitude entries: ${grat.error.message}` : null,
          prediction.error ? `Prediction feedback: ${prediction.error.message}` : null
        ].filter(Boolean)

        if (errors.length) {
          throw new Error(errors.join(" | "))
        }

        if (!isMounted) return

        setEntries((daily.data ?? []) as DailyEntry[])
        setMoods((mood.data ?? []) as MoodEntry[])
        setGratitude((grat.data ?? []) as GratitudeEntry[])
        setFeedback((prediction.data ?? []) as PredictionFeedback[])
      } catch (error) {
        if (!isMounted) return

        const message = error instanceof Error ? error.message : "Unable to load dashboard data."
        setErrorMessage(message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [router])

  const metrics = useMemo(
    () =>
      calculateScientificDashboardMetrics({
        entries,
        moods,
        gratitude,
        feedback,
        reportRange
      }),
    [entries, moods, gratitude, feedback, reportRange]
  )

  const latest = metrics.latest
  const latestScores = metrics.latestScores
  const latestMood = metrics.latestMood

  function printDashboard() {
    window.print()
  }

  if (loading) {
    return (
      <div className="container section">
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="container section">
        <div className="notice">
          <strong>Dashboard could not be loaded</strong>
          <p>{errorMessage}</p>
          <p className="small">
            Please check Supabase table names, Row Level Security policies, and environment variables.
          </p>
        </div>
      </div>
    )
  }

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
            <button
              key={option}
              className={reportRange === option ? "active" : ""}
              onClick={() => setReportRange(option)}
            >
              {option === "day" ? "Day" : option === "week" ? "Week" : "Month"}
            </button>
          ))}
        </div>

        <button className="primary-btn" onClick={printDashboard}>
          Print report
        </button>
      </div>

      <span className="kicker">Outcome Dashboard</span>

      <h2>Wellbeing, happiness quotient and energy forecast</h2>

      <p>
        Daily, weekly and monthly views now use trend-aware stress, habit protection,
        predicted happiness quotient, and actual mood-energy feedback.
      </p>

      <section className="grid grid-4">
        <MetricCard
          label="Today Wellbeing"
          value={metrics.revisedWellbeingScore ?? 0}
          sub={zone(metrics.revisedWellbeingScore ?? latestScores.wellbeing_score)}
        />

        <MetricCard
          label="Happiness Quotient"
          value={metrics.happinessQuotient ?? 0}
          sub="Predicted from mood, calmness, gratitude, energy, purpose and relationships"
        />

        <MetricCard
          label="Next-Day Energy"
          value={metrics.personalizedNextEnergy}
          sub={metrics.nextDayEnergySubtitle}
        />

        <MetricCard
          label="Quantum Mind Readiness"
          value={latestScores.quantum_mind_score}
          sub="Disciplined mind + AI partnership"
        />
      </section>

      <section className="grid grid-4" style={{ marginTop: 16 }}>
        <MetricCard
          label="Daily Stress"
          value={metrics.stressMetrics.dailyStress ?? 0}
          sub={metrics.stressMetrics.dailyStress === null ? "Not captured" : "Today’s stress load"}
        />

        <MetricCard
          label="Weekly Stress"
          value={metrics.stressMetrics.weeklyStressBurden ?? 0}
          sub={`${metrics.stressMetrics.attentionLevel} pattern`}
        />

        <MetricCard
          label="Monthly Stress"
          value={metrics.stressMetrics.monthlyStressBurden ?? 0}
          sub="Sustained stress burden"
        />

        <MetricCard
          label="Habit Protection"
          value={metrics.habitScores.habitProtectionScore}
          sub={
            metrics.habitScores.topHabitDrivers.length
              ? metrics.habitScores.topHabitDrivers.join(", ")
              : "Meditation, gratitude, sleep, movement and reflection"
          }
        />
      </section>

      <section className="grid grid-3" style={{ marginTop: 16 }}>
        <MetricCard
          label="Weekly Wellbeing"
          value={metrics.weeklyWellbeing ?? 0}
          sub={`${metrics.weeklyEntries.length} day(s) captured`}
        />

        <MetricCard
          label="Monthly Wellbeing"
          value={metrics.monthlyWellbeing ?? 0}
          sub={`${metrics.monthlyEntries.length} day(s) captured`}
        />

        <MetricCard
          label="Gratitude Items"
          value={metrics.gratitudeCount30}
          sub="Last 30 days, private content hidden"
        />
      </section>

      <section className="grid grid-2" style={{ marginTop: 16 }}>
        <div className="form-card">
          <span className="kicker">Dimension chart</span>

          {Object.entries(latestScores.dimensions).map(([label, score]) => (
            <div className="bar-row" key={label}>
              <span className="small">{label}</span>

              <div className="progress">
                <div style={{ width: `${clampScore(score)}%` }} />
              </div>

              <strong>{Math.round(score)}</strong>
            </div>
          ))}
        </div>

        <div className="form-card ai-assessment-card">
          <div className="ai-assessment-head">
            <span className="kicker">Scientific AI assessment</span>
            <span className="ai-badge">Daily reflection</span>
          </div>

          <h3>{latestScores.ai_assessment}</h3>

          <div className="ai-pattern">
            {metrics.aiSummary}
          </div>

          <div className="ai-metrics">
            <span>
              Mood{" "}
              <strong>{formatTenScore(firstNumber(latestMood?.mood_score, latest.mood_score))}</strong>
            </span>

            <span>
              Actual energy{" "}
              <strong>{formatTenScore(firstNumber(latestMood?.energy_score, latest.energy_score))}</strong>
            </span>

            <span>
              Stress{" "}
              <strong>{formatTenScore(latestMood?.stress_score)}</strong>
            </span>
          </div>

          <p>
            Stress direction: <strong>{metrics.stressMetrics.stressTrendLabel}</strong>.{" "}
            Weekly stress burden: <strong>{formatScore(metrics.stressMetrics.weeklyStressBurden)}</strong>.{" "}
            Monthly stress burden: <strong>{formatScore(metrics.stressMetrics.monthlyStressBurden)}</strong>.
          </p>

          <p>
            Habit protection: <strong>{formatScore(metrics.habitScores.habitProtectionScore)}</strong>.{" "}
            Happiness quotient: <strong>{formatScore(metrics.happinessQuotient)}</strong>.
          </p>
        </div>
      </section>

      <section className="form-card" style={{ marginTop: 16 }}>
        <span className="kicker">Predicted vs actual energy</span>
        <MiniBars entries={entries} moods={moods} />
      </section>

      <section className="form-card report-sheet" style={{ marginTop: 16 }}>
        <span className="kicker">Management report</span>

        <h3>
          {reportRange === "day" ? "Daily" : reportRange === "week" ? "Weekly" : "Monthly"} wellbeing summary
        </h3>

        <div className="report-grid">
          <div>
            <span>Captured days</span>
            <strong>{metrics.managementReport.rows.length}</strong>
          </div>

          <div>
            <span>Avg wellbeing</span>
            <strong>{metrics.managementReport.wellbeing ?? "-"}</strong>
          </div>

          <div>
            <span>Predicted energy</span>
            <strong>{metrics.managementReport.energy ?? "-"}</strong>
          </div>

          <div>
            <span>Actual energy</span>
            <strong>{metrics.managementReport.actualEnergy ?? "-"}</strong>
          </div>

          <div>
            <span>Stress load</span>
            <strong>{metrics.managementReport.stress ?? "-"}</strong>
          </div>

          <div>
            <span>Focus area</span>
            <strong>{metrics.managementReport.weakest?.[0] ?? "Capture more data"}</strong>
          </div>
        </div>

        <p>{metrics.behaviorTrend}</p>

        <p>
          Recommended management action: {metrics.managementReport.recommendedAction}
        </p>
      </section>

      <section className="dashboard-disclaimer notice" style={{ marginTop: 16 }}>
        <strong>Disclaimer</strong>

        <p>
          This dashboard is a wellbeing reflection tool, not a medical diagnosis or treatment recommendation.
          The happiness quotient and stress indicators are reflective estimates based on captured habits,
          mood, energy and stress patterns. The word "quantum" is used as a metaphor for multi-state thinking,
          disciplined attention and error correction in the mind.
        </p>
      </section>
    </div>
  )
}
