"use client"

import { useState } from "react"
import { TrainingSession } from "@/components/training/training-session"

const categories = ["reading", "writing", "speaking"] as const

export default function TrainingPage() {
  const [category, setCategory] = useState<"reading" | "writing" | "speaking">("reading")

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-2">
        <h1 className="font-[family-name:var(--font-display)] italic text-[26px] font-bold text-ink tracking-tight">Training</h1>
        <p className="text-faint text-sm mt-1">Ebbinghaus schedule · All categories</p>
      </div>

      <div className="flex gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-5 py-2 rounded-md text-sm font-semibold transition-colors ${
              category === c
                ? "bg-charcoal text-white"
                : "bg-white border border-rule text-muted hover:text-ink hover:border-muted"
            }`}
          >
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      <TrainingSession key={category} category={category} />
    </div>
  )
}
