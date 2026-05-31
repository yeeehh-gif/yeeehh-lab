"use client"

import { useState } from "react"
import { StepIndicator } from "@/components/import/step-indicator"
import { NoteSelector } from "@/components/import/note-selector"
import { ExtractProgress } from "@/components/import/extract-progress"
import { ReviewList } from "@/components/import/review-list"
import { ImportComplete } from "@/components/import/import-complete"
import type { NotebookLMNote, ExtractedItem } from "@/types"

export default function ImportPage() {
  const [step, setStep] = useState(1)
  const [selectedNotes, setSelectedNotes] = useState<NotebookLMNote[]>([])
  const [importedItems, setImportedItems] = useState<ExtractedItem[]>([])

  return (
    <div className="flex flex-col gap-8 max-w-[680px]">
      <StepIndicator current={step} />

      {step === 1 && (
        <NoteSelector
          onNext={(notes) => {
            setSelectedNotes(notes)
            setStep(2)
          }}
        />
      )}

      {step === 2 && (
        <ExtractProgress onComplete={() => setStep(3)} />
      )}

      {step === 3 && (
        <ReviewList
          onNext={(items) => {
            setImportedItems(items)
            setStep(4)
          }}
        />
      )}

      {step === 4 && <ImportComplete items={importedItems} />}

      {step > 1 && step < 4 && (
        <button
          onClick={() => setStep((s) => s - 1)}
          className="text-sm text-faint underline underline-offset-[3px] decoration-rule hover:text-muted hover:decoration-muted self-start"
        >
          ← Back
        </button>
      )}
    </div>
  )
}
