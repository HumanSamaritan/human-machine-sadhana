"use client"

import { useEffect, useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { encryptText, decryptText } from "@/lib/encryption"

const today = () => new Date().toISOString().slice(0, 10)

type GratitudeRow = { id: string; entry_date: string; ciphertext: string; iv: string; salt: string; item_count: number }

export function GratitudeForm() {
  const [userId, setUserId] = useState<string | null>(null)
  const [entryDate, setEntryDate] = useState(today())
  const [passphrase, setPassphrase] = useState("")
  const [items, setItems] = useState(["", "", ""])
  const [status, setStatus] = useState("")
  const [rows, setRows] = useState<GratitudeRow[]>([])
  const [decrypted, setDecrypted] = useState<Record<string, string>>({})

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = "/"
      else {
        setUserId(data.user.id)
        loadRows(data.user.id)
      }
    })
  }, [])

  async function loadRows(uid: string) {
    const supabase = createBrowserSupabaseClient()
    const { data } = await supabase.from("gratitude_entries").select("id,entry_date,ciphertext,iv,salt,item_count").eq("user_id", uid).order("entry_date", { ascending: false }).limit(10)
    setRows(data ?? [])
  }

  async function save() {
    if (!userId) return
    if (!passphrase || passphrase.length < 8) { setStatus("Use a private passphrase with at least 8 characters."); return }
    const plain = items.filter(Boolean).map((text, i) => `${i + 1}. ${text}`).join("\n")
    if (!plain.trim()) { setStatus("Add at least one gratitude item."); return }
    setStatus("Encrypting locally in your browser...")
    const encrypted = await encryptText(plain, passphrase)
    const supabase = createBrowserSupabaseClient()
    const { error } = await supabase.from("gratitude_entries").insert({
      user_id: userId,
      entry_date: entryDate,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      salt: encrypted.salt,
      algorithm: encrypted.algorithm,
      item_count: items.filter(Boolean).length
    })
    if (error) setStatus(error.message)
    else {
      setStatus("Gratitude saved encrypted. Only your passphrase can decrypt it.")
      setItems(["", "", ""])
      loadRows(userId)
    }
  }

  async function reveal(row: GratitudeRow) {
    try {
      if (!passphrase) { setStatus("Enter your passphrase first."); return }
      const text = await decryptText(row.ciphertext, row.iv, row.salt, passphrase)
      setDecrypted(prev => ({ ...prev, [row.id]: text }))
    } catch {
      setStatus("Could not decrypt. The passphrase may be incorrect.")
    }
  }

  return (
    <div className="container section">
      <span className="kicker">Private gratitude</span>
      <h2>Record gratitude without exposing the content</h2>
      <p>Gratitude text is encrypted in your browser before saving. The dashboard uses only the presence/count of entries, not the private words.</p>
      <div className="grid grid-2">
        <section className="form-card">
          <div className="field"><label>Date</label><input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} /></div>
          <div className="field"><label>Private passphrase</label><input type="password" value={passphrase} onChange={e => setPassphrase(e.target.value)} placeholder="Do not forget this. It is not stored." /></div>
          {items.map((item, idx) => (
            <div className="field" key={idx}><label>Gratitude {idx + 1}</label><textarea value={item} onChange={e => setItems(prev => prev.map((x, i) => i === idx ? e.target.value : x))} /></div>
          ))}
          <button className="primary-btn" onClick={save}>Encrypt & Save Gratitude</button>
          {status ? <p className="success">{status}</p> : null}
        </section>
        <section className="form-card">
          <span className="kicker">Recent encrypted entries</span>
          {rows.length === 0 ? <p>No gratitude entries yet.</p> : rows.map(row => (
            <div className="card" key={row.id} style={{ marginBottom: 12 }}>
              <strong>{row.entry_date} · {row.item_count} item(s)</strong>
              <p className="small">Encrypted private content.</p>
              <button className="ghost-btn" onClick={() => reveal(row)}>Decrypt locally</button>
              {decrypted[row.id] ? <pre className="notice" style={{ whiteSpace: "pre-wrap" }}>{decrypted[row.id]}</pre> : null}
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
