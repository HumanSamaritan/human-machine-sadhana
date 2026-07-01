"use client"

import { useEffect, useMemo, useState } from "react"

const tour = [
  {
    label: "Start",
    title: "Human + Machine Sadhana",
    words: "A daily ritual for wellbeing, energy and performance in an AI-shaped world.",
    image: "/future-work-life/slide-visual-1.png",
    stats: ["Wellbeing", "Energy", "Purpose"]
  },
  {
    label: "Capture",
    title: "Capture the day",
    words: "The user records movement, inner practice, work, learning, food, mood, family, gratitude and sleep in simple values.",
    image: "/future-work-life/slide-visual-2.png",
    stats: ["Sleep 7.5h", "Mood 8/10", "Meals complete"]
  },
  {
    label: "Guidance",
    title: "Gentle correction",
    words: "The app changes guidance based on the data: low sleep, missed meals, low movement or low mood each create a different next action.",
    image: "/future-work-life/slide-visual-3.png",
    stats: ["Recover", "Refocus", "Improve"]
  },
  {
    label: "Mood",
    title: "Human context",
    words: "Mood and gratitude add the human story behind the numbers, while private reflections stay personal to the user.",
    image: "/future-work-life/slide-visual-6.png",
    stats: ["Calm", "Connected", "Private"]
  },
  {
    label: "Dashboard",
    title: "Predicted vs actual energy",
    words: "The dashboard compares predicted energy with actual feeling, so the model can improve as the user builds a real pattern.",
    image: "/sadhana-hero.svg",
    stats: ["Predicted 79", "Actual 81", "Learning"]
  },
  {
    label: "Loop",
    title: "Better next action",
    words: "The outcome is a loop: human awareness, machine-supported insight and practical choices for the next day.",
    image: "/future-work-life/slide-visual-4.png",
    stats: ["Awareness", "Insight", "Action"]
  }
]

const bars = [
  ["Mon", 68, 64],
  ["Tue", 72, 70],
  ["Wed", 76, 78],
  ["Thu", 70, 67],
  ["Fri", 82, 80],
  ["Sat", 74, 76]
]

export default function DemoPage() {
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(false)
  const step = tour[active]

  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => {
      setActive((current) => {
        if (current >= tour.length - 1) {
          setPlaying(false)
          return current
        }
        return current + 1
      })
    }, active === 0 ? 6200 : 9000)
    return () => window.clearTimeout(timer)
  }, [active, playing])

  const progress = useMemo(() => ((active + 1) / tour.length) * 100, [active])

  function toggleTour() {
    if (active === tour.length - 1 && !playing) setActive(0)
    setPlaying((value) => !value)
  }

  return (
    <main className="tour-page">
      <section className="tour-shell" aria-label="Human Machine Sadhana guided demo">
        <div className="tour-topline">
          <a className="brand mini-brand" href="/">
            <span className="logo"><img src="/sadhana-mark.svg" alt="" /></span>
            <span>Human + Machine Sadhana</span>
          </a>
          <div className="tour-actions">
            <a href="/method">Method</a>
            <a href="/">Home</a>
          </div>
        </div>

        <div className="tour-stage">
          <aside className="tour-copy">
            <span className="kicker">Guided demo</span>
            <h1>{step.title}</h1>
            <div className="spoken-text" aria-live="polite">{step.words}</div>
            <div className="tour-pills">
              {step.stats.map((item) => <span key={item}>{item}</span>)}
            </div>
            <button className="primary-btn tour-play" onClick={toggleTour}>
              {playing ? "Pause demo" : active === tour.length - 1 ? "Replay demo" : "Play demo"}
            </button>
          </aside>

          <section className="tour-screen" aria-label="Demo screen preview">
            <div className="device-frame">
              <div className="device-bar"><span /><span /><span /></div>
              <div className="device-content">
                <div className="tour-visual-panel">
                  <img src={step.image} alt="Human Machine Sadhana visual" />
                </div>
                <div className="tour-app-panel">
                  <div className="mock-header">
                    <strong>{step.label}</strong>
                    <span>{active + 1}/{tour.length}</span>
                  </div>
                  {active === 4 ? (
                    <div className="mock-chart">
                      {bars.map(([day, predicted, actual]) => (
                        <div className="mock-bars" key={day}>
                          <div className="bar-pair-small">
                            <i className="predicted" style={{ height: `${predicted}%` }} />
                            <i className="actual" style={{ height: `${actual}%` }} />
                          </div>
                          <span>{day}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mock-fields">
                      {step.stats.map((item, index) => (
                        <div className="mock-field" key={item}>
                          <span>{item}</span>
                          <div><i style={{ width: `${58 + index * 14}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="tour-bottom">
          <div className="tour-progress"><span style={{ width: `${progress}%` }} /></div>
          <nav className="tour-tabs" aria-label="Demo steps">
            {tour.map((item, index) => (
              <button key={item.label} className={index === active ? "active" : ""} onClick={() => { setActive(index); setPlaying(false) }}>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </section>
    </main>
  )
}
