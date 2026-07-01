"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function signOut() {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <>
      <header className="nav">
        <div className="container nav-inner">
          <Link href="/dashboard" className="brand">
            <span className="logo"><img src="/sadhana-mark.svg" alt="" /></span>
            <span>Human + Machine Sadhana</span>
          </Link>
          <nav className="nav-links">
            <Link href="/entry">Daily Entry</Link>
            <Link href="/mood">Mood</Link>
            <Link href="/gratitude">Gratitude</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/rewards">Rewards</Link>
            <Link href="/settings">Settings</Link>
            <Link href="/method">Method</Link>
            {user ? <button className="ghost-btn" onClick={signOut}>Sign out</button> : <Link href="/">Login</Link>}
          </nav>
        </div>
      </header>
      {loading ? <main className="container section"><p>Loading session...</p></main> : children}
    </>
  )
}

