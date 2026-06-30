"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

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
  <Link href="/entry">Data Capture</Link>
  <Link href="/mood">Mood</Link>
  <Link href="/gratitude">Gratitude</Link>
  <Link href="/method">Method</Link>

  <div className="menu-wrap">
    <button
      className="ghost-btn icon-nav"
      onClick={() => setMenuOpen(prev => !prev)}
      title="Menu"
      aria-label="Menu"
      aria-expanded={menuOpen}
    >
      ☰
    </button>

    {menuOpen ? (
      <div className="quick-menu">
        <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
        <Link href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
        <Link href="/settings" onClick={() => setMenuOpen(false)}>Settings</Link>
        {user ? (
          <button onClick={signOut}>Sign out</button>
        ) : (
          <Link href="/" onClick={() => setMenuOpen(false)}>Sign in</Link>
        )}
      </div>
    ) : null}
  </div>
</nav>
        </div>
      </header>
      {loading ? <main className="container section"><p>Loading session...</p></main> : children}
    </>
  )
}
