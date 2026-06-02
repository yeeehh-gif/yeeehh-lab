"use client"

import { useState, useEffect, useCallback } from "react"
import { Flashcard } from "./flashcard"
import { TranslationExercise } from "./translation-exercise"
import { ClozeExercise } from "./cloze-exercise"
import { ComprehensionExercise } from "./comprehension-exercise"
import { WritingExercise } from "./writing-exercise"
import { FeedbackCard } from "./feedback-card"
import { TrainReader } from "@/lib/training/trainer-reader"
import { TrainWriter } from "@/lib/training/trainer-writer"
import { TrainSpeaker } from "@/lib/training/trainer-speaker"
import { captureError } from "@/lib/training/error-backlog"
import type { Trainer, TrainingQuestion } from "@/lib/training/types"
import type { Vocabulary } from "@/types"

const SAVED_KEY = "english-lab-training-session"

interface SavedSession {
  questions: TrainingQuestion[]
  currentIndex: number
  stats: { correct: number; maybe: number; wrong: number }
  category: string
  timestamp: number
}

const trainers: Record<string, Trainer> = {
  reading: new TrainReader(),
  writing: new TrainWriter(),
  speaking: new TrainSpeaker(),
}

export function TrainingSession({ category }: { category: "reading" | "writing" | "speaking" }) {
  const [questions, setQuestions] = useState<TrainingQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [complete, setComplete] = useState(false)
  const [feedback, setFeedback] = useState<"correct" | "maybe" | "wrong" | null>(null)
  const [stats, setStats] = useState({ correct: 0, maybe: 0, wrong: 0 })
  const [submitting, setSubmitting] = useState(false)
  const [aiFeedback, setAiFeedback] = useState("")
  const [aiCorrection, setAiCorrection] = useState("")
  const [aiScore, setAiScore] = useState<"pass" | "needs_improvement" | "fail" | null>(null)
  const [betterExpression, setBetterExpression] = useState("")
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null)
  const [showResume, setShowResume] = useState(false)

  const trainer = trainers[category]

  // Check for saved session on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY)
      if (raw) {
        const saved: SavedSession = JSON.parse(raw)
        // 仅当 category 匹配 且 题目存在 且 未过期（<2小时）时恢复
        const isFresh = Date.now() - saved.timestamp < 2 * 60 * 60 * 1000
        if (saved.category === category && saved.questions?.length > 0 && saved.currentIndex < saved.questions.length && isFresh) {
          setSavedSession(saved)
          setShowResume(true)
        } else {
          // 清除不兼容或过期的会话
          localStorage.removeItem(SAVED_KEY)
        }
      }
    } catch {}
  }, [category])

  // Fetch or restore
  useEffect(() => {
    if (!showResume) fetchQueue()
  }, [category, showResume])

  // Save progress after each answer (only when not complete)
  useEffect(() => {
    if (!complete && questions.length > 0) {
      const session: SavedSession = { questions, currentIndex, stats, category, timestamp: Date.now() }
      localStorage.setItem(SAVED_KEY, JSON.stringify(session))
    }
  }, [currentIndex, questions.length, complete])

  // Clear saved session on completion
  useEffect(() => {
    if (complete) localStorage.removeItem(SAVED_KEY)
  }, [complete])

  async function fetchQueue() {
    const res = await fetch(`/api/training/queue?type=${category}&limit=10`)
    const data = await res.json()
    const vocab: Vocabulary[] = data.queue || []
    const qs = trainer.generateQuestions(vocab)
    setQuestions(qs)
    setLoading(false)
  }

  function handleResume() {
    if (!savedSession) return
    setQuestions(savedSession.questions)
    setCurrentIndex(savedSession.currentIndex)
    setStats(savedSession.stats)
    setShowResume(false)
    setLoading(false)
  }

  function handleFreshStart() {
    localStorage.removeItem(SAVED_KEY)
    setSavedSession(null)
    setShowResume(false)
    setComplete(false)
    setCurrentIndex(0)
    setStats({ correct: 0, maybe: 0, wrong: 0 })
    setFeedback(null)
    setLoading(true)
    fetchQueue()
  }

  const advanceQuestion = useCallback(() => {
    setFeedback(null)
    setSubmitting(false)
    setAiFeedback("")
    setAiCorrection("")
    setAiScore(null)
    setBetterExpression("")
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      setComplete(true)
    }
  }, [currentIndex, questions.length])

  async function handleAnswer(result: "correct" | "maybe" | "wrong", userAnswer?: string) {
    if (submitting) return
    setSubmitting(true)
    setAiFeedback("")
    setAiCorrection("")
    setAiScore(null)
    setBetterExpression("")

    const question = questions[currentIndex]

    // 记录到数据库
    await fetch("/api/training/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vocabularyId: question.vocabularyId, trainingType: category, result }),
    })

    if (result !== "correct") {
      await captureError({ vocabularyId: question.vocabularyId, errorType: category })
    }

    // AI 评估（非闪卡模式且有用户输入时）
    if (userAnswer && question.type !== "flashcard") {
      try {
        const res = await fetch("/api/training/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word: question.prompt,
            correctAnswer: question.correctAnswer,
            userAnswer,
            questionType: question.type,
            category,
            exampleSentence: question.vocabulary.example_sentence || "",
          }),
        })
        const evalData = await res.json()
        if (evalData.feedback) setAiFeedback(evalData.feedback)
        if (evalData.correction) setAiCorrection(evalData.correction)
        if (evalData.better_expression) setBetterExpression(evalData.better_expression)
        if (evalData.score) setAiScore(evalData.score)
      } catch {
        // AI 挂了不影响训练
      }
    }

    setStats(prev => ({
      correct: prev.correct + (result === "correct" ? 1 : 0),
      maybe: prev.maybe + (result === "maybe" ? 1 : 0),
      wrong: prev.wrong + (result === "wrong" ? 1 : 0),
    }))

    setFeedback(result)
  }

  // Show resume prompt
  if (showResume && savedSession) {
    return (
      <div className="text-center py-16">
        <h2 className="font-[family-name:var(--font-display)] italic text-2xl font-bold text-ink mb-2">
          Resume training?
        </h2>
        <p className="text-muted text-sm mb-2">
          You were on question {savedSession.currentIndex + 1} of {savedSession.questions.length}
        </p>
        <p className="text-xs text-faint mb-6">
          {savedSession.stats.correct} correct · {savedSession.stats.maybe} maybe · {savedSession.stats.wrong} wrong
          {" · "}saved {Math.round((Date.now() - savedSession.timestamp) / 60000)} min ago
        </p>
        <div className="flex justify-center gap-3">
          <button onClick={handleFreshStart} className="border border-rule bg-white text-ink text-sm font-semibold py-3 px-7 rounded-md hover:border-muted transition-colors">
            Start fresh
          </button>
          <button onClick={handleResume} className="bg-charcoal text-white text-sm font-bold py-3 px-7 rounded-md hover:bg-charcoal/90 transition-colors">
            Continue
          </button>
        </div>
      </div>
    )
  }

  if (loading) return <p className="text-faint text-sm text-center py-20">Loading today&apos;s training...</p>

  if (questions.length === 0) {
    const label = category.charAt(0).toUpperCase() + category.slice(1)
    return (
      <div className="text-center py-20">
        <h2 className="font-[family-name:var(--font-display)] italic text-3xl font-bold text-ink mb-2">All caught up</h2>
        <p className="text-muted text-sm">No {label.toLowerCase()} words to review today. Import more notes or switch category.</p>
      </div>
    )
  }

  const question = questions[currentIndex]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold text-faint tracking-[1.5px] uppercase">Progress</span>
        <div className="flex gap-2 flex-1">
          {questions.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-sm ${i < currentIndex ? "bg-charcoal" : i === currentIndex ? "bg-charcoal" : "bg-rule"}`} />
          ))}
        </div>
        <span className="font-mono text-xs text-muted">{currentIndex + 1}/{questions.length}</span>
      </div>

      {!complete && (
        <>
          {category === "writing" ? (
            /* 写作模式：所有题目都用 WritingExercise，确保始终有文本输入框 */
            <WritingExercise key={question.id} question={question} onAnswer={handleAnswer} />
          ) : (
            /* 阅读/口语：按题目类型渲染对应组件 */
            <>
              {question.type === "flashcard" && <Flashcard key={question.id} question={question} onAnswer={handleAnswer} />}
              {question.type === "translation" && <TranslationExercise key={question.id} question={question} onAnswer={handleAnswer} />}
              {question.type === "cloze" && <ClozeExercise key={question.id} question={question} onAnswer={handleAnswer} />}
              {question.type === "comprehension" && <ComprehensionExercise key={question.id} question={question} onAnswer={handleAnswer} />}
            </>
          )}
        </>
      )}

      {feedback && (
        <FeedbackCard
          feedback={feedback}
          aiScore={aiScore}
          aiFeedback={aiFeedback}
          aiCorrection={aiCorrection}
          betterExpression={betterExpression}
          category={category}
          onNext={advanceQuestion}
        />
      )}

      {complete && (
        <div className="text-center py-12 border border-rule rounded-xl bg-white shadow-card-md">
          <h2 className="font-[family-name:var(--font-display)] italic text-3xl font-bold text-ink mb-2">Training complete</h2>
          <p className="text-muted text-sm mb-6">Great work! Your progress has been saved.</p>
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center"><div className="font-[family-name:var(--font-display)] italic text-3xl font-bold text-ink">{stats.correct}</div><div className="text-xs text-faint">correct</div></div>
            <div className="text-center"><div className="font-[family-name:var(--font-display)] italic text-3xl font-bold text-[#c4a030]">{stats.maybe}</div><div className="text-xs text-faint">maybe</div></div>
            <div className="text-center"><div className="font-[family-name:var(--font-display)] italic text-3xl font-bold text-[#c44]">{stats.wrong}</div><div className="text-xs text-faint">wrong</div></div>
          </div>
          <button onClick={handleFreshStart} className="bg-charcoal text-white font-bold text-sm py-3 px-8 rounded-lg hover:bg-charcoal/90 transition-colors">Start new session</button>
        </div>
      )}
    </div>
  )
}
