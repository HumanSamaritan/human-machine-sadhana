import type { DailyEntry } from "./constants"

const n = (value: number | null | undefined) => Number.isFinite(Number(value)) ? Number(value) : 0
const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value))
const pct = (actual: number, target: number) => clamp((actual / target) * 100)

function workBalance(minutes: number) {
  if (minutes <= 0) return 0
  if (minutes < 60) return 35
  if (minutes <= 180) return 70 + (minutes - 60) / 120 * 20
  if (minutes <= 360) return 95
  if (minutes <= 540) return 85 - (minutes - 360) / 180 * 25
  return 45
}

function calorieScore(calories: number) {
  if (!calories) return 45
  if (calories < 1100) return 45
  if (calories <= 2600) return 82
  if (calories <= 3200) return 62
  return 42
}

export function calculateScores(entry: Partial<DailyEntry>) {
  const physical = pct(n(entry.physical_vitality_min), 45)
  const inner = pct(n(entry.inner_practice_min), 40)
  const mindful = pct(n(entry.mindful_eating_score), 5)
  const revenue = workBalance(n(entry.revenue_money_work_min))
  const growth = pct(n(entry.growth_self_learning_min), 90)
  const aiPractice = pct(n(entry.ai_human_partnership_min), 30)
  const family = pct(n(entry.family_connection_min), 45)
  const seva = pct(n(entry.seva_planet_min), 20)
  const joy = pct(n(entry.joyful_relaxation_min), 30)
  const sleepPrep = pct(n(entry.sleep_preparation_min), 20)
  const sleepHoursScore = entry.sleep_hours ? clamp((n(entry.sleep_hours) / 7.5) * 100) : 0
  const sleepQualityScore = entry.sleep_quality ? pct(n(entry.sleep_quality), 5) : 0
  const sleepRecovery = clamp(sleepHoursScore * 0.65 + sleepQualityScore * 0.35)
  const water = entry.water_litres ? pct(n(entry.water_litres), 2.5) : 35
  const mealCapture = entry.meals_captured === "Complete" ? 100 : entry.meals_captured === "Partial" ? 55 : 20
  const food = clamp(mindful * 0.35 + mealCapture * 0.25 + water * 0.2 + calorieScore(n(entry.estimated_calories)) * 0.2)
  const growthAi = clamp(growth * 0.65 + aiPractice * 0.35)
  const purpose = clamp(seva * 0.7 + inner * 0.3)
  const recoveryJoy = clamp(joy * 0.55 + sleepPrep * 0.45)

  const dimensions = {
    "Physical Vitality": physical,
    "Inner Practice": inner,
    "Food & Energy": food,
    "Livelihood & Performance": clamp(revenue * 0.7 + growthAi * 0.3),
    "Growth + AI Partnership": growthAi,
    "Family Connection": family,
    "Purpose / Seva / Planet": purpose,
    "Joy + Recovery": recoveryJoy,
    "Sleep Recovery": sleepRecovery
  }

  const overall = clamp(
    physical * 0.12 + inner * 0.12 + food * 0.12 + dimensions["Livelihood & Performance"] * 0.16 +
    family * 0.12 + purpose * 0.12 + recoveryJoy * 0.09 + sleepRecovery * 0.15
  )

  const performance = clamp(
    dimensions["Livelihood & Performance"] * 0.35 + growthAi * 0.25 + sleepRecovery * 0.15 + physical * 0.1 + inner * 0.1 + food * 0.05
  )

  const moodFromInput = entry.mood_score ? pct(n(entry.mood_score), 10) : 50
  const happiness = clamp(moodFromInput * 0.35 + inner * 0.15 + family * 0.15 + joy * 0.12 + purpose * 0.12 + food * 0.11)

  const workPenalty = n(entry.revenue_money_work_min) > 540 ? -10 : n(entry.revenue_money_work_min) > 420 ? -5 : 0
  const nextDayEnergy = clamp(sleepRecovery * 0.35 + food * 0.2 + physical * 0.15 + recoveryJoy * 0.1 + inner * 0.1 + dimensions["Livelihood & Performance"] * 0.1 + workPenalty)

  const reflectionBonus = entry.one_short_reflection && entry.one_short_reflection.length > 12 ? 8 : 0
  const quantumMindScore = clamp(inner * 0.24 + growthAi * 0.26 + sleepRecovery * 0.18 + purpose * 0.14 + performance * 0.1 + reflectionBonus)

  const weakest = Object.entries(dimensions).sort((a, b) => a[1] - b[1])[0]
  const ai_assessment = weakest
    ? `Focus next on ${weakest[0]}. Small correction here will likely improve tomorrow's energy and mood.`
    : "Capture today’s data to generate an assessment."

  return {
    dimensions,
    wellbeing_score: Math.round(overall),
    performance_score: Math.round(performance),
    happiness_quotient: Math.round(happiness),
    predicted_next_day_energy: Math.round(nextDayEnergy),
    quantum_mind_score: Math.round(quantumMindScore),
    ai_assessment
  }
}

export function zone(score: number | null | undefined) {
  const s = n(score)
  if (s >= 80) return "Thriving"
  if (s >= 65) return "Stable"
  if (s >= 45) return "Needs attention"
  return "Recovery needed"
}

export function intelligentNudges(entry: Partial<DailyEntry>) {
  const scores = calculateScores(entry)
  const nudges: string[] = []
  if (!entry.sleep_hours || n(entry.sleep_quality) <= 2) nudges.push("Sleep data is weak or missing. Keep revenue work focused, and protect sleep preparation tonight.")
  if (n(entry.physical_vitality_min) < 15) nudges.push("Add at least a 10–20 minute walk or mobility block; movement is one of the fastest energy corrections.")
  if (entry.meals_captured !== "Complete") nudges.push("Capture breakfast, lunch and dinner. Food quality materially changes energy forecasting.")
  if (n(entry.mood_score) <= 4) nudges.push("Mood is low. Add a short gratitude entry and one family or seva connection before the day closes.")
  if (n(entry.revenue_money_work_min) < 60) nudges.push("Money-energy work is low. Add one high-value output block: proposal, client call, learning-to-income action, or delivery milestone.")
  if (scores.quantum_mind_score < 50) nudges.push("Quantum Mind Readiness is low. Increase right-direction mind usage: 15 minutes inner practice + 20 minutes deliberate learning or AI co-creation.")
  return nudges.slice(0, 4)
}
