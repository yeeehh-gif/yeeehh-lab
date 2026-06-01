"use client"

import { useState, useEffect } from "react"

interface NotebookLMSource {
  id: string
  title: string
  type: string
  url: string | null
  status: string
}

interface NotebookLMNotebook {
  id: string
  name: string
  created_at: string
  is_owner: boolean
  sources: NotebookLMSource[]
}

interface SelectedSource {
  notebookId: string
  notebookName: string
  sourceId: string
  title: string
}

export function NoteSelector({ onNext }: { onNext: (selected: SelectedSource[]) => void }) {
  const [notebooks, setNotebooks] = useState<NotebookLMNotebook[]>([])
  const [expandedNotebook, setExpandedNotebook] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchNotebooks()
  }, [])

  async function fetchNotebooks() {
    try {
      const res = await fetch("/api/notebooklm/notebooks")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setNotebooks(data.notebooks || [])
    } catch (err: any) {
      setError(err.message || "Failed to load notebooks")
    } finally {
      setLoading(false)
    }
  }

  function toggleSource(notebookId: string, sourceId: string) {
    const key = `${notebookId}:${sourceId}`
    const next = new Set(selectedIds)
    next.has(key) ? next.delete(key) : next.add(key)
    setSelectedIds(next)
  }

  function toggleNotebook(notebookId: string) {
    setExpandedNotebook(expandedNotebook === notebookId ? null : notebookId)
  }

  function toggleAllInNotebook(notebook: NotebookLMNotebook) {
    const keys = notebook.sources.map((s) => `${notebook.id}:${s.id}`)
    const allSelected = keys.every((k) => selectedIds.has(k))
    const next = new Set(selectedIds)
    keys.forEach((k) => (allSelected ? next.delete(k) : next.add(k)))
    setSelectedIds(next)
  }

  const selectedSources: SelectedSource[] = []
  for (const nb of notebooks) {
    for (const src of nb.sources) {
      if (selectedIds.has(`${nb.id}:${src.id}`)) {
        selectedSources.push({
          notebookId: nb.id,
          notebookName: nb.name,
          sourceId: src.id,
          title: src.title,
        })
      }
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-faint text-sm">Loading your NotebookLM library...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 text-sm mb-2">Failed to load notebooks</p>
        <p className="text-faint text-xs">{error}</p>
        <button
          onClick={fetchNotebooks}
          className="mt-4 text-sm text-accent-brand underline underline-offset-2"
        >
          Retry
        </button>
      </div>
    )
  }

  if (notebooks.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-faint text-sm">No NotebookLM notebooks found.</p>
        <p className="text-faint text-xs mt-1">Create one at notebooklm.google.com first.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] italic text-[30px] font-bold text-ink tracking-tight">
            Select notes
          </h1>
          <p className="text-muted text-sm mt-1 max-w-[480px] leading-relaxed">
            Choose a notebook, then pick which sources to extract vocabulary from.
          </p>
        </div>

        {/* Notebook list */}
        <div className="flex flex-col gap-3">
          {notebooks.map((notebook) => {
            const isExpanded = expandedNotebook === notebook.id
            const sourcesInBook = notebook.sources
            const selectedInBook = sourcesInBook.filter(
              (s) => selectedIds.has(`${notebook.id}:${s.id}`)
            ).length
            const hasSources = sourcesInBook.length > 0

            return (
              <div key={notebook.id} className="border border-rule rounded-md overflow-hidden">
                {/* Notebook header */}
                <button
                  onClick={() => hasSources && toggleNotebook(notebook.id)}
                  className={`w-full flex items-center gap-3 p-4 bg-white text-left transition-colors ${
                    hasSources ? "hover:bg-[#fdfdfb] cursor-pointer" : "opacity-50 cursor-default"
                  }`}
                >
                  <span
                    className={`text-lg transition-transform duration-200 ${
                      !hasSources ? "text-faint/30" : ""
                    }`}
                    style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                  >
                    ›
                  </span>
                  <span className="text-xl">{hasSources ? "📓" : "📭"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-ink truncate">
                      {notebook.name}
                    </p>
                    <p className="text-xs text-faint mt-0.5">
                      {hasSources
                        ? `${sourcesInBook.length} source${sourcesInBook.length !== 1 ? "s" : ""}`
                        : "No sources"}
                      {notebook.created_at && ` · ${notebook.created_at.slice(0, 10)}`}
                    </p>
                  </div>
                  {selectedInBook > 0 && (
                    <span className="font-mono text-xs font-semibold bg-charcoal text-gold px-2 py-0.5 rounded-full">
                      {selectedInBook}/{sourcesInBook.length}
                    </span>
                  )}
                </button>

                {/* Expanded: sources */}
                {isExpanded && hasSources && (
                  <div className="border-t border-rule bg-[#fafbfc]">
                    <button
                      onClick={() => toggleAllInNotebook(notebook)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-muted hover:text-ink font-medium transition-colors"
                    >
                      <div
                        className={`w-[16px] h-[16px] border-[1.5px] rounded-[3px] flex items-center justify-center flex-shrink-0 transition-all ${
                          sourcesInBook.every((s) => selectedIds.has(`${notebook.id}:${s.id}`))
                            ? "border-ink bg-ink"
                            : "border-faint"
                        }`}
                      >
                        {sourcesInBook.every((s) => selectedIds.has(`${notebook.id}:${s.id}`)) && (
                          <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      Select all sources
                    </button>

                    {sourcesInBook.map((src) => (
                      <button
                        key={src.id}
                        onClick={() => toggleSource(notebook.id, src.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f5f4f0] transition-colors text-left border-t border-rule/50"
                      >
                        <div
                          className={`w-[16px] h-[16px] border-[1.5px] rounded-[3px] flex items-center justify-center flex-shrink-0 transition-all ${
                            selectedIds.has(`${notebook.id}:${src.id}`) ? "border-ink bg-ink" : "border-faint"
                          }`}
                        >
                          {selectedIds.has(`${notebook.id}:${src.id}`) && (
                            <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pl-2">
                          <p className="text-sm font-medium text-ink truncate">{src.title}</p>
                          <p className="text-xs text-faint mt-0.5">
                            {src.type} {src.status !== "ready" && `· ${src.status}`}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex justify-between items-center pt-6 mt-6 border-t border-rule">
        <span className="text-[13px] text-muted">
          Selected <strong className="text-ink font-semibold">{selectedSources.length}</strong> source{selectedSources.length !== 1 ? "s" : ""}
          {" · "}from{" "}
          <strong className="text-ink font-semibold">
            {new Set(selectedSources.map((s) => s.notebookId)).size}
          </strong>{" "}
          notebook{new Set(selectedSources.map((s) => s.notebookId)).size !== 1 ? "s" : ""}
        </span>
        <button
          onClick={() => onNext(selectedSources)}
          disabled={selectedSources.length === 0}
          className="bg-charcoal text-white text-sm font-semibold py-3 px-7 rounded-md hover:bg-charcoal/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Extract vocabulary
        </button>
      </div>
    </>
  )
}
