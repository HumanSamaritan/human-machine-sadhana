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
export type ReportRange = "day" | "week" | "month"

export type MoodEntry = {
  entry_date: string
  mood_score: number | null
  energy_score: number | null
  stress_score: number | null
  factors?: string[] | null
  note?: string | null
}

export type GratitudeEntry = {
  entry_date: string
  item_count: number | null
}

export type PredictionFeedback = {
  entry_date: string
  predicted_energy: number | null
  actual_energy: number | null
  prediction_delta: number | null
}

export type StressMetrics = {
  dailyStress: number | null
  weeklyStressBurden: number | null
  monthlyStressBurden: number | null
  stressTrendDelta: number | null
  stressTrendLabel: "reducing" | "stable" | "increasing" | "not enough data"
  stressRecoveryScore: number
  chronicStressPenalty: number
  attentionLevel: "normal" | "watch" | "attention" | "sustained attention"
}

export type HabitScores = {
  meditation: number
  gratitude: number
  sleep: number
  movement: number
  food: number
  family: number
  purpose: number
  joyRecovery: number
  habitProtectionScore: number
  topHabitDrivers: string[]
}

export type ManagementReport = {
  rows: Array<{
    entry: DailyEntry
    scores: ReturnType<typeof calculateScores>
    mood?: MoodEntry
  }>
  wellbeing: number | null
  energy: number | null
  actualEnergy: number | null
  stress: number | null
  weakest?: [string, number]
  recommendedAction: string
}

export type ScientificDashboardMetrics = {
  latest?: DailyEntry
  latestScores: ReturnType<typeof calculateScores> | null
  latestMood?: MoodEntry
  weeklyEntries: DailyEntry[]
  monthlyEntries: DailyEntry[]
  printableEntries: DailyEntry[]
  revisedWellbeingScore: number | null
  weeklyWellbeing: number | null
  monthlyWellbeing: number | null
  weeklyEnergy: number | null
  monthlyEnergy: number | null
  happinessQuotient: number | null
  habitScores: HabitScores
  stressMetrics: StressMetrics
  gratitudeCount30: number
  feedbackCount: number
  forecastAdjustment: number
  stressPenalty: number
  personalizedNextEnergy: number
  nextDayEnergySubtitle: string
  behaviorTrend: string
  aiSummary: string
  managementReport: ManagementReport
}

export function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const parsed = toNumberOrNull(value)
    if (parsed !== null) return parsed
  }

  return null
}

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function scaleTo100(value: unknown): number | null {
  const parsed = toNumberOrNull(value)

  if (parsed === null) return null
  if (parsed <= 1) return clampScore(parsed * 100)
  if (parsed <= 10) return clampScore(parsed * 10)

  return clampScore(parsed)
}

export function avgNullable(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => {
    return typeof value === "number" && Number.isFinite(value)
  })

  if (!valid.length) return null

  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
}

/**
 * Local browser date instead of UTC ISO date.
 * This prevents date mismatch around midnight, especially in Singapore timezone.
 */
export function localDateKey(daysAgo = 0) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function groupWindow(entries: DailyEntry[], days: number) {
  const start = localDateKey(days)
  return entries.filter(entry => entry.entry_date >= start)
}

export function rangeEntries(entries: DailyEntry[], range: ReportRange) {
  if (range === "day") return entries.slice(-1)
  return groupWindow(entries, range === "week" ? 7 : 30)
}

function entryRecord(entry: Partial<DailyEntry> | undefined) {
  return (entry ?? {}) as Record<string, unknown>
}

function readEntryNumber(entry: Partial<DailyEntry> | undefined, key: string) {
  return toNumberOrNull(entryRecord(entry)[key])
}

function gratitudeScoreFromCount(itemCount: number | null | undefined) {
  if (itemCount === null || itemCount === undefined) return 50
  return clampScore((Number(itemCount) / 3) * 100)
}

function sleepScoreFromEntry(entry: Partial<DailyEntry> | undefined) {
  const sleepHours = readEntryNumber(entry, "sleep_hours")
  const sleepQuality = readEntryNumber(entry, "sleep_quality")

  const sleepHoursScore = sleepHours ? clampScore((sleepHours / 7.5) * 100) : 0
  const sleepQualityScore = sleepQuality ? clampScore((sleepQuality / 5) * 100) : 0

  return clampScore(sleepHoursScore * 0.65 + sleepQualityScore * 0.35)
}

