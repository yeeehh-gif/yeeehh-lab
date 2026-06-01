"use client"

import { useState } from "react"
import { StepIndicator } from "@/components/import/step-indicator"
import { NoteSelector } from "@/components/import/note-selector"
import { ExtractProgress } from "@/components/import/extract-progress"
import { ReviewList } from "@/components/import/review-list"
import { ImportComplete } from "@/components/import/import-complete"
import type { ExtractedItem } from "@/types"

interface SelectedSource {
  notebookId: string
  notebookName: string
  sourceId: string
  title: string
}

export default function ImportPage() {
  const [step, setStep] = useState(1)
  const [selectedSources, setSelectedSources] = useState<SelectedSource[]>([])
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([])
  const [importedItems, setImportedItems] = useState<ExtractedItem[]>([])
  const [mode, setMode] = useState<"sources" | "paste">("sources")

  return (
    <div className="flex flex-col gap-8 max-w-[680px]">
      <StepIndicator current={step} />

      {/* Step 1: Choose source type */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h1 className="font-[family-name:var(--font-display)] italic text-[30px] font-bold text-ink tracking-tight">
              Import vocabulary
            </h1>
            <p className="text-muted text-sm mt-1 max-w-[480px] leading-relaxed">
              Choose how you want to add new vocabulary to your training library.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => { setMode("sources"); setStep(2) }}
              className="bg-white border border-rule rounded-xl p-6 text-left hover:border-charcoal hover:shadow-card-md transition-all"
            >
              <span className="text-2xl mb-2 block">📓</span>
              <h3 className="text-[15px] font-semibold text-ink">From NotebookLM</h3>
              <p className="text-xs text-faint mt-1 leading-relaxed">
                Select notebooks and sources from your NotebookLM library
              </p>
            </button>

            <button
              onClick={() => { setMode("paste"); setStep(2) }}
              className="bg-white border border-rule rounded-xl p-6 text-left hover:border-charcoal hover:shadow-card-md transition-all"
            >
              <span className="text-2xl mb-2 block">📋</span>
              <h3 className="text-[15px] font-semibold text-ink">Paste text</h3>
              <p className="text-xs text-faint mt-1 leading-relaxed">
                Copy and paste any English text and let AI extract vocabulary
              </p>
            </button>
          </div>
        </div>
      )}

      {step === 2 && mode === "sources" && (
        <NoteSelector
          onNext={(sources) => {
            setSelectedSources(sources)
            setStep(3)
          }}
        />
      )}

      {step === 3 && mode === "sources" && (
        <ExtractProgress
          mode={{ type: "sources", sources: selectedSources }}
          onComplete={(items) => { setExtractedItems(items); setStep(4) }}
          onBack={() => setStep(2)}
        />
      )}

      {step === 2 && mode === "paste" && (
        <ExtractProgress
          mode={{ type: "paste", text: "" }}
          onComplete={(items) => { setExtractedItems(items); setStep(4) }}
          onBack={() => setStep(1)}
        />
      )}

      {step === 4 && (
        <ReviewList
          items={extractedItems}
          onNext={(items) => { setImportedItems(items); setStep(5) }}
        />
      )}

      {step === 5 && <ImportComplete items={importedItems} />}

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
