# Phase 2: Core Training — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended).

**Goal:** Build the Ebbinghaus scheduler, reading training with 4 question types, and error review loop. Define Trainer interface for future writing/speaking expansion.

**Architecture:** Trainer abstract interface → TrainReader implements 4 reading modes (flashcard, translation, cloze, comprehension). Ebbinghaus scheduler calculates review intervals (1/2/4/7/15/30 days). Error backlog auto-captures wrong answers and requeues at shorter intervals. All training data persisted to Supabase.

**Tech Stack:** Next.js 14, TypeScript, Supabase, Tailwind CSS, shadcn/ui. Extends Phase 1 foundation.

---

## File Map (new files for Phase 2)

```
F:/English Leaning Web/
├── lib/
│   ├── ebbinghaus.ts              # Scheduler algorithm
│   └── training/
│       ├── types.ts               # Trainer interface + shared types
│       ├── trainer-reader.ts      # Reading training implementation
│       └── error-backlog.ts       # Error capture and requeue
├── components/
│   └── training/
│       ├── flashcard.tsx          # Flashcard component
│       ├── translation-exercise.tsx  # Translation exercise
│       ├── cloze-exercise.tsx     # Cloze (fill-in-blank)
│       ├── comprehension-exercise.tsx # Reading comprehension
│       └── training-session.tsx   # Session orchestrator
├── app/
│   ├── (dashboard)/training/
│   │   └── page.tsx               # Training main page
│   └── api/training/
│       ├── queue/route.ts         # GET today's training queue
│       └── record/route.ts        # POST training result
```

---

### Task 11: Ebbinghaus Scheduler Engine

**Files:** Create `lib/ebbinghaus.ts`

- [ ] **Step 1: Create scheduler module**

```typescript
/**
 * Ebbinghaus forgetting curve intervals (in days).
 * After each successful review, advance to the next interval.
 * After a failed review, reset to interval 0.
 */
const INTERVALS = [1, 2, 4, 7, 15, 30]

export interface ScheduleResult {
  nextReviewAt: Date
  intervalDays: number
  intervalIndex: number
}

/**
 * Calculate the next review date based on current review state.
 *
 * @param currentIntervalIndex - Current position in INTERVALS (0-based)
 * @param result - 'correct' advances, 'maybe' stays, 'wrong' resets
 * @param now - Reference timestamp (defaults to now)
 */
export function calculateNextReview(
  currentIntervalIndex: number,
  result: "correct" | "maybe" | "wrong",
  now: Date = new Date()
): ScheduleResult {
  let nextIndex: number

  switch (result) {
    case "correct":
      nextIndex = Math.min(currentIntervalIndex + 1, INTERVALS.length - 1)
      break
    case "maybe":
      nextIndex = Math.max(currentIntervalIndex - 1, 0)
      break
    case "wrong":
      nextIndex = 0
      break
  }

  const intervalDays = INTERVALS[nextIndex]
  const nextReviewAt = new Date(now)
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays)
  nextReviewAt.setHours(0, 0, 0, 0)

  return { nextReviewAt, intervalDays, intervalIndex: nextIndex }
}

/**
 * Error backlog interval (shorter than main schedule).
 * Wrong answers reappear after 1 day, then 2 days, then release.
 */
const ERROR_INTERVALS = [1, 2]

export function calculateErrorRequeue(
  currentAttempts: number,
  now: Date = new Date()
): { nextAttemptAt: Date; attempts: number; shouldRelease: boolean } {
  const attempts = currentAttempts + 1
  const shouldRelease = attempts > ERROR_INTERVALS.length

  const nextAttemptAt = new Date(now)
  if (!shouldRelease) {
    nextAttemptAt.setDate(nextAttemptAt.getDate() + ERROR_INTERVALS[attempts - 1])
  }
  nextAttemptAt.setHours(0, 0, 0, 0)

  return { nextAttemptAt, attempts, shouldRelease }
}

export { INTERVALS, ERROR_INTERVALS }
```

- [ ] **Step 2: Commit**

```bash
git add lib/ebbinghaus.ts && git commit -m "feat: ebbinghaus scheduler engine"
```

---

### Task 12: Trainer Interface + Shared Types

**Files:** Create `lib/training/types.ts`

- [ ] **Step 1: Create trainer types**

