"use client"

import { useState } from "react"
import { WordTable } from "@/components/library/word-table"
import { WordForm } from "@/components/library/word-form"

export default function LibraryPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-[family-name:var(--font-display)] italic text-[26px] font-bold text-ink tracking-tight">
            My Words
          </h1>
          <p className="text-faint text-sm mt-1">Browse and manage your vocabulary library</p>
        </div>
        <WordForm onSaved={() => setRefreshKey((k) => k + 1)} />
      </div>
      <WordTable key={refreshKey} />
    </div>
  )
}
