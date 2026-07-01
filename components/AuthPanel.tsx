"use client"

import { useEffect, useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

export function AuthPanel() {
  const [loading, setLoading] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session))
    })
  }, [])

  async function login() {
    setLoading(true)
    setError("")

    try {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
      setLoading(false)
    }
  }

  if (signedIn) {
    return (
      <div className="form-card">
        <span className="kicker">Welcome back</span>
        <h2>Continue your daily ritual</h2>
        <p>Your Human + Machine Sadhana space is ready.</p>
        <a className="primary-btn" href="/dashboard">Open Dashboard</a>
      </div>
    )
  }

  return (
    <div className="form-card">
      <span className="kicker">Private daily practice</span>
      <h2>Begin with Google</h2>
      <p>Sign in once to save your daily wellbeing, mood, gratitude and energy reflections.</p>
      <button className="primary-btn" onClick={login} disabled={loading}>
        {loading ? "Opening Google..." : "Sign in with Google"}
      </button>
      {error ? <p className="warning">{error}</p> : null}
    </div>
  )
}