```typescript
import type { Vocabulary } from "@/types"

/** A single question/task generated for a training session */
export interface TrainingQuestion {
  id: string
  vocabularyId: string
  type: "flashcard" | "translation" | "cloze" | "comprehension"
  prompt: string           // What to show the user
  correctAnswer: string    // Expected answer
  choices?: string[]       // For multiple-choice variants
  context?: string         // Sentence or paragraph context
  vocabulary: Vocabulary   // Source vocabulary item
}

/** User's answer to a question */
export interface TrainingAnswer {
  questionId: string
  userResponse: string
  result: "correct" | "maybe" | "wrong"
  answeredAt: Date
}

/** Result of a completed training session */
export interface TrainingSessionResult {
  totalQuestions: number
  correct: number
  maybe: number
  wrong: number
  answers: TrainingAnswer[]
  startedAt: Date
  completedAt: Date
}

/**
 * Trainer interface — all training types implement this.
 * Phase 2 implements TrainReader. Phase 3 adds TrainWriter, TrainSpeaker.
 */
export interface Trainer {
  /** Training type identifier */
  readonly category: "reading" | "speaking" | "writing"

  /** Generate questions from vocabulary items */
  generateQuestions(vocabulary: Vocabulary[]): TrainingQuestion[]

  /** Evaluate a user's answer and return the result */
  evaluateAnswer(question: TrainingQuestion, userResponse: string): "correct" | "maybe" | "wrong"

  /** Generate a hint for the current question */
  getHint(question: TrainingQuestion): string
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/training/types.ts && git commit -m "feat: trainer interface and shared training types"
```

---

### Task 13: Reading Trainer Implementation

**Files:** Create `lib/training/trainer-reader.ts`

- [ ] **Step 1: Implement TrainReader**

```typescript
import type { Trainer, TrainingQuestion } from "./types"
import type { Vocabulary } from "@/types"

export class TrainReader implements Trainer {
  readonly category = "reading" as const

  generateQuestions(vocabulary: Vocabulary[]): TrainingQuestion[] {
    if (vocabulary.length === 0) return []

    const questions: TrainingQuestion[] = []

    for (const vocab of vocabulary) {
      // Pick a random question type for variety, or cycle through types
      const types = ["flashcard", "translation", "cloze", "comprehension"] as const
      const type = types[Math.floor(Math.random() * types.length)]

      switch (type) {
        case "flashcard":
          questions.push(this.makeFlashcard(vocab))
          break
        case "translation":
          questions.push(this.makeTranslation(vocab))
          break
        case "cloze":
          questions.push(this.makeCloze(vocab))
          break
        case "comprehension":
          questions.push(this.makeComprehension(vocab))
          break
      }
    }

    return questions
  }

  private makeFlashcard(vocab: Vocabulary): TrainingQuestion {
    return {
      id: `${vocab.id}-fc`,
      vocabularyId: vocab.id,
      type: "flashcard",
      prompt: vocab.word,
      correctAnswer: vocab.definition,
      vocabulary: vocab,
    }
  }

  private makeTranslation(vocab: Vocabulary): TrainingQuestion {
    return {
      id: `${vocab.id}-tr`,
      vocabularyId: vocab.id,
      type: "translation",
      prompt: vocab.definition,    // Show Chinese → recall English
      correctAnswer: vocab.word,
      vocabulary: vocab,
    }
  }

  private makeCloze(vocab: Vocabulary): TrainingQuestion {
    const sentence = vocab.example_sentence || `The word "${vocab.word}" is used in context.`
    const blank = sentence.replace(new RegExp(vocab.word, "gi"), "__________")
    return {
      id: `${vocab.id}-cl`,
      vocabularyId: vocab.id,
      type: "cloze",
      prompt: blank,
      correctAnswer: vocab.word,
      context: sentence,
      vocabulary: vocab,
    }
  }

  private makeComprehension(vocab: Vocabulary): TrainingQuestion {
    const distractors = this.generateDistractors(vocab)
    return {
      id: `${vocab.id}-co`,
      vocabularyId: vocab.id,
      type: "comprehension",
      prompt: `What does "${vocab.word}" mean?`,
      correctAnswer: vocab.definition,
      choices: this.shuffle([vocab.definition, ...distractors]),
      vocabulary: vocab,
    }
  }

  private generateDistractors(vocab: Vocabulary): string[] {
    // Simple fallback distractors — in production, fetch from similar words
    return [
      "与上下文无关的选项",
      "相反的意思",
      "近义但不同的表达",
    ]
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  evaluateAnswer(question: TrainingQuestion, userResponse: string): "correct" | "maybe" | "wrong" {
    const correct = question.correctAnswer.toLowerCase().trim()
    const response = userResponse.toLowerCase().trim()

    // Exact match
    if (response === correct) return "correct"

    // Partial match (contains key words)
    const correctWords = correct.split(/\s+/).filter(w => w.length > 1)
    const responseWords = response.split(/\s+/).filter(w => w.length > 1)
    const overlap = correctWords.filter(w => responseWords.includes(w))

    if (overlap.length >= correctWords.length * 0.7) return "maybe"
    if (overlap.length > 0) return "maybe"

    return "wrong"
  }

  getHint(question: TrainingQuestion): string {
    switch (question.type) {
      case "flashcard":
        return `Starts with "${question.correctAnswer.charAt(0)}..." and has ${question.correctAnswer.length} characters`
      case "translation":
        return `The English word starts with "${question.correctAnswer.charAt(0)}..."`
      case "cloze":
        return `The missing word has ${question.correctAnswer.length} letters`
      case "comprehension":
        return `The correct definition is ${question.correctAnswer.length} characters long`
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/training/trainer-reader.ts && git commit -m "feat: reading trainer with 4 question types"
```

