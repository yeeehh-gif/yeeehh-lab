"use client"

import { useState } from "react"
import type { NotebookLMNote } from "@/types"

const mockNotes: NotebookLMNote[] = [
  { id: "1", title: "Unit 1 — Classroom Notes", updated_at: "2026-05-28", word_count: 1200 },
  { id: "2", title: "Reading Digest — The Economist", updated_at: "2026-05-25", word_count: 3400 },
  { id: "3", title: "Business English Glossary", updated_at: "2026-05-20", word_count: 800 },
  { id: "4", title: "Meeting Notes — May 15", updated_at: "2026-05-15", word_count: 600 },
]

export function NoteSelector({ onNext }: { onNext: (selected: NotebookLMNote[]) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(["1", "2"]))

  function toggle(id: string) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const selectedNotes = mockNotes.filter((n) => selected.has(n.id))

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] italic text-[30px] font-bold text-ink tracking-tight">
            Select notes
          </h1>
          <p className="text-muted text-sm mt-1 max-w-[480px] leading-relaxed">
            Choose which NotebookLM entries to extract vocabulary from.
            You&apos;ll review everything before it enters your library.
          </p>
        </div>

        <div className="border border-rule rounded-md overflow-hidden flex flex-col gap-px bg-rule">
          {mockNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => toggle(note.id)}
              className={`flex items-center gap-4 p-[18px] bg-white cursor-pointer transition-colors hover:bg-[#fdfdfb] ${
                selected.has(note.id) ? "bg-[#faf9f6]" : ""
              }`}
            >
              <div
                className={`w-[18px] h-[18px] border-[1.5px] rounded-[3px] flex items-center justify-center flex-shrink-0 transition-all ${
                  selected.has(note.id) ? "border-ink bg-ink" : "border-faint"
                }`}
              >
                {selected.has(note.id) && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-ink truncate">{note.title}</p>
                <p className="text-xs text-faint mt-[3px]">
                  Edited {note.updated_at} · ~{note.word_count.toLocaleString()} words
                </p>
              </div>
              <span className="font-mono text-[10px] text-muted uppercase tracking-wider px-[10px] py-1 border border-rule rounded-[3px] flex-shrink-0">
                NotebookLM
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 mt-6 border-t border-rule">
        <span className="text-[13px] text-muted">
          Selected <strong className="text-ink font-semibold">{selectedNotes.length}</strong> of {mockNotes.length} notes
          {" · "}Est. <strong className="text-ink font-semibold">{selectedNotes.length * 10}-{selectedNotes.length * 15}</strong> words
        </span>
        <button
          onClick={() => onNext(selectedNotes)}
          disabled={selectedNotes.length === 0}
          className="bg-charcoal text-white text-sm font-semibold py-3 px-7 rounded-md hover:bg-charcoal/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Extract vocabulary
        </button>
      </div>
    </>
  )
}
