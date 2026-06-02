"use client"

import { useState } from "react"
import type { TrainingQuestion } from "@/lib/training/types"

export function WritingExercise({
  question,
  onAnswer,
}: {
  question: TrainingQuestion
  onAnswer: (result: "correct" | "maybe" | "wrong", userAnswer?: string) => void
}) {
  const [input, setInput] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!input.trim()) return
    // 本地快速评估：包含目标单词即可通过，AI 评估会更精确
    const targetWord = question.vocabulary.word.toLowerCase()
    const response = input.toLowerCase().trim()
    let result: "correct" | "maybe" | "wrong" = "wrong"
    if (response.includes(targetWord)) {
      result = response.length > 20 ? "correct" : "maybe"
    } else if (response.length > 10) {
      result = "maybe"
    }
    setSubmitted(true)
    onAnswer(result, input)
  }

  // 根据题目类型选择合适的 placeholder
  const getPlaceholder = () => {
    if (question.prompt.includes("Translate")) return "Type your English translation..."
    if (question.prompt.includes("Write 2-3")) return "Write 2-3 sentences in English..."
    return "Write your sentence in English..."
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      <div className="bg-white border border-rule rounded-2xl p-10 w-full shadow-card-md text-center">
        <p className="text-[10px] font-semibold text-faint tracking-[2px] uppercase mb-4">
          Writing · Practice
        </p>
        <p className="text-sm font-medium text-muted mb-3">{question.prompt}</p>
        {question.context && (
          <p className="text-xs text-faint italic mb-2">{question.context}</p>
        )}
        <p className="font-[family-name:var(--font-display)] italic text-2xl font-bold text-ink">
          {question.vocabulary.word}
        </p>
        <p className="text-xs text-muted mt-1">{question.vocabulary.definition}</p>
      </div>

      {!submitted ? (
        <>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            placeholder={getPlaceholder()}
            rows={4}
            className="w-full border border-rule rounded-lg p-4 text-lg font-medium text-ink focus:outline-none focus:border-charcoal bg-white resize-none"
          />
          <p className="text-[10px] text-faint -mt-4">
            Press Cmd+Enter (or Ctrl+Enter) to submit
          </p>
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="bg-charcoal text-white font-bold text-sm py-3 px-8 rounded-lg hover:bg-charcoal/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit answer
          </button>
        </>
      ) : (
        <div className="bg-[#fdfaee] border-2 border-ink rounded-xl p-6 w-full text-center shadow-[4px_4px_0_#d4cfc4]">
          <p className="text-xs text-muted mb-1">Your answer:</p>
          <p className="text-lg font-semibold text-ink mb-3 whitespace-pre-wrap">{input}</p>
          <p className="text-xs text-muted mb-1">Reference:</p>
          <p className="text-base text-ink/70 italic">{question.correctAnswer || question.vocabulary.example_sentence || "—"}</p>
        </div>
      )}
    </div>
  )
}
