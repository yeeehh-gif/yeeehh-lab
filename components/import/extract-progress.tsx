"use client"

import { useState, useEffect } from "react"

const steps = [
  "Parsing document structure",
  "Identifying word boundaries & phrases",
  "Extracting vocabulary via Gemini",
  "Categorizing by training type",
  "Generating definitions & examples",
]

export function ExtractProgress({ onComplete }: { onComplete: () => void }) {
  const [done, setDone] = useState<number[]>([])

  useEffect(() => {
    steps.forEach((_, i) => {
      setTimeout(() => {
        setDone((prev) => [...prev, i])
        if (i === steps.length - 1) setTimeout(onComplete, 600)
      }, (i + 1) * 1000)
    })
  }, [onComplete])

  return (
    <>
      <div className="space-y-1">
        <h1 className="font-[family-name:var(--font-display)] italic text-[30px] font-bold text-ink tracking-tight">
          Extracting
        </h1>
        <p className="text-muted text-sm max-w-[480px] leading-relaxed">
          Analyzing your notes for vocabulary, phrases, and sentence patterns worth learning.
        </p>
      </div>

      <div className="flex flex-col">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-3 py-[14px] border-b border-rule text-sm">
            <span className="flex-1 text-ink font-medium">{label}</span>
            <span className={`font-mono text-[11px] tracking-wider ${done.includes(i) ? "text-accent-brand" : "text-faint"}`}>
              {done.includes(i) ? "Complete" : i <= (done.length) ? "Processing…" : "Waiting…"}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-6 mt-6 border-t border-rule">
        <span className="text-[13px] text-muted">
          {done.length === steps.length ? "23 items found" : "Extracting…"}
        </span>
      </div>
    </>
  )
}
