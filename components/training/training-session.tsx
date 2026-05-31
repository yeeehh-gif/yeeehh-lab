"use client"

import { useState, useEffect } from "react"
import { Flashcard } from "./flashcard"
import { TranslationExercise } from "./translation-exercise"
import { ClozeExercise } from "./cloze-exercise"
import { ComprehensionExercise } from "./comprehension-exercise"
import { TrainReader } from "@/lib/training/trainer-reader"
import { captureError } from "@/lib/training/error-backlog"
import type { TrainingQuestion } from "@/lib/training/types"
import type { Vocabulary } from "@/types"

export function TrainingSession() {
  const [questions, setQuestions] = useState<TrainingQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [complete, setComplete] = useState(false)
  const [feedback, setFeedback] = useState<"correct" | "maybe" | "wrong" | null>(null)
  const [stats, setStats] = useState({ correct: 0, maybe: 0, wrong: 0 })

  const trainer = new TrainReader()

  useEffect(() => { fetchQueue() }, [])

  async function fetchQueue() {
    const res = await fetch("/api/training/queue?type=reading&limit=10")
    const data = await res.json()
    const vocab: Vocabulary[] = data.queue || []
    const qs = trainer.generateQuestions(vocab)
    setQuestions(qs)
    setLoading(false)
  }

  async function handleAnswer(result: "correct" | "maybe" | "wrong") {
    const question = questions[currentIndex]

    await fetch("/api/training/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vocabularyId: question.vocabularyId, trainingType: "reading", result }),
    })

    if (result !== "correct") {
      await captureError({ vocabularyId: question.vocabularyId, errorType: "reading" })
    }

    setStats(prev => ({
      correct: prev.correct + (result === "correct" ? 1 : 0),
      maybe: prev.maybe + (result === "maybe" ? 1 : 0),
      wrong: prev.wrong + (result === "wrong" ? 1 : 0),
    }))

    setFeedback(result)
    setTimeout(() => {
      setFeedback(null)
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1)
      } else {
        setComplete(true)
      }
    }, 800)
  }

  if (loading) return <p className="text-faint text-sm text-center py-20">Loading today&apos;s training...</p>

  if (questions.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="font-[family-name:var(--font-display)] italic text-3xl font-bold text-ink mb-2">All caught up</h2>
        <p className="text-muted text-sm">No words to review today. Import more notes to build your queue.</p>
      </div>
    )
  }

  const question = questions[currentIndex]

  return (
    <div className="flex flex-col gap-6">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold text-faint tracking-[1.5px] uppercase">Progress</span>
        <div className="flex gap-2 flex-1">
          {questions.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-sm ${i < currentIndex ? "bg-charcoal" : i === currentIndex ? "bg-charcoal" : "bg-rule"}`} />
          ))}
        </div>
        <span className="font-mono text-xs text-muted">{currentIndex + 1}/{questions.length}</span>
      </div>

      {/* Exercise */}
      {!complete && (
        <>
          {question.type === "flashcard" && <Flashcard question={question} onAnswer={handleAnswer} />}
          {question.type === "translation" && <TranslationExercise question={question} onAnswer={handleAnswer} />}
          {question.type === "cloze" && <ClozeExercise question={question} onAnswer={handleAnswer} />}
          {question.type === "comprehension" && <ComprehensionExercise question={question} onAnswer={handleAnswer} />}
        </>
      )}

      {/* Feedback */}
      {feedback && (
        <div className={`text-center py-4 rounded-lg font-bold text-lg ${
          feedback === "correct" ? "bg-[#fdfaee] text-ink border-2 border-ink shadow-[3px_3px_0_#d4cfc4]" : "bg-white text-ink border-2 border-ink shadow-[3px_3px_0_#d4cfc4]"
        }`}>
          {feedback === "correct" ? "💥 POW! Nailed it!" : feedback === "maybe" ? "🤔 HMM... Close!" : "📖 NOPE! It'll come back soon."}
        </div>
      )}

      {/* Complete */}
      {complete && (
        <div className="text-center py-12 border border-rule rounded-xl bg-white shadow-card-md">
          <h2 className="font-[family-name:var(--font-display)] italic text-3xl font-bold text-ink mb-2">Training complete</h2>
          <p className="text-muted text-sm mb-6">Great work! Your progress has been saved.</p>
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center"><div className="font-[family-name:var(--font-display)] italic text-3xl font-bold text-ink">{stats.correct}</div><div className="text-xs text-faint">correct</div></div>
            <div className="text-center"><div className="font-[family-name:var(--font-display)] italic text-3xl font-bold text-[#c4a030]">{stats.maybe}</div><div className="text-xs text-faint">maybe</div></div>
            <div className="text-center"><div className="font-[family-name:var(--font-display)] italic text-3xl font-bold text-[#c44]">{stats.wrong}</div><div className="text-xs text-faint">wrong</div></div>
          </div>
          <button onClick={() => window.location.reload()} className="bg-charcoal text-white font-bold text-sm py-3 px-8 rounded-lg hover:bg-charcoal/90 transition-colors">
            Start new session
          </button>
        </div>
      )}
    </div>
  )
}
