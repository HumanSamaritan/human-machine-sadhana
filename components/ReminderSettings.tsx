"use client"

import { useEffect, useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

type Settings = {
  email: string
  timezone: string
  morning_time: string
  enabled: boolean
}

const defaults: Settings = {
  email: "",
  timezone: "Asia/Singapore",
  morning_time: "08:00",
  enabled: true
}

export function ReminderSettings() {
  const [userId, setUserId] = useState<string | null>(null)
  const [settings, setSettings] = useState<Settings>(defaults)
  const [status, setStatus] = useState("")

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        window.location.href = "/"
        return
      }
      setUserId(data.user.id)
      const { data: row } = await supabase.from("reminder_preferences").select("*").eq("user_id", data.user.id).maybeSingle()
      setSettings(row ? { ...defaults, ...row } : { ...defaults, email: data.user.email ?? "" })
    })
  }, [])

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  async function save() {
    if (!userId) return
    const supabase = createBrowserSupabaseClient()
    const { error } = await supabase.from("reminder_preferences").upsert({
      user_id: userId,
      email: settings.email,
      timezone: settings.timezone,
      morning_time: settings.morning_time,
      enabled: settings.enabled
    }, { onConflict: "user_id" })
    setStatus(error ? error.message : "Daily reminder settings saved.")
  }

  async function sendTest() {
    setStatus("Sending test reminder...")
    const supabase = createBrowserSupabaseClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) {
      setStatus("Login session missing.")
      return
    }
    const res = await fetch("/api/reminders?test=1", { headers: { Authorization: `Bearer ${token}` } })
    const payload = await res.json().catch(() => ({}))
    setStatus(payload.message ?? payload.error ?? "Test route completed.")
  }

  return (
    <div className="container section">
      <span className="kicker">Reminder settings</span>
      <h2>One daily email prompt</h2>
      <p>Reminders are sent to the user's Gmail/email account once per day. Use Supabase + Resend and a daily scheduler if you want the reminder to run automatically.</p>
      <div className="form-card">
        <div className="grid grid-3">
          <div className="field"><label>Email</label><input value={settings.email} onChange={e => set("email", e.target.value)} /></div>
          <div className="field"><label>Timezone</label><input value={settings.timezone} onChange={e => set("timezone", e.target.value)} /></div>
          <div className="field"><label>Enabled</label><select value={settings.enabled ? "Yes" : "No"} onChange={e => set("enabled", e.target.value === "Yes")}><option>Yes</option><option>No</option></select></div>
          <div className="field"><label>Daily reminder time</label><input type="time" value={settings.morning_time} onChange={e => set("morning_time", e.target.value)} /></div>
        </div>
        <div className="cta-row">
          <button className="primary-btn" onClick={save}>Save Settings</button>
          <button className="ghost-btn" onClick={sendTest}>Send Test Reminder</button>
        </div>
        {status ? <p className="success">{status}</p> : null}
      </div>
      </div>
  )
}