---

### Task 14: Error Backlog Module

**Files:** Create `lib/training/error-backlog.ts`

- [ ] **Step 1: Create error backlog logic**

```typescript
import { createClient } from "@/lib/supabase/client"
import { calculateErrorRequeue } from "@/lib/ebbinghaus"
import type { ErrorBacklog } from "@/types"

/**
 * Capture a wrong/maybe answer into the error backlog.
 * Calculates next attempt time using error-specific intervals.
 */
export async function captureError(params: {
  vocabularyId: string
  errorType: "reading" | "speaking" | "writing"
}): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Check existing backlog entry
  const { data: existing } = await supabase
    .from("error_backlog")
    .select("*")
    .eq("user_id", user.id)
    .eq("vocabulary_id", params.vocabularyId)
    .eq("error_type", params.errorType)
    .single()

  const { nextAttemptAt, attempts, shouldRelease } = calculateErrorRequeue(
    existing?.attempts ?? 0
  )

  if (shouldRelease) {
    // Remove from backlog — user has passed error review
    if (existing) {
      await supabase
        .from("error_backlog")
        .delete()
        .eq("id", existing.id)
    }
    return
  }

  if (existing) {
    await supabase
      .from("error_backlog")
      .update({ attempts, next_attempt_at: nextAttemptAt.toISOString() })
      .eq("id", existing.id)
  } else {
    await supabase.from("error_backlog").insert({
      user_id: user.id,
      vocabulary_id: params.vocabularyId,
      error_type: params.errorType,
      attempts,
      next_attempt_at: nextAttemptAt.toISOString(),
    })
  }
}

/**
 * Fetch error backlog items due for review today.
 */
export async function getDueErrors(type?: "reading" | "speaking" | "writing"): Promise<ErrorBacklog[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const now = new Date().toISOString()
  let query = supabase
    .from("error_backlog")
    .select("*")
    .eq("user_id", user.id)
    .lte("next_attempt_at", now)

  if (type) query = query.eq("error_type", type)

  const { data } = await query
  return data || []
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/training/error-backlog.ts && git commit -m "feat: error backlog capture and requeue"
```

---

### Task 15: Training Session Orchestrator + API

**Files:** Create `app/api/training/queue/route.ts`, `app/api/training/record/route.ts`

- [ ] **Step 1: Create training queue API**