function foodScoreFromEntry(entry: Partial<DailyEntry> | undefined) {
  const mindfulEating = readEntryNumber(entry, "mindful_eating_score")
  const waterLitres = readEntryNumber(entry, "water_litres")
  const estimatedCalories = readEntryNumber(entry, "estimated_calories")
  const mealsCaptured = entryRecord(entry).meals_captured

  const mindful = mindfulEating ? clampScore((mindfulEating / 5) * 100) : 0
  const water = waterLitres ? clampScore((waterLitres / 2.5) * 100) : 35

  const mealCapture =
    mealsCaptured === "Complete"
      ? 100
      : mealsCaptured === "Partial"
        ? 55
        : 20

  const calorie =
    !estimatedCalories
      ? 45
      : estimatedCalories < 1100
        ? 45
        : estimatedCalories <= 2600
          ? 82
          : estimatedCalories <= 3200
            ? 62
            : 42

  return clampScore(mindful * 0.35 + mealCapture * 0.25 + water * 0.2 + calorie * 0.2)
}

function scoreMinutes(entry: Partial<DailyEntry> | undefined, key: string, targetMinutes: number) {
  const minutes = readEntryNumber(entry, key)
  if (minutes === null) return 0
  return clampScore((minutes / targetMinutes) * 100)
}

export function calculateHabitProtection(
  entry: Partial<DailyEntry> | undefined,
  gratitudeItemsForDate?: number | null
): HabitScores {
  const meditation = scoreMinutes(entry, "inner_practice_min", 40)
  const gratitude = gratitudeScoreFromCount(gratitudeItemsForDate)
  const sleep = sleepScoreFromEntry(entry)
  const movement = scoreMinutes(entry, "physical_vitality_min", 45)
  const food = foodScoreFromEntry(entry)
  const family = scoreMinutes(entry, "family_connection_min", 45)

  const seva = scoreMinutes(entry, "seva_planet_min", 20)
  const inner = scoreMinutes(entry, "inner_practice_min", 40)
  const purpose = clampScore(seva * 0.7 + inner * 0.3)

  const joy = scoreMinutes(entry, "joyful_relaxation_min", 30)
  const sleepPrep = scoreMinutes(entry, "sleep_preparation_min", 20)
  const joyRecovery = clampScore(joy * 0.55 + sleepPrep * 0.45)

  const habitProtectionScore = clampScore(
    meditation * 0.22 +
    gratitude * 0.16 +
    sleep * 0.18 +
    movement * 0.14 +
    food * 0.12 +
    family * 0.08 +
    purpose * 0.06 +
    joyRecovery * 0.04
  )

  const habitDrivers = [
    ["Meditation", meditation],
    ["Gratitude", gratitude],
    ["Sleep", sleep],
    ["Movement", movement],
    ["Food", food],
    ["Family connection", family],
    ["Purpose / seva", purpose],
    ["Joy + recovery", joyRecovery]
  ] as Array<[string, number]>

  const topHabitDrivers = habitDrivers
    .filter(([, score]) => score >= 65)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label]) => label)

  return {
    meditation,
    gratitude,
    sleep,
    movement,
    food,
    family,
    purpose,
    joyRecovery,
    habitProtectionScore,
    topHabitDrivers
  }
}

function stressForDate(entry: DailyEntry | undefined, mood?: MoodEntry) {
  const stressFromMood = scaleTo100(mood?.stress_score)
  if (stressFromMood !== null) return stressFromMood

  const stressFromEntry = scaleTo100(
    firstNumber(
      readEntryNumber(entry, "stress_score"),
      readEntryNumber(entry, "stress_load"),
      readEntryNumber(entry, "load_score")
    )
  )

  return stressFromEntry
}

