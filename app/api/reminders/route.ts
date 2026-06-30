import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

function localHHMM(timezone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone || "Asia/Singapore",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date())
}

function localDate(timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date())
}

function sameHour(now: string, target: string) {
  return now.slice(0, 2) === target.slice(0, 2)
}

function dueSlot(now: string, pref: any) {
  const slots = [
    ["morning", pref.morning_time],
    ["afternoon", pref.afternoon_time],
    ["evening", pref.evening_time]
  ] as const
  return slots.find(([, target]) => target && sameHour(now, target))?.[0] ?? null
}

function reminderHtml(link: string) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#122033"><h2>Human + Machine Sadhana check-in</h2><p>Please record final actual minutes, entry mode and one short reflection for physical vitality, inner practice, mindful eating, revenue & money-energy work, growth, AI/human partnership, family, seva/planet, joy and sleep.</p><p><a href="${link}" style="background:#0b1324;color:#fff;padding:12px 16px;border-radius:10px;text-decoration:none">Open tracker</a></p><p>Small daily correction creates long-term human advantage.</p></div>`
}

export async function GET(req: NextRequest) {
  const isTest = req.nextUrl.searchParams.get("test") === "1"
  const auth = req.headers.get("authorization")?.replace("Bearer ", "")
  const cronSecret = process.env.CRON_SECRET

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return NextResponse.json({ message: "RESEND_API_KEY missing. Reminder route reached but email not sent." })

  const supabase = createAdminSupabaseClient()
  let prefs: any[] | null = []

  if (isTest) {
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { data: userData, error: userError } = await supabase.auth.getUser(auth)
    if (userError || !userData.user) return NextResponse.json({ error: "Invalid user token" }, { status: 401 })
    const { data, error } = await supabase.from("reminder_preferences").select("*").eq("user_id", userData.user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    prefs = data
  } else {
    if (cronSecret && auth !== cronSecret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { data, error } = await supabase.from("reminder_preferences").select("*").eq("enabled", true)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    prefs = data
  }

  const resend = new Resend(resendKey)
  const from = process.env.REMINDER_FROM_EMAIL || "Human + Machine Sadhana <onboarding@resend.dev>"
  let sent = 0
  let skipped = 0

  for (const pref of prefs ?? []) {
    if (!pref.email) continue
    const now = localHHMM(pref.timezone)
    const slot = isTest ? "test" : dueSlot(now, pref)
    if (!slot) continue
    if (!isTest) {
      const { error: lockError } = await supabase.from("reminder_sends").insert({
        user_id: pref.user_id,
        local_date: localDate(pref.timezone),
        reminder_slot: slot,
        email: pref.email
      })
      if (lockError) {
        skipped++
        continue
      }
    }
    const link = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/entry`
    await resend.emails.send({
      from,
      to: pref.email,
      subject: "Update your Human + Machine Sadhana tracker",
      html: reminderHtml(link)
    })
    sent++
  }

  return NextResponse.json({ message: `Reminder run completed. Emails sent: ${sent}. Duplicate slots skipped: ${skipped}` })
}