Create `app/api/training/queue/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { INTERVALS } from "@/lib/ebbinghaus"

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || "reading"
  const limit = parseInt(searchParams.get("limit") || "20")

  const now = new Date().toISOString()

  // Get vocabulary due for review
  const { data: schedule } = await supabase
    .from("review_schedule")
    .select("vocabulary_id")
    .eq("user_id", user.id)
    .lte("next_review_at", now)
    .order("next_review_at", { ascending: true })
    .limit(limit)

  let vocabularyIds = schedule?.map(s => s.vocabulary_id) || []

  // Also get new words (not yet in schedule)
  if (vocabularyIds.length < limit) {
    const { data: newWords } = await supabase
      .from("vocabulary")
      .select("id")
      .eq("user_id", user.id)
      .eq("category", type)
      .eq("mastery_level", 0)
      .limit(limit - vocabularyIds.length)

    if (newWords) {
      vocabularyIds = [...vocabularyIds, ...newWords.map(w => w.id)]
    }
  }

  // Fetch full vocabulary
  if (vocabularyIds.length === 0) {
    return NextResponse.json({ queue: [], message: "No words to review today" })
  }

  const { data: vocabulary } = await supabase
    .from("vocabulary")
    .select("*")
    .in("id", vocabularyIds)

  return NextResponse.json({ queue: vocabulary || [] })
}
```

Also import `NextRequest` — add at top:
```typescript
import { NextResponse, type NextRequest } from "next/server"
```

- [ ] **Step 2: Create training record API**

Create `app/api/training/record/route.ts`:

```typescript
import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { calculateNextReview } from "@/lib/ebbinghaus"

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { vocabularyId, trainingType, result } = await request.json()

  // Record the training result
  await supabase.from("training_records").insert({
    user_id: user.id,
    vocabulary_id: vocabularyId,
    training_type: trainingType,
    result,
  })

  // Get current schedule
  const { data: currentSchedule } = await supabase
    .from("review_schedule")
    .select("*")
    .eq("user_id", user.id)
    .eq("vocabulary_id", vocabularyId)
    .single()

  const currentIndex = currentSchedule?.review_count ?? 0
  const { nextReviewAt, intervalDays, intervalIndex } = calculateNextReview(currentIndex, result)

  // Upsert review schedule
  await supabase
    .from("review_schedule")
    .upsert({
      user_id: user.id,
      vocabulary_id: vocabularyId,
      next_review_at: nextReviewAt.toISOString(),
      interval_days: intervalDays,
      review_count: intervalIndex,
    }, { onConflict: "user_id,vocabulary_id" })

  // Update mastery level on vocabulary
  const masteryDelta = result === "correct" ? 1 : result === "maybe" ? 0 : -1
  await supabase.rpc("update_mastery", {
    p_vocabulary_id: vocabularyId,
    p_delta: masteryDelta,
  })

  return NextResponse.json({
    success: true,
    nextReviewAt: nextReviewAt.toISOString(),
    intervalDays,
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/training/ && git commit -m "feat: training queue and record API endpoints"
```

---

### Task 16: Training UI Components

**Files:** Create `components/training/flashcard.tsx`, `components/training/translation-exercise.tsx`, `components/training/cloze-exercise.tsx`, `components/training/comprehension-exercise.tsx`, `components/training/training-session.tsx`

- [ ] **Step 1: Create flashcard component**

```typescript
"use client"

import { useState } from "react"
import type { TrainingQuestion } from "@/lib/training/types"

export function Flashcard({
  question,
  onAnswer,
}: {
  question: TrainingQuestion
  onAnswer: (result: "correct" | "maybe" | "wrong") => void
}) {
  const [flipped, setFlipped] = useState(false)

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
          <p className="text-faint text-sm mt-8">Tap to reveal meaning</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="bg-white border border-rule rounded-2xl p-12 w-full max-w-md shadow-card-md">
        <p className="text-[10px] font-semibold text-faint tracking-[2px] uppercase mb-3">
          Reading · Vocabulary
        </p>
        <h2 className="font-[family-name:var(--font-display)] italic text-3xl font-bold text-ink mb-1">
          {question.prompt}
        </h2>
        {question.vocabulary.phonetic && (
          <p className="font-mono text-sm text-faint mb-6">{question.vocabulary.phonetic}</p>
        )}
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
          onClick={() => onAnswer("wrong")}
          className="flex-1 bg-white border-2 border-ink text-[#c44] font-bold text-sm py-3 rounded-lg shadow-[4px_4px_0_#d4cfc4] hover:shadow-[6px_6px_0_#d4cfc4] hover:-translate-y-0.5 active:shadow-[2px_2px_0_#d4cfc4] active:translate-y-0.5 transition-all"
        >
          NOPE
        </button>
        <button
          onClick={() => onAnswer("maybe")}
          className="flex-1 bg-white border-2 border-ink text-[#c4a030] font-bold text-sm py-3 rounded-lg shadow-[4px_4px_0_#d4cfc4] hover:shadow-[6px_6px_0_#d4cfc4] hover:-translate-y-0.5 active:shadow-[2px_2px_0_#d4cfc4] active:translate-y-0.5 transition-all"
        >
          HMM...
        </button>
        <button
          onClick={() => onAnswer("correct")}
          className="flex-1 bg-charcoal border-2 border-ink text-gold font-bold text-sm py-3 rounded-lg shadow-[4px_4px_0_#d4cfc4] hover:shadow-[6px_6px_0_#d4cfc4] hover:-translate-y-0.5 active:shadow-[2px_2px_0_#d4cfc4] active:translate-y-0.5 transition-all"
        >
          GOT IT!
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create translation exercise component**

```typescript
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
    // Simple check against correct answer
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
        <p className="text-xl font-semibold text-ink mb-2">Translate to English:</p>
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
            className="w-full border border-rule rounded-lg p-4 text-lg font-medium text-ink focus:outline-none focus:border-charcoal"
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
```

- [ ] **Step 3: Create cloze exercise component**

```typescript
"use client"