export function calculateStressMetrics(entries: DailyEntry[], moods: MoodEntry[]): StressMetrics {
  const moodByDate = new Map(moods.map(mood => [mood.entry_date, mood]))

  const stressSeries = entries
    .map(entry => {
      const stress = stressForDate(entry, moodByDate.get(entry.entry_date))

      if (stress === null) return null

      return {
        date: entry.entry_date,
        stress
      }
    })
    .filter((item): item is { date: string; stress: number } => item !== null)

  const dailyStress = stressSeries.length ? stressSeries[stressSeries.length - 1].stress : null

  const weeklyStressBurden = avgNullable(
    stressSeries.filter(item => item.date >= localDateKey(7)).map(item => item.stress)
  )

  const monthlyStressBurden = avgNullable(
    stressSeries.filter(item => item.date >= localDateKey(30)).map(item => item.stress)
  )

  const recent3 = avgNullable(stressSeries.slice(-3).map(item => item.stress))
  const previous3 = avgNullable(stressSeries.slice(-6, -3).map(item => item.stress))

  const stressTrendDelta =
    recent3 !== null && previous3 !== null ? Math.round(recent3 - previous3) : null

  const stressTrendLabel =
    stressTrendDelta === null
      ? "not enough data"
      : stressTrendDelta <= -8
        ? "reducing"
        : stressTrendDelta >= 8
          ? "increasing"
          : "stable"

  const stressRecoveryScore =
    stressTrendDelta === null ? 50 : clampScore(50 - stressTrendDelta)

  const chronicStressPenalty =
    monthlyStressBurden !== null && monthlyStressBurden >= 70
      ? 15
      : weeklyStressBurden !== null && weeklyStressBurden >= 70
        ? 12
        : weeklyStressBurden !== null && weeklyStressBurden >= 60
          ? 8
          : weeklyStressBurden !== null && weeklyStressBurden >= 50
            ? 4
            : 0

  const attentionLevel =
    monthlyStressBurden !== null && monthlyStressBurden >= 70
      ? "sustained attention"
      : weeklyStressBurden !== null && weeklyStressBurden >= 70
        ? "attention"
        : weeklyStressBurden !== null && weeklyStressBurden >= 55
          ? "watch"
          : "normal"

  return {
    dailyStress,
    weeklyStressBurden,
    monthlyStressBurden,
    stressTrendDelta,
    stressTrendLabel,
    stressRecoveryScore,
    chronicStressPenalty,
    attentionLevel
  }
}

function calculateRevisedWellbeingForEntry(input: {
  entry: DailyEntry
  mood?: MoodEntry
  stressMetrics: StressMetrics
  gratitudeItemsForDate?: number | null
}) {
  const { entry, mood, stressMetrics, gratitudeItemsForDate } = input

  const scores = calculateScores(entry)
  const habits = calculateHabitProtection(entry, gratitudeItemsForDate)

  const moodScore =
    scaleTo100(firstNumber(mood?.mood_score, entry.mood_score)) ??
    scores.happiness_quotient ??
    50

  const energyScore =
    scaleTo100(firstNumber(mood?.energy_score, readEntryNumber(entry, "energy_score"))) ??
    scores.predicted_next_day_energy ??
    50

  const stressBurden = stressMetrics.weeklyStressBurden ?? stressMetrics.dailyStress ?? 50
  const calmnessScore = clampScore(100 - stressBurden)

  const revisedWellbeing = clampScore(
    moodScore * 0.16 +
    energyScore * 0.12 +
    habits.sleep * 0.14 +
    habits.food * 0.1 +
    habits.meditation * 0.1 +
    habits.gratitude * 0.08 +
    habits.family * 0.1 +
    habits.purpose * 0.08 +
    habits.joyRecovery * 0.07 +
    calmnessScore * 0.1 +
    stressMetrics.stressRecoveryScore * 0.05 -
    stressMetrics.chronicStressPenalty
  )

  return revisedWellbeing
}

export function calculateHappinessQuotient(input: {
  entry: DailyEntry
  mood?: MoodEntry
  stressMetrics: StressMetrics
  gratitudeItemsForDate?: number | null
}) {
  const { entry, mood, stressMetrics, gratitudeItemsForDate } = input

  const scores = calculateScores(entry)
  const habits = calculateHabitProtection(entry, gratitudeItemsForDate)

  const positiveEmotion =
    scaleTo100(firstNumber(mood?.mood_score, entry.mood_score)) ??
    scores.happiness_quotient ??
    50

  const energy =
    scaleTo100(firstNumber(mood?.energy_score, readEntryNumber(entry, "energy_score"))) ??
    scores.predicted_next_day_energy ??
    50

  const stressBurden = stressMetrics.weeklyStressBurden ?? stressMetrics.dailyStress ?? 50
  const calmness = clampScore(100 - stressBurden)

  const happiness = clampScore(
    positiveEmotion * 0.18 +
    habits.gratitude * 0.14 +
    calmness * 0.14 +
    energy * 0.1 +
    habits.family * 0.13 +
    habits.purpose * 0.13 +
    habits.joyRecovery * 0.08 +
    habits.sleep * 0.05 +
    habits.food * 0.05 -
    stressMetrics.chronicStressPenalty
  )

  return happiness
}

