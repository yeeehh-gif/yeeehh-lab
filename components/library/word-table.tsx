"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Vocabulary } from "@/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const CATEGORIES = ["reading", "speaking", "writing"] as const

interface DupGroup {
  word: string
  items: Vocabulary[]
}

export function WordTable() {
  const [words, setWords] = useState<Vocabulary[]>([])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "reading" | "speaking" | "writing">("all")
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)

  // 重复词状态
  const [duplicates, setDuplicates] = useState<DupGroup[]>([])
  const [showDupPanel, setShowDupPanel] = useState(false)
  const [checkedDupIds, setCheckedDupIds] = useState<Set<string>>(new Set())
  const [batchDeleting, setBatchDeleting] = useState(false)

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

  // 扫描重复词
  async function scanDuplicates() {
    const supabase = createClient()
    const { data } = await supabase.from("vocabulary").select("*").order("created_at", { ascending: true })
    if (!data) return

    // 按小写 word 分组，每组 >1 条即重复
    const groups = new Map<string, Vocabulary[]>()
    for (const w of data) {
      const key = w.word.toLowerCase().trim()
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(w)
    }

    const dups: DupGroup[] = []
    for (const [word, items] of groups) {
      if (items.length > 1) dups.push({ word, items })
    }

    setDuplicates(dups)
    setShowDupPanel(true)
    // 默认选中每组的第 2 条及以后（保留最早的一条）
    const ids = new Set<string>()
    for (const d of dups) {
      for (let i = 1; i < d.items.length; i++) ids.add(d.items[i].id)
    }
    setCheckedDupIds(ids)
  }

  function toggleDupCheck(id: string) {
    setCheckedDupIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleDupGroup(group: DupGroup) {
    setCheckedDupIds(prev => {
      const next = new Set(prev)
      const allChecked = group.items.every(i => next.has(i.id))
      for (const i of group.items) {
        allChecked ? next.delete(i.id) : next.add(i.id)
      }
      return next
    })
  }

  async function batchDeleteDuplicates() {
    if (checkedDupIds.size === 0) return
    setBatchDeleting(true)
    const ids = [...checkedDupIds]
    const supabase = createClient()

    // 批量删除（分批 50 条）
    for (let i = 0; i < ids.length; i += 50) {
      const batch = ids.slice(i, i + 50)
      await supabase.from("vocabulary").delete().in("id", batch)
    }

    setWords(prev => prev.filter(w => !checkedDupIds.has(w.id)))
    setDuplicates([])
    setShowDupPanel(false)
    setCheckedDupIds(new Set())
    setBatchDeleting(false)
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

        {/* 查重按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={scanDuplicates}
          className="text-amber-700 border-amber-300 hover:bg-amber-50 ml-auto"
        >
          Find duplicates
        </Button>
        <span className="font-mono text-xs text-faint">{words.length} words</span>
      </div>

      {/* 重复词面板 */}
      {showDupPanel && (
        <div className="border-2 border-amber-300 bg-amber-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-amber-800">
              {duplicates.length === 0
                ? "No duplicates found! 🎉"
                : `Found ${duplicates.length} duplicate group${duplicates.length > 1 ? "s" : ""} (${[...checkedDupIds].length} selected)`}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowDupPanel(false); setDuplicates([]) }}>
                Dismiss
              </Button>
              {checkedDupIds.size > 0 && (
                <Button
                  size="sm"
                  onClick={batchDeleteDuplicates}
                  disabled={batchDeleting}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {batchDeleting ? "Deleting..." : `Delete ${checkedDupIds.size} selected`}
                </Button>
              )}
            </div>
          </div>

          {duplicates.map((group) => (
            <div key={group.word} className="border border-amber-200 bg-white rounded-md mb-2 last:mb-0 overflow-hidden">
              <button
                onClick={() => toggleDupGroup(group)}
                className="w-full text-left px-3 py-2 bg-amber-100/50 hover:bg-amber-100 text-xs font-semibold text-amber-900 flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={group.items.every(i => checkedDupIds.has(i.id))}
                  readOnly
                  className="w-3.5 h-3.5 accent-amber-700"
                />
                &ldquo;{group.word}&rdquo; — {group.items.length} entries
              </button>
              {group.items.map((item, idx) => (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-2 text-sm border-b border-rule last:border-0 cursor-pointer hover:bg-[#fdfdfb] ${
                    checkedDupIds.has(item.id) ? "bg-red-50/50" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checkedDupIds.has(item.id)}
                    onChange={() => toggleDupCheck(item.id)}
                    className="w-3.5 h-3.5 accent-amber-700"
                  />
                  <span className="font-semibold text-ink w-28 truncate">{item.word}</span>
                  <span className="text-body truncate flex-1">{item.definition}</span>
                  <span className="font-mono text-[10px] text-faint bg-[#f2f5f8] px-2 py-0.5 rounded-sm">{item.category.toUpperCase()}</span>
                  <span className="font-mono text-xs text-faint">m:{item.mastery_level}</span>
                  <span className="text-[10px] text-faint">{idx === 0 ? "(kept)" : ""}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      )}

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
