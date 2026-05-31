"use client"

import { useState } from "react"
import type { ExtractedItem } from "@/types"

const mockItems: ExtractedItem[] = [
  { word: "ubiquitous", phonetic: "/juːˈbɪk.wɪ.təs/", part_of_speech: "adj.", definition: "无处不在的，普遍存在的", example_sentence: "The internet has become ubiquitous in modern life.", category: "reading", source_note: "Unit 1", selected: true },
  { word: "call it a day", definition: "收工，到此为止", example_sentence: "Let's call it a day and continue tomorrow.", category: "speaking", source_note: "Unit 1", selected: true },
  { word: "paradigm shift", definition: "范式转移，根本性的思维转变", example_sentence: "The internet caused a paradigm shift in communication.", category: "writing", source_note: "The Economist", selected: true },
  { word: "cutting edge", definition: "最前沿的，尖端的", category: "reading", source_note: "The Economist", selected: true },
  { word: "leverage", definition: "充分利用，借助", category: "writing", source_note: "Business Glossary", selected: true },
  { word: "touch base", definition: "联系一下，简短碰头", category: "speaking", source_note: "Meeting Notes", selected: true },
]

export function ReviewList({ onNext }: { onNext: (items: ExtractedItem[]) => void }) {
  const [items, setItems] = useState(mockItems)
  const [filter, setFilter] = useState<"all" | "reading" | "speaking" | "writing">("all")

  function toggle(index: number) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, selected: !it.selected } : it)))
  }

  const filtered = filter === "all" ? items : items.filter((it) => it.category === filter)
  const selectedCount = items.filter((it) => it.selected).length

  const tagStyle: Record<string, string> = {
    reading: "bg-[#f2f5f8] text-[#4a7090]",
    speaking: "bg-[#faf6f0] text-[#9a7030]",
    writing: "bg-[#f0f5f2] text-[#4a7058]",
  }

  return (
    <>
      <div className="space-y-1">
        <h1 className="font-[family-name:var(--font-display)] italic text-[30px] font-bold text-ink tracking-tight">
          Review
        </h1>
        <p className="text-muted text-sm max-w-[480px] leading-relaxed">
          {items.length} items extracted. Uncheck anything you don&apos;t want in your training library.
        </p>
      </div>

      <div className="flex justify-between items-center pb-4 border-b border-rule">
        <div className="flex gap-5 text-[13px]">
          {(["all", "reading", "speaking", "writing"] as const).map((f) => (
            <span
              key={f}
              onClick={() => setFilter(f)}
              className={`cursor-pointer font-medium transition-colors ${
                filter === f ? "text-ink font-semibold" : "text-faint hover:text-muted"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </span>
          ))}
        </div>
        <span className="font-mono text-xs text-muted">{filtered.length} items</span>
      </div>

      <div className="border border-rule rounded-md overflow-hidden flex flex-col">
        {filtered.map((item, i) => {
          const originalIndex = items.indexOf(item)
          return (
            <div
              key={`${item.word}-${i}`}
              onClick={() => toggle(originalIndex)}
              className={`flex items-center gap-4 p-4 bg-white border-b border-rule last:border-0 transition-all cursor-pointer ${
                !item.selected ? "opacity-35" : ""
              }`}
            >
              <div
                className={`w-[18px] h-[18px] border-[1.5px] rounded-[3px] flex items-center justify-center flex-shrink-0 transition-all ${
                  item.selected ? "border-ink bg-ink" : "border-faint"
                }`}
              >
                {item.selected && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <span className="font-[family-name:var(--font-display)] italic text-xl font-semibold text-ink min-w-[130px]">
                {item.word}
              </span>
              <span className="text-sm text-body flex-1">{item.definition}</span>
              <span className={`font-mono text-[10px] font-medium px-[10px] py-1 rounded-sm tracking-wider flex-shrink-0 ${tagStyle[item.category] || ""}`}>
                {item.category.toUpperCase()}
              </span>
              <span className="text-xs text-faint underline underline-offset-[3px] decoration-rule hover:text-ink hover:decoration-ink cursor-pointer flex-shrink-0">
                edit
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex justify-between items-center pt-6 mt-6 border-t border-rule">
        <span className="text-[13px] text-muted">
          Importing <strong className="text-ink font-semibold">{selectedCount}</strong> of {items.length} items
        </span>
        <button
          onClick={() => onNext(items.filter((it) => it.selected))}
          disabled={selectedCount === 0}
          className="bg-charcoal text-white text-sm font-semibold py-3 px-7 rounded-md hover:bg-charcoal/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Import to library
        </button>
      </div>
    </>
  )
}