function calculateForecastAdjustment(feedback: PredictionFeedback[]) {
  const recentFeedback = feedback.filter(item => {
    return item.entry_date >= localDateKey(30) && toNumberOrNull(item.prediction_delta) !== null
  })

  return {
    feedbackCount: recentFeedback.length,
    forecastAdjustment: avgNullable(recentFeedback.map(item => toNumberOrNull(item.prediction_delta))) ?? 0
  }
}

function calculateStressPenalty(stressMetrics: StressMetrics) {
  const dailyStress = stressMetrics.dailyStress ?? 0
  const weeklyStress = stressMetrics.weeklyStressBurden ?? 0
  const monthlyStress = stressMetrics.monthlyStressBurden ?? 0

  /**
   * Single-day stress has smaller penalty.
   * Repeated weekly/monthly stress has stronger penalty.
   */
  const dailyPenalty = dailyStress > 75 ? (dailyStress - 75) * 0.12 : 0
  const weeklyPenalty = weeklyStress > 60 ? (weeklyStress - 60) * 0.3 : 0
  const monthlyPenalty = monthlyStress > 65 ? (monthlyStress - 65) * 0.18 : 0

  return clampScore(dailyPenalty + weeklyPenalty + monthlyPenalty)
}

function calculateHabitTrend(entries: DailyEntry[], gratitude: GratitudeEntry[]) {
  const gratitudeByDate = new Map(
    gratitude.map(item => [item.entry_date, Number(item.item_count ?? 0)])
  )

  const recentHabits = entries.slice(-7).map(entry => {
    return calculateHabitProtection(entry, gratitudeByDate.get(entry.entry_date)).habitProtectionScore
  })

  const previousHabits = entries.slice(-14, -7).map(entry => {
    return calculateHabitProtection(entry, gratitudeByDate.get(entry.entry_date)).habitProtectionScore
  })

  const recentAvg = avgNullable(recentHabits)
  const previousAvg = avgNullable(previousHabits)

  if (recentAvg === null || previousAvg === null) return null

  return Math.round(recentAvg - previousAvg)
}

export function generateScientificAISummary(input: {
  stressMetrics: StressMetrics
  habitScores: HabitScores
  habitTrendDelta: number | null
  happinessQuotient: number | null
}) {
  const { stressMetrics, habitScores, habitTrendDelta, happinessQuotient } = input

  const summary: string[] = []

  if (stressMetrics.stressTrendLabel === "reducing") {
    summary.push("Stress is reducing compared with the previous period, which is a positive recovery signal.")
  } else if (stressMetrics.stressTrendLabel === "increasing") {
    summary.push("Stress is increasing compared with the previous period, so the next few days need recovery attention.")
  } else if (stressMetrics.stressTrendLabel === "stable") {
    summary.push("Stress is broadly stable; the focus should be on preventing accumulation and strengthening recovery habits.")
  } else {
    summary.push("More stress data is needed before a reliable trend can be shown.")
  }

  if (stressMetrics.attentionLevel === "sustained attention") {
    summary.push("The monthly pattern suggests sustained stress load, not just a single difficult day.")
  } else if (stressMetrics.attentionLevel === "attention") {
    summary.push("Weekly stress is elevated, which may suggest repeated overload across the week.")
  } else if (stressMetrics.attentionLevel === "watch") {
    summary.push("Weekly stress is moderate and should be watched before it becomes a repeated pattern.")
  }

  if (habitTrendDelta !== null && habitTrendDelta >= 8 && stressMetrics.stressTrendLabel === "reducing") {
    summary.push("Healthy habits appear to be improving while stress is reducing; meditation, gratitude, food, sleep or recovery practices may be supporting the change.")
  } else if (habitTrendDelta !== null && habitTrendDelta <= -8 && stressMetrics.stressTrendLabel === "increasing") {
    summary.push("Healthy habits appear to be reducing while stress is increasing; this is an early warning pattern.")
  } else if (habitScores.habitProtectionScore >= 70) {
    summary.push(
      `Habit protection is strong${
        habitScores.topHabitDrivers.length ? `, led by ${habitScores.topHabitDrivers.join(", ")}` : ""
      }.`
    )
  } else if (habitScores.habitProtectionScore < 45) {
    summary.push("Habit protection is low. Meditation, gratitude, sleep, food quality, movement, reflection and recovery should be strengthened.")
  }

  if (happinessQuotient !== null) {
    if (happinessQuotient >= 75) {
      summary.push("The predicted happiness quotient is strong, supported by mood, calmness, gratitude, energy, purpose, relationships and recovery habits.")
    } else if (happinessQuotient < 50) {
      summary.push("The predicted happiness quotient is under pressure and may improve by reducing sustained stress and strengthening daily recovery habits.")
    }
  }

  return summary.join(" ")
}

