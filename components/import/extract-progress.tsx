"use client"

import { useState, useEffect } from "react"

interface SelectedSource {
  notebookId: string
  notebookName: string
  sourceId: string
  title: string
}

type ExtractMode = { type: "sources"; sources: SelectedSource[] } | { type: "paste"; text: string }

export function ExtractProgress({
  mode,
  onComplete,
  onBack,
}: {
  mode: ExtractMode
  onComplete: (items: any[]) => void
  onBack?: () => void
}) {
  const [status, setStatus] = useState<"ready" | "extracting" | "done" | "error">(
    mode.type === "sources" ? "extracting" : "ready"
  )
  const [pastedText, setPastedText] = useState("")
  const [itemsFound, setItemsFound] = useState(0)
  const [errorMsg, setErrorMsg] = useState("")

  // Auto-start extraction for sources mode
  useEffect(() => {
    if (mode.type === "sources") {
      startSourceExtraction(mode.sources)
    }
  }, [])

  // ── Paste mode: show text input ──
  if (mode.type === "paste" && status === "ready") {
    return (
      <>
        <div className="space-y-1">
          <h1 className="font-[family-name:var(--font-display)] italic text-[30px] font-bold text-ink tracking-tight">
            Paste content
          </h1>
          <p className="text-muted text-sm mt-1 max-w-[480px] leading-relaxed">
            Copy and paste your English notes, articles, or any text below.
            DeepSeek AI will extract vocabulary from it.
          </p>
        </div>
        <textarea
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder="Paste your English text here... (minimum 100 characters)"
          rows={12}
          className="w-full border border-rule rounded-lg p-4 text-sm text-ink bg-white focus:outline-none focus:border-charcoal resize-y"
        />
        <div className="flex justify-between items-center pt-6 border-t border-rule">
          <span className="text-[13px] text-muted">
            {pastedText.length < 100
              ? `At least 100 characters (${pastedText.length}/100)`
              : `${pastedText.length} characters — ready to extract`}
          </span>
          <div className="flex gap-3">
            {onBack && (
              <button onClick={onBack} className="text-sm text-faint underline underline-offset-2 hover:text-muted">← Back</button>
            )}
            <button
              onClick={() => { setStatus("extracting"); startExtraction(pastedText) }}
              disabled={pastedText.length < 100}
              className="bg-charcoal text-white text-sm font-semibold py-3 px-7 rounded-md hover:bg-charcoal/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Extract vocabulary
            </button>
          </div>
        </div>
      </>
    )
  }

  // ── Extracting / Done / Error state ──
  const sourceCount = mode.type === "sources" ? mode.sources.length : 0

  return (
    <>
      <div className="space-y-1">
        <h1 className="font-[family-name:var(--font-display)] italic text-[30px] font-bold text-ink tracking-tight">
          Extracting
        </h1>
        <p className="text-muted text-sm max-w-[480px] leading-relaxed">
          {status === "extracting" && (
            mode.type === "sources"
              ? `Fetching ${sourceCount} source${sourceCount !== 1 ? "s" : ""} from NotebookLM and analyzing with DeepSeek...`
              : "DeepSeek AI is analyzing your text..."
          )}
          {status === "done" && "Extraction complete."}
          {status === "error" && "Extraction failed."}
        </p>
      </div>

      {/* Source list for sources mode */}
      {mode.type === "sources" && (
        <div className="flex flex-col">
          {mode.sources.map((src) => (
            <div key={src.sourceId} className="flex items-center gap-3 py-[14px] border-b border-rule text-sm">
              <span className="flex-1 text-ink font-medium truncate">{src.title}</span>
              <span className={`font-mono text-[11px] ${status === "extracting" ? "text-faint animate-pulse" : status === "done" ? "text-accent-brand" : "text-red-400"}`}>
                {status === "extracting" ? "Processing…" : status === "done" ? "Done" : "Failed"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-4 py-8">
        {status === "extracting" && (
          <>
            <div className="w-8 h-8 border-2 border-charcoal border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted animate-pulse">Processing with DeepSeek AI...</p>
          </>
        )}
        {status === "done" && (
          <div className="text-center">
            <p className="text-2xl mb-2">✨</p>
            <p className="text-ink font-semibold">
              <strong>{itemsFound}</strong> vocabulary items found
            </p>
          </div>
        )}
        {status === "error" && (
          <div className="text-center">
            <p className="text-red-600 text-sm mb-3">{errorMsg}</p>
            <button
              onClick={() => {
                setStatus("extracting")
                if (mode.type === "paste") startExtraction(mode.text)
                else startSourceExtraction(mode.sources)
              }}
              className="text-sm text-accent-brand underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </>
  )

  async function startExtraction(text: string) {
    try {
      const res = await fetch("/api/import/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || err.error) }
      const data = await res.json()
      setItemsFound(data.extracted?.length || 0)
      setStatus("done")
      setTimeout(() => onComplete(data.extracted || []), 600)
    } catch (err: any) {
      setErrorMsg(err.message)
      setStatus("error")
    }
  }

  async function startSourceExtraction(sources: SelectedSource[]) {
    try {
      const res = await fetch("/api/import/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || err.error) }
      const data = await res.json()
      setItemsFound(data.extracted?.length || 0)
      setStatus("done")
      setTimeout(() => onComplete(data.extracted || []), 600)
    } catch (err: any) {
      setErrorMsg(err.message)
      setStatus("error")
    }
  }
}
