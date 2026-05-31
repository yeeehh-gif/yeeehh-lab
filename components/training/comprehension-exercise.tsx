"use client"

import { useState } from "react"
import type { TrainingQuestion } from "@/lib/training/types"

export function ComprehensionExercise({
  question,
  onAnswer,
}: {
  question: TrainingQuestion
  onAnswer: (result: "correct" | "maybe" | "wrong") => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSelect = (choice: string) => {
    if (submitted) return
    setSelected(choice)
  }

  const handleSubmit = () => {
    if (!selected) return
    const correct = question.correctAnswer === selected ? "correct" as const : "wrong" as const
    setSubmitted(true)
    onAnswer(correct)
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      <div className="bg-white border border-rule rounded-2xl p-10 w-full shadow-card-md">
        <p className="text-[10px] font-semibold text-faint tracking-[2px] uppercase text-center mb-6">
          Reading · Comprehension
        </p>
        <p className="text-xl font-bold text-ink text-center mb-8">{question.prompt}</p>
        <div className="flex flex-col gap-3">
          {question.choices?.map((choice) => {
            const isSelected = selected === choice
            const isCorrect = submitted && choice === question.correctAnswer
            const isWrong = submitted && isSelected && choice !== question.correctAnswer
            return (
              <button
                key={choice}
                onClick={() => handleSelect(choice)}
                className={`p-4 rounded-lg border text-left text-sm font-medium transition-all ${
                  isCorrect
                    ? "border-green-600 bg-green-50 text-green-800"
                    : isWrong
                    ? "border-red-400 bg-red-50 text-red-700"
                    : isSelected
                    ? "border-charcoal bg-charcoal/5 text-ink"
                    : "border-rule hover:border-muted text-body"
                }`}
              >
                {choice}
              </button>
            )
          })}
        </div>
      </div>

      {!submitted && selected && (
        <button
          onClick={handleSubmit}
          className="bg-charcoal text-white font-bold text-sm py-3 px-8 rounded-lg hover:bg-charcoal/90 transition-colors"
        >
          Confirm answer
        </button>
      )}
    </div>
  )
}