function calculateManagementReport(input: {
  printableEntries: DailyEntry[]
  moods: MoodEntry[]
  gratitude: GratitudeEntry[]
  stressMetrics: StressMetrics
}): ManagementReport {
  const { printableEntries, moods, gratitude, stressMetrics } = input

  const moodByDate = new Map(moods.map(mood => [mood.entry_date, mood]))
  const gratitudeByDate = new Map(
    gratitude.map(item => [item.entry_date, Number(item.item_count ?? 0)])
  )

  const rows = printableEntries.map(entry => ({
    entry,
    scores: calculateScores(entry),
    mood: moodByDate.get(entry.entry_date)
  }))

  const wellbeing = avgNullable(
    rows.map(row =>
      calculateRevisedWellbeingForEntry({
        entry: row.entry,
        mood: row.mood,
        stressMetrics,
        gratitudeItemsForDate: gratitudeByDate.get(row.entry.entry_date)
      })
    )
  )

  const energy = avgNullable(rows.map(row => row.scores.predicted_next_day_energy))

  const actualEnergy = avgNullable(
    rows.map(row => {
      const rawActual = firstNumber(
        row.mood?.energy_score,
        readEntryNumber(row.entry, "energy_score")
      )

      return rawActual === null ? null : rawActual * 10
    })
  )

  const stress = avgNullable(
    rows.map(row => stressForDate(row.entry, row.mood))
  )

  const weakest = rows.length
    ? Object.entries(rows[rows.length - 1].scores.dimensions).sort((a, b) => a[1] - b[1])[0]
    : undefined

  const recommendedAction =
    stressMetrics.attentionLevel === "sustained attention"
      ? "Prioritize recovery, reduce repeated overload, protect sleep, and strengthen meditation and gratitude routines."
      : stressMetrics.stressTrendLabel === "increasing"
        ? "Focus the next improvement cycle on reducing stress triggers and increasing daily recovery habits."
        : `Continue habit tracking and improve ${weakest?.[0] ?? "the weakest wellbeing dimension"}.`

  return {
    rows,
    wellbeing,
    energy,
    actualEnergy,
    stress,
    weakest,
    recommendedAction
  }
}

