"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Vocabulary } from "@/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const CATEGORIES = ["reading", "speaking", "writing"] as const

export function WordTable() {
  const [words, setWords] = useState<Vocabulary[]>([])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "reading" | "speaking" | "writing">("all")
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)

  useEffect(() => { loadWords() }, [search, filter])

  async function loadWords() {
    const supabase = createClient()
    let query = supabase.from("vocabulary").select("*").order("created_at", { ascending: false })
    if (search) query = query.ilike("word", `%${search}%`)
    if (filter !== "all") query = query.eq("category", filter)
    const { data } = await query
    setWords(data || [])
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (deleting) return
    setDeleting(id)
    const supabase = createClient()
    await supabase.from("vocabulary").delete().eq("id", id)
    setWords(prev => prev.filter(w => w.id !== id))
    setDeleting(null)
  }

  async function handleCategoryChange(id: string, newCategory: string) {
    const supabase = createClient()
    await supabase.from("vocabulary").update({ category: newCategory }).eq("id", id)
    setWords(prev => prev.map(w => w.id === id ? { ...w, category: newCategory as Vocabulary["category"] } : w))
    setEditingCategory(null)
  }

  if (loading) return <p className="text-faint text-sm">Loading...</p>

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search words..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-[260px]"
        />
        <div className="flex gap-2">
          {(["all", ...CATEGORIES] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className={filter === f ? "bg-charcoal text-white" : "text-muted"}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
        <span className="font-mono text-xs text-faint ml-auto">{words.length} words</span>
      </div>

      <div className="border border-rule rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rule bg-[#fafbfc]">
              <th className="text-left p-4 font-semibold text-ink">Word</th>
              <th className="text-left p-4 font-semibold text-ink">Definition</th>
              <th className="text-left p-4 font-semibold text-ink">Category</th>
              <th className="text-left p-4 font-semibold text-ink">Mastery</th>
              <th className="text-left p-4 font-semibold text-ink">Source</th>
              <th className="text-right p-4 font-semibold text-ink w-16"></th>
            </tr>
          </thead>
          <tbody>
            {words.map((w) => (
              <tr key={w.id} className="border-b border-rule last:border-0 hover:bg-[#fdfdfb]">
                <td className="p-4">
                  <span className="font-semibold text-ink">{w.word}</span>
                  {w.phonetic && (
                    <span className="font-mono text-xs text-faint ml-2">{w.phonetic}</span>
                  )}
                </td>
                <td className="p-4 text-body">{w.definition}</td>
                <td className="p-4">
                  {editingCategory === w.id ? (
                    <select
                      value={w.category}
                      onChange={(e) => handleCategoryChange(w.id, e.target.value)}
                      onBlur={() => setEditingCategory(null)}
                      autoFocus
                      className="text-[10px] font-medium px-2 py-1 rounded-sm border border-rule bg-white focus:outline-none focus:border-charcoal"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c.toUpperCase()}</option>
                      ))}
                    </select>
                  ) : (
                    <button
                      onClick={() => setEditingCategory(w.id)}
                      className="font-mono text-[10px] font-medium px-[10px] py-1 rounded-sm tracking-wider bg-[#f2f5f8] text-[#4a7090] hover:bg-[#e2e8f0] cursor-pointer transition-colors"
                      title="Click to change category"
                    >
                      {w.category.toUpperCase()}
                    </button>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-[6px] bg-[#ebeef2] rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-charcoal rounded-sm"
                        style={{ width: `${(w.mastery_level / 5) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-muted">{w.mastery_level}/5</span>
                  </div>
                </td>
                <td className="p-4 text-faint text-xs">{w.source_note || "—"}</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleDelete(w.id)}
                    disabled={deleting === w.id}
                    className="text-faint hover:text-red-600 disabled:opacity-30 transition-colors text-xs font-medium"
                    title="Delete word"
                  >
                    {deleting === w.id ? "..." : "✕"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {words.length === 0 && (
        <p className="text-faint text-sm text-center py-12">No words found. Import notes to get started.</p>
      )}
    </div>
  )
}