import { useState } from "react"
import type { TrainingQuestion } from "@/lib/training/types"

export function ClozeExercise({
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
        <p className="text-[10px] font-semibold text-faint tracking-[2px] uppercase mb-6">
          Reading · Cloze
        </p>
        <p className="text-lg text-body leading-relaxed mb-6 font-medium">
          {question.prompt}
        </p>
        {question.vocabulary.phonetic && (
          <p className="font-mono text-sm text-faint">Hint: {question.vocabulary.phonetic}</p>
        )}
      </div>

      {!submitted ? (
        <>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Fill in the blank..."
            className="w-full border border-rule rounded-lg p-4 text-lg font-medium text-ink focus:outline-none focus:border-charcoal"
          />
          <button
            onClick={handleSubmit}
            className="bg-charcoal text-white font-bold text-sm py-3 px-8 rounded-lg hover:bg-charcoal/90 transition-colors"
          >
            Check answer
          </button>
        </>
      ) : (
        <div className="bg-white border-2 border-ink rounded-xl p-6 w-full text-center shadow-[4px_4px_0_#d4cfc4]">
          <p className="text-xs text-muted mb-1">Correct word:</p>
          <p className="text-2xl font-bold text-ink mb-2">{question.correctAnswer}</p>
          {question.context && (
            <p className="text-sm text-body italic mt-3">{question.context}</p>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create comprehension exercise component**

```typescript
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
```

- [ ] **Step 5: Create training session orchestrator**

```typescript
"use client"

import { useState, useEffect } from "react"
import { Flashcard } from "./flashcard"
import { TranslationExercise } from "./translation-exercise"
import { ClozeExercise } from "./cloze-exercise"
import { ComprehensionExercise } from "./comprehension-exercise"
import { TrainReader } from "@/lib/training/trainer-reader"
import { captureError } from "@/lib/training/error-backlog"
import type { TrainingQuestion, TrainingSessionResult } from "@/lib/training/types"
import type { Vocabulary } from "@/types"

export function TrainingSession() {
  const [questions, setQuestions] = useState<TrainingQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sessionResult, setSessionResult] = useState<TrainingSessionResult | null>(null)
  const [feedback, setFeedback] = useState<"correct" | "maybe" | "wrong" | null>(null)

  const trainer = new TrainReader()

  useEffect(() => {
    fetchQueue()
  }, [])

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

    // Record to API
    await fetch("/api/training/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vocabularyId: question.vocabularyId,
        trainingType: "reading",
        result,
      }),
    })

    // Capture to error backlog if wrong/maybe
    if (result !== "correct") {
      await captureError({
        vocabularyId: question.vocabularyId,
        errorType: "reading",
      })
    }

    // Show feedback briefly
    setFeedback(result)
    setTimeout(() => {
      setFeedback(null)
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1)
      } else {
        setSessionResult({
          totalQuestions: questions.length,
          correct: 0,
          maybe: 0,
          wrong: 0,
          answers: [],
          startedAt: new Date(),
          completedAt: new Date(),
        })
      }
    }, 800)
  }

  if (loading) {
    return <p className="text-faint text-sm text-center py-20">Loading today&apos;s training...</p>
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="font-[family-name:var(--font-display)] italic text-3xl font-bold text-ink mb-2">
          All caught up
        </h2>
        <p className="text-muted text-sm">No words to review today. Import more notes to build your queue.</p>
      </div>
    )
  }

  const question = questions[currentIndex]

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold text-faint tracking-[1.5px] uppercase">Progress</span>
        <div className="flex gap-2 flex-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-sm ${
                i < currentIndex ? "bg-charcoal" : i === currentIndex ? "bg-charcoal" : "bg-rule"
              }`}
            />
          ))}
        </div>
        <span className="font-mono text-xs text-muted">{currentIndex + 1}/{questions.length}</span>
      </div>

      {/* Exercise component based on type */}
      {question.type === "flashcard" && (
        <Flashcard question={question} onAnswer={handleAnswer} />
      )}
      {question.type === "translation" && (
        <TranslationExercise question={question} onAnswer={handleAnswer} />
      )}
      {question.type === "cloze" && (
        <ClozeExercise question={question} onAnswer={handleAnswer} />
      )}
      {question.type === "comprehension" && (
        <ComprehensionExercise question={question} onAnswer={handleAnswer} />
      )}

      {/* Feedback toast */}
      {feedback && (
        <div className={`text-center py-4 rounded-lg font-bold text-lg animate-in fade-in ${
          feedback === "correct" ? "bg-[#fdfaee] text-ink" : "bg-white text-ink"
        }`}>
          {feedback === "correct" ? "💥 POW! Nailed it!" : feedback === "maybe" ? "🤔 HMM... Close!" : "📖 NOPE! It'll come back soon."}
        </div>
      )}

      {/* Session complete */}
      {sessionResult && (
        <div className="text-center py-12 border border-rule rounded-xl bg-white shadow-card-md">
          <h2 className="font-[family-name:var(--font-display)] italic text-3xl font-bold text-ink mb-2">
            Training complete
          </h2>
          <p className="text-muted text-sm mb-6">Great work! Your progress has been saved.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-charcoal text-white font-bold text-sm py-3 px-8 rounded-lg hover:bg-charcoal/90 transition-colors"
          >
            Start new session
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Create training page**

Create `app/(dashboard)/training/page.tsx`:

```typescript
import { TrainingSession } from "@/components/training/training-session"

export default function TrainingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="mb-2">
        <h1 className="font-[family-name:var(--font-display)] italic text-[26px] font-bold text-ink tracking-tight">
          Training
        </h1>
        <p className="text-faint text-sm mt-1">Reading practice · Ebbinghaus schedule</p>
      </div>
      <TrainingSession />
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add components/training/ app/\(dashboard\)/training/ && git commit -m "feat: training UI components — flashcard, translation, cloze, comprehension, session orchestrator"
```

---

### Task 17: Database RPC for Mastery Update

**Files:** Create `supabase/migrations/002_update_mastery.sql`

- [ ] **Step 1: Create mastery update function**

```sql
-- RPC function to safely update mastery level (clamped 0-5)
CREATE OR REPLACE FUNCTION update_mastery(p_vocabulary_id UUID, p_delta INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE vocabulary
  SET mastery_level = GREATEST(0, LEAST(5, mastery_level + p_delta)),
      updated_at = now()
  WHERE id = p_vocabulary_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/002_update_mastery.sql && git commit -m "feat: mastery update RPC function"
```

---

### Task 18: Build Verification

- [ ] **Step 1: Run build**

```bash
npm run build
```

Expected: Successful build with no TypeScript errors.

- [ ] **Step 2: Verify all routes**

| Route | Expected |
|-------|----------|
| `/training` | Training page renders |
| `/api/training/queue?type=reading` | Returns JSON (empty or queue) |
| `/api/training/record` (POST) | 401 without auth |

- [ ] **Step 3: Commit any fixes**

```bash
git add -A && git commit -m "chore: phase 2 build verification"
```

---

## Self-Review

**Spec coverage:**
- [x] Ebbinghaus scheduler engine (INTERVALS, calculateNextReview, calculateErrorRequeue) — Task 11
- [x] Trainer interface for future expansion — Task 12
- [x] TrainReader with 4 question types — Task 13
- [x] Error backlog capture + requeue — Task 14
- [x] Training queue API + record API — Task 15
- [x] UI components (flashcard, translation, cloze, comprehension, session) — Task 16
- [x] Mastery update RPC — Task 17
- [x] Build verification — Task 18
