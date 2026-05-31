"use client"

import { useState } from "react"
import type { TrainingQuestion } from "@/lib/training/types"

export function TranslationExercise({
  question,
  onAnswer,
}: {
  question: TrainingQuestion
  onAnswer: (result: "correct" | "maybe" | "wrong") => void
}) {
  const [input, setInput] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!input.trim()) return
    const correct = question.correctAnswer.toLowerCase().trim()
    const response = input.toLowerCase().trim()
    let result: "correct" | "maybe" | "wrong" = "wrong"
    if (response === correct) result = "correct"
    else if (correct.includes(response) || response.includes(correct)) result = "maybe"
    setSubmitted(true)
    onAnswer(result)
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      <div className="bg-white border border-rule rounded-2xl p-10 w-full shadow-card-md text-center">
        <p className="text-[10px] font-semibold text-faint tracking-[2px] uppercase mb-4">
          Reading · Translation
        </p>
        <p className="text-sm font-medium text-muted mb-3">Translate to English:</p>
        <p className="font-[family-name:var(--font-display)] italic text-3xl font-bold text-ink">
          {question.prompt}
        </p>
      </div>

      {!submitted ? (
        <>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Type your answer..."
            className="w-full border border-rule rounded-lg p-4 text-lg font-medium text-ink focus:outline-none focus:border-charcoal bg-white"
          />
          <button
            onClick={handleSubmit}
            className="bg-charcoal text-white font-bold text-sm py-3 px-8 rounded-lg hover:bg-charcoal/90 transition-colors"
          >
            Check answer
          </button>
        </>
      ) : (
        <div className="bg-[#fdfaee] border-2 border-ink rounded-xl p-6 w-full text-center shadow-[4px_4px_0_#d4cfc4]">
          <p className="text-xs text-muted mb-1">Your answer:</p>
          <p className="text-lg font-semibold text-ink mb-3">{input}</p>
          <p className="text-xs text-muted mb-1">Correct answer:</p>
          <p className="text-lg font-bold text-ink">{question.correctAnswer}</p>
        </div>
      )}
    </div>
  )
}
