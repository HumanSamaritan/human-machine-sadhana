export const categories = [
  {
    key: "physical_vitality_min",
    label: "Physical Vitality",
    target: 45,
    unit: "min",
    help: "Exercise, walking, yoga, sport, mobility or breath-led movement."
  },
  {
    key: "inner_practice_min",
    label: "Inner Practice",
    target: 40,
    unit: "min",
    help: "Meditation, prayer, healing, mantra or silent reflection."
  },
  {
    key: "revenue_money_work_min",
    label: "Revenue & Money-Energy Work",
    target: 180,
    unit: "min",
    help: "Deep livelihood work, client value creation, sales, delivery, job work or business building."
  },
  {
    key: "growth_self_learning_min",
    label: "Growth & Self-Learning",
    target: 90,
    unit: "min",
    help: "Reading, professional growth, certifications, learning and network building."
  },
  {
    key: "ai_human_partnership_min",
    label: "AI / Human Partnership",
    target: 30,
    unit: "min",
    help: "Using AI as a partner for better judgment, productivity, research, creativity or automation."
  },
  {
    key: "family_connection_min",
    label: "Family Connection",
    target: 45,
    unit: "min",
    help: "Family food time, emotional discussion, presence and bonding."
  },
  {
    key: "seva_planet_min",
    label: "Seva + Planet Action",
    target: 20,
    unit: "min",
    help: "Kindness act, sustainability action, service to another person, community or planet."
  },
  {
    key: "joyful_relaxation_min",
    label: "Joyful Relaxation",
    target: 30,
    unit: "min",
    help: "Healthy joy, play, music, nature, art, laughter or conscious relaxation."
  },
  {
    key: "sleep_preparation_min",
    label: "Sleep Preparation",
    target: 20,
    unit: "min",
    help: "Screen wind-down, light stretching, prayer, reading or quieting the nervous system."
  }
] as const

export const moodFactors = [
  "Health", "Sleep", "Food", "Work", "Money", "Family", "Learning", "AI partnership", "Faith", "Nature", "Stress", "Gratitude"
]

export const feelingLabels = [
  "Very unpleasant", "Unpleasant", "Slightly unpleasant", "Neutral", "Slightly pleasant", "Pleasant", "Very pleasant"
]

export type DailyEntry = {
  id?: string
  user_id?: string
  entry_date: string
  day_type: string | null
  entry_mode: string | null
  device_manual_note?: string | null
  physical_vitality_min: number | null
  inner_practice_min: number | null
  mindful_eating_score: number | null
  revenue_money_work_min: number | null
  growth_self_learning_min: number | null
  ai_human_partnership_min: number | null
  family_connection_min: number | null
  seva_planet_min: number | null
  joyful_relaxation_min: number | null
  sleep_preparation_min: number | null
  sleep_hours: number | null
  sleep_quality: number | null
  meals_captured: string | null
  breakfast_notes: string | null
  lunch_notes: string | null
  dinner_notes: string | null
  water_litres: number | null
  estimated_calories: number | null
  energy_score: number | null
  mood_score: number | null
  one_short_reflection: string | null
  tomorrow_focus: string | null
  wellbeing_score?: number | null
  performance_score?: number | null
  happiness_quotient?: number | null
  quantum_mind_score?: number | null
  predicted_next_day_energy?: number | null
  ai_assessment?: string | null
}
