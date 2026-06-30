"use client"

import { useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

export function AuthPanel() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function login() {
    setLoading(true)
    setError("")
    try {
      const supabase = createBrowserSupabaseClient()
      const redirectTo = `${window.location.origin}/dashboard`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { access_type: "offline", prompt: "consent" }
        }
      })
      if (error) setError(error.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
      setLoading(false)
    }
  }

  return (
    <div className="form-card">
      <span className="kicker">Google login</span>
      <h2>Start your daily ritual</h2>
      <p>
        Sign in with Google to keep your daily Human + Machine Sadhana entries private under your own account.
      </p>
      <button className="primary-btn" onClick={login} disabled={loading}>
        {loading ? "Opening Google..." : "Continue with Google"}
      </button>
      {error ? <p className="warning">{error}</p> : null}
      <p className="small">
        First launch uses Supabase Google OAuth. Enable Google provider in Supabase before production deployment.
      </p>
    </div>
  )
}
