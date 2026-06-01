"use client"

import { useState } from "react"
import type { TrainingQuestion } from "@/lib/training/types"
import { PronunciationButton } from "./pronunciation-button"

export function Flashcard({
  question,
  onAnswer,
}: {
  question: TrainingQuestion
  onAnswer: (result: "correct" | "maybe" | "wrong") => void
}) {
  const [flipped, setFlipped] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const answer = (result: "correct" | "maybe" | "wrong") => {
    if (submitted) return
    setSubmitted(true)
    onAnswer(result)
  }

  if (!flipped) {
    return (
      <div className="flex flex-col items-center gap-8">
        <div
          onClick={() => setFlipped(true)}
          className="bg-white border border-rule rounded-2xl p-16 w-full max-w-md text-center cursor-pointer shadow-card-md hover:shadow-lg transition-all"
        >
          <p className="text-[10px] font-semibold text-faint tracking-[2px] uppercase mb-4">
            Reading · Vocabulary
          </p>
          <h2 className="font-[family-name:var(--font-display)] italic text-5xl font-bold text-ink">
            {question.prompt}
          </h2>
          {question.vocabulary.phonetic && (
            <p className="font-mono text-sm text-faint mt-3">{question.vocabulary.phonetic}</p>
          )}
          <div className="mt-3"><PronunciationButton text={question.prompt} /></div>
          <p className="text-faint text-sm mt-8">Tap to reveal meaning</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="bg-white border border-rule rounded-2xl p-10 w-full max-w-md shadow-card-md">
        <p className="text-[10px] font-semibold text-faint tracking-[2px] uppercase mb-3">
          Reading · Vocabulary
        </p>
        <h2 className="font-[family-name:var(--font-display)] italic text-3xl font-bold text-ink mb-1">
          {question.prompt}
        </h2>
        {question.vocabulary.phonetic && (
          <p className="font-mono text-sm text-faint mb-6">{question.vocabulary.phonetic}</p>
        )}
        <div className="mt-2 mb-6"><PronunciationButton text={question.prompt} /></div>
        <div className="border-t border-rule pt-6 mt-4">
          <p className="text-sm text-muted mb-2">Definition</p>
          <p className="text-lg font-semibold text-ink">{question.correctAnswer}</p>
          {question.vocabulary.example_sentence && (
            <p className="text-sm text-body mt-4 italic">
              &ldquo;{question.vocabulary.example_sentence}&rdquo;
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3 w-full max-w-md">
        <button
          onClick={() => answer("wrong")}
          className="flex-1 bg-white border-2 border-ink text-[#c44] font-bold text-sm py-3 rounded-lg shadow-[4px_4px_0_#d4cfc4] hover:shadow-[6px_6px_0_#d4cfc4] hover:-translate-y-0.5 active:shadow-[2px_2px_0_#d4cfc4] active:translate-y-0.5 transition-all"
        >
          NOPE
        </button>
        <button
          onClick={() => answer("maybe")}
          className="flex-1 bg-white border-2 border-ink text-[#c4a030] font-bold text-sm py-3 rounded-lg shadow-[4px_4px_0_#d4cfc4] hover:shadow-[6px_6px_0_#d4cfc4] hover:-translate-y-0.5 active:shadow-[2px_2px_0_#d4cfc4] active:translate-y-0.5 transition-all"
        >
          HMM...
        </button>
        <button
          onClick={() => answer("correct")}
          className="flex-1 bg-charcoal border-2 border-ink text-gold font-bold text-sm py-3 rounded-lg shadow-[4px_4px_0_#d4cfc4] hover:shadow-[6px_6px_0_#d4cfc4] hover:-translate-y-0.5 active:shadow-[2px_2px_0_#d4cfc4] active:translate-y-0.5 transition-all"
        >
          GOT IT!
        </button>
      </div>
    </div>
  )
}