export function calculateScientificDashboardMetrics(input: {
  entries: DailyEntry[]
  moods: MoodEntry[]
  gratitude: GratitudeEntry[]
  feedback: PredictionFeedback[]
  reportRange: ReportRange
}): ScientificDashboardMetrics {
  const { entries, moods, gratitude, feedback, reportRange } = input

  const latest = entries[entries.length - 1]
  const latestScores = latest ? calculateScores(latest) : null

  const weeklyEntries = groupWindow(entries, 7)
  const monthlyEntries = groupWindow(entries, 30)
  const printableEntries = rangeEntries(entries, reportRange)

  const moodByDate = new Map(moods.map(mood => [mood.entry_date, mood]))
  const gratitudeByDate = new Map(
    gratitude.map(item => [item.entry_date, Number(item.item_count ?? 0)])
  )

  const latestMood = latest ? moodByDate.get(latest.entry_date) : undefined
  const latestGratitudeItems = latest ? gratitudeByDate.get(latest.entry_date) : null

  const stressMetrics = calculateStressMetrics(entries, moods)
  const habitScores = calculateHabitProtection(latest, latestGratitudeItems)

  const revisedWellbeingScore =
    latest && latestScores
      ? calculateRevisedWellbeingForEntry({
          entry: latest,
          mood: latestMood,
          stressMetrics,
          gratitudeItemsForDate: latestGratitudeItems
        })
      : null

  const weeklyWellbeing = avgNullable(
    weeklyEntries.map(entry =>
      calculateRevisedWellbeingForEntry({
        entry,
        mood: moodByDate.get(entry.entry_date),
        stressMetrics,
        gratitudeItemsForDate: gratitudeByDate.get(entry.entry_date)
      })
    )
  )

  const monthlyWellbeing = avgNullable(
    monthlyEntries.map(entry =>
      calculateRevisedWellbeingForEntry({
        entry,
        mood: moodByDate.get(entry.entry_date),
        stressMetrics,
        gratitudeItemsForDate: gratitudeByDate.get(entry.entry_date)
      })
    )
  )

  const weeklyEnergy = avgNullable(
    weeklyEntries.map(entry => calculateScores(entry).predicted_next_day_energy)
  )

  const monthlyEnergy = avgNullable(
    monthlyEntries.map(entry => calculateScores(entry).predicted_next_day_energy)
  )

  const gratitudeCount30 = gratitude
    .filter(item => item.entry_date >= localDateKey(30))
    .reduce((total, item) => total + Number(item.item_count ?? 0), 0)

  const happinessQuotient =
    latest && latestScores
      ? calculateHappinessQuotient({
          entry: latest,
          mood: latestMood,
          stressMetrics,
          gratitudeItemsForDate: latestGratitudeItems
        })
      : null

  const { feedbackCount, forecastAdjustment } = calculateForecastAdjustment(feedback)

  const stressPenalty = calculateStressPenalty(stressMetrics)

  const rawNextEnergy = latestScores?.predicted_next_day_energy ?? 0

  const recoveryBoost =
    stressMetrics.stressTrendDelta !== null && stressMetrics.stressTrendDelta < 0
      ? Math.min(8, Math.abs(stressMetrics.stressTrendDelta) * 0.2)
      : 0

  const personalizedNextEnergy = clampScore(
    rawNextEnergy + forecastAdjustment - stressPenalty + recoveryBoost
  )

  const nextDayEnergySubtitle =
    feedbackCount || stressPenalty || recoveryBoost
      ? `Feedback ${forecastAdjustment >= 0 ? "+" : ""}${forecastAdjustment} pts${
          stressPenalty ? `, stress -${stressPenalty} pts` : ""
        }${recoveryBoost ? `, recovery +${Math.round(recoveryBoost)} pts` : ""}`
      : "Prediction for tomorrow"

  const habitTrendDelta = calculateHabitTrend(entries, gratitude)

  const aiSummary = generateScientificAISummary({
    stressMetrics,
    habitScores,
    habitTrendDelta,
    happinessQuotient
  })

  const behaviorTrend =
    stressMetrics.stressTrendLabel === "increasing"
      ? `Recent pattern: stress is increasing${
          stressMetrics.weeklyStressBurden !== null
            ? ` with weekly burden at ${stressMetrics.weeklyStressBurden}/100`
            : ""
        }. Habit protection is ${habitScores.habitProtectionScore}/100.`
      : stressMetrics.stressTrendLabel === "reducing"
        ? `Recent pattern: stress is reducing${
            habitScores.topHabitDrivers.length
              ? ` while ${habitScores.topHabitDrivers.join(", ")} are supporting recovery`
              : ""
          }.`
        : `Recent pattern: stress is ${stressMetrics.stressTrendLabel}. Habit protection is ${habitScores.habitProtectionScore}/100.`

  const managementReport = calculateManagementReport({
    printableEntries,
    moods,
    gratitude,
    stressMetrics
  })

  return {
    latest,
    latestScores,
    latestMood,
    weeklyEntries,
    monthlyEntries,
    printableEntries,
    revisedWellbeingScore,
    weeklyWellbeing,
    monthlyWellbeing,
    weeklyEnergy,
    monthlyEnergy,
    happinessQuotient,
    habitScores,
    stressMetrics,
    gratitudeCount30,
    feedbackCount,
    forecastAdjustment,
    stressPenalty,
    personalizedNextEnergy,
    nextDayEnergySubtitle,
    behaviorTrend,
    aiSummary,
    managementReport
  }
}

export function formatTenScore(value: unknown) {
  const parsed = toNumberOrNull(value)
  return parsed === null ? "-" : `${parsed}/10`
}

export function formatScore(value: number | null | undefined) {
  return value === null || value === undefined ? "-" : `${value}/100`
}
