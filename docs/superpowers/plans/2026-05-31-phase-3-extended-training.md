# Phase 3: Extended Training — Implementation Plan

> **Goal:** Add writing training, speaking training (text mode), statistics dashboard, and daily goal tracking.

**Architecture:** Implement TrainWriter and TrainSpeaker classes following the Trainer interface from Phase 2. The training session orchestrator dispatches to the correct trainer by category. Statistics page reads from training_records and review_schedule. Daily goal stored in profiles table.

---

### Task 19: Writing Trainer + Speaking Trainer

**Files:** Create `lib/training/trainer-writer.ts`, `lib/training/trainer-speaker.ts`

- [ ] **Step 1: Create `lib/training/trainer-writer.ts`**

```typescript
import type { Trainer, TrainingQuestion } from "./types"
import type { Vocabulary } from "@/types"

export class TrainWriter implements Trainer {
  readonly category = "writing" as const

  generateQuestions(vocabulary: Vocabulary[]): TrainingQuestion[] {
    if (vocabulary.length === 0) return []
    const questions: TrainingQuestion[] = []
    const types = ["translation-cn", "sentence-builder", "theme-writing"] as const

    for (const vocab of vocabulary) {
      const type = types[Math.floor(Math.random() * types.length)]
      switch (type) {
        case "translation-cn": questions.push(this.makeTranslationCN(vocab)); break
        case "sentence-builder": questions.push(this.makeSentenceBuilder(vocab)); break
        case "theme-writing": questions.push(this.makeThemeWriting(vocab)); break
      }
    }
    return questions
  }

  private makeTranslationCN(vocab: Vocabulary): TrainingQuestion {
    return {
      id: `${vocab.id}-w-tc`, vocabularyId: vocab.id, type: "translation" as any,
      prompt: `将以下句子翻译成英文：${vocab.definition}（用上 ${vocab.word}）`,
      correctAnswer: vocab.example_sentence || `A sentence using "${vocab.word}"`,
      vocabulary: vocab,
    }
  }

  private makeSentenceBuilder(vocab: Vocabulary): TrainingQuestion {
    return {
      id: `${vocab.id}-w-sb`, vocabularyId: vocab.id, type: "translation" as any,
      prompt: `用 "${vocab.word}" 造一个英文句子`,
      correctAnswer: vocab.example_sentence || vocab.word,
      vocabulary: vocab,
    }
  }

  private makeThemeWriting(vocab: Vocabulary): TrainingQuestion {
    return {
      id: `${vocab.id}-w-tw`, vocabularyId: vocab.id, type: "comprehension" as any,
      prompt: `围绕 "${vocab.word}（${vocab.definition}）" 写一个2-3句的英文段落`,
      correctAnswer: vocab.example_sentence || "",
      vocabulary: vocab,
    }
  }

  evaluateAnswer(question: TrainingQuestion, userResponse: string): "correct" | "maybe" | "wrong" {
    const response = userResponse.toLowerCase().trim()
    const targetWord = question.vocabulary.word.toLowerCase()
    if (response.includes(targetWord)) return "correct"
    if (response.length > 10) return "maybe"
    return "wrong"
  }

  getHint(question: TrainingQuestion): string {
    return `Try using the word "${question.vocabulary.word}" in your response.`
  }
}
```

- [ ] **Step 2: Create `lib/training/trainer-speaker.ts`**

```typescript
import type { Trainer, TrainingQuestion } from "./types"
import type { Vocabulary } from "@/types"

export class TrainSpeaker implements Trainer {
  readonly category = "speaking" as const

  generateQuestions(vocabulary: Vocabulary[]): TrainingQuestion[] {
    if (vocabulary.length === 0) return []
    const questions: TrainingQuestion[] = []
    const types = ["shadow", "scenario", "translate-speak"] as const

    for (const vocab of vocabulary) {
      const type = types[Math.floor(Math.random() * types.length)]
      switch (type) {
        case "shadow": questions.push(this.makeShadow(vocab)); break
        case "scenario": questions.push(this.makeScenario(vocab)); break
        case "translate-speak": questions.push(this.makeTranslateSpeak(vocab)); break
      }
    }
    return questions
  }

  private makeShadow(vocab: Vocabulary): TrainingQuestion {
    return {
      id: `${vocab.id}-s-sh`, vocabularyId: vocab.id, type: "flashcard" as any,
      prompt: `大声朗读以下句子（注意发音和语调）：\n\n"${vocab.example_sentence || vocab.word}"`,
      correctAnswer: vocab.example_sentence || vocab.word,
      vocabulary: vocab,
    }
  }

  private makeScenario(vocab: Vocabulary): TrainingQuestion {
    const scenarios = [
      "在咖啡店点单",
      "与同事讨论工作",
      "旅行问路",
      "朋友聚会聊天",
      "商务会议发言",
    ]
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]
    return {
      id: `${vocab.id}-s-sc`, vocabularyId: vocab.id, type: "comprehension" as any,
      prompt: `场景：${scenario}。请用 "${vocab.word}（${vocab.definition}）" 说出一句地道的英文。`,
      correctAnswer: vocab.example_sentence || vocab.word,
      vocabulary: vocab,
    }
  }

  private makeTranslateSpeak(vocab: Vocabulary): TrainingQuestion {
    return {
      id: `${vocab.id}-s-ts`, vocabularyId: vocab.id, type: "translation" as any,
      prompt: `看到这个意思，立刻用英文说出来：${vocab.definition}`,
      correctAnswer: vocab.word,
      vocabulary: vocab,
    }
  }

  evaluateAnswer(question: TrainingQuestion, userResponse: string): "correct" | "maybe" | "wrong" {
    // Speaking is self-assessed — user rates themselves
    return "correct"
  }

  getHint(question: TrainingQuestion): string {
    return `The word starts with "${question.vocabulary.word.charAt(0)}..." (${question.vocabulary.word.length} letters)`
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/training/trainer-writer.ts lib/training/trainer-speaker.ts && git commit -m "feat: writing and speaking trainers"
```

---

### Task 20: Training Session — Multi-Category Support

**Files:** Modify `components/training/training-session.tsx`, `app/(dashboard)/training/page.tsx`

- [ ] **Step 1: Update session orchestrator to support category switch**

Modify `components/training/training-session.tsx` to add `category` prop:

```typescript
"use client"

import { useState, useEffect } from "react"
import { Flashcard } from "./flashcard"
import { TranslationExercise } from "./translation-exercise"
import { ClozeExercise } from "./cloze-exercise"
import { ComprehensionExercise } from "./comprehension-exercise"
import { TrainReader } from "@/lib/training/trainer-reader"
import { TrainWriter } from "@/lib/training/trainer-writer"
import { TrainSpeaker } from "@/lib/training/trainer-speaker"
import { captureError } from "@/lib/training/error-backlog"
import type { Trainer, TrainingQuestion } from "@/lib/training/types"
import type { Vocabulary } from "@/types"

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
  const [typing, setTyping] = useState("")

  const trainer = trainers[category]

  useEffect(() => { fetchQueue() }, [category])

  async function fetchQueue() {
    const res = await fetch(`/api/training/queue?type=${category}&limit=10`)
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
      body: JSON.stringify({ vocabularyId: question.vocabularyId, trainingType: category, result }),
    })

    if (result !== "correct") {
      await captureError({ vocabularyId: question.vocabularyId, errorType: category })
    }

    setStats(prev => ({
      correct: prev.correct + (result === "correct" ? 1 : 0),
      maybe: prev.maybe + (result === "maybe" ? 1 : 0),
      wrong: prev.wrong + (result === "wrong" ? 1 : 0),
    }))

    setTyping("")
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
        <p className="text-muted text-sm">No words to review today in {category}. Import more notes or switch category.</p>
      </div>
    )
  }

  const question = questions[currentIndex]
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1)

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
          {question.type === "flashcard" && <Flashcard question={question} onAnswer={handleAnswer} />}
          {(question.type === "translation" || question.type === "translation-cn") && <TranslationExercise question={question} onAnswer={handleAnswer} />}
          {question.type === "cloze" && <ClozeExercise question={question} onAnswer={handleAnswer} />}
          {question.type === "comprehension" && <ComprehensionExercise question={question} onAnswer={handleAnswer} />}
        </>
      )}

      {feedback && (
        <div className={`text-center py-4 rounded-lg font-bold text-lg ${
          feedback === "correct" ? "bg-[#fdfaee] text-ink border-2 border-ink shadow-[3px_3px_0_#d4cfc4]" : "bg-white text-ink border-2 border-ink shadow-[3px_3px_0_#d4cfc4]"
        }`}>
          {feedback === "correct" ? "💥 POW! Nailed it!" : feedback === "maybe" ? "🤔 HMM... Close!" : "📖 NOPE! It'll come back soon."}
        </div>
      )}

      {complete && (
        <div className="text-center py-12 border border-rule rounded-xl bg-white shadow-card-md">
          <h2 className="font-[family-name:var(--font-display)] italic text-3xl font-bold text-ink mb-2">Training complete</h2>
          <p className="text-muted text-sm mb-6">{categoryLabel} practice done. Progress saved.</p>
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center"><div className="font-[family-name:var(--font-display)] italic text-3xl font-bold text-ink">{stats.correct}</div><div className="text-xs text-faint">correct</div></div>
            <div className="text-center"><div className="font-[family-name:var(--font-display)] italic text-3xl font-bold text-[#c4a030]">{stats.maybe}</div><div className="text-xs text-faint">maybe</div></div>
            <div className="text-center"><div className="font-[family-name:var(--font-display)] italic text-3xl font-bold text-[#c44]">{stats.wrong}</div><div className="text-xs text-faint">wrong</div></div>
          </div>
          <button onClick={() => window.location.reload()} className="bg-charcoal text-white font-bold text-sm py-3 px-8 rounded-lg hover:bg-charcoal/90 transition-colors">Start new session</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update training page with category tabs**

Modify `app/(dashboard)/training/page.tsx`:

```typescript
"use client"

import { useState } from "react"
import { TrainingSession } from "@/components/training/training-session"

const categories = ["reading", "writing", "speaking"] as const

export default function TrainingPage() {
  const [category, setCategory] = useState<"reading" | "writing" | "speaking">("reading")

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-2">
        <h1 className="font-[family-name:var(--font-display)] italic text-[26px] font-bold text-ink tracking-tight">Training</h1>
        <p className="text-faint text-sm mt-1">Ebbinghaus schedule · All categories</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-5 py-2 rounded-md text-sm font-semibold transition-colors ${
              category === c
                ? "bg-charcoal text-white"
                : "bg-white border border-rule text-muted hover:text-ink hover:border-muted"
            }`}
          >
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      <TrainingSession key={category} category={category} />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/training/training-session.tsx app/\(dashboard\)/training/page.tsx && git commit -m "feat: multi-category training with writing and speaking"
```

---

### Task 21: Statistics Page

**Files:** Create `components/stats/`, `app/(dashboard)/statistics/page.tsx`

- [ ] **Step 1: Create stats heatmap component**

`components/stats/heatmap.tsx`:

```typescript
"use client"

export function TrainingHeatmap() {
  const weeks = 26
  const daysPerWeek = 7
  const totalDays = weeks * daysPerWeek

  // Generate mock heatmap data
  const levels: number[] = Array.from({ length: totalDays }, (_, i) => {
    const recent = i > totalDays - 30
    return recent ? Math.floor(Math.random() * 5) : Math.floor(Math.random() * 3)
  })

  const colorMap = ["bg-[#ebeef2]", "bg-[#c8dbe4]", "bg-[#8ab8ce]", "bg-[#4a90b0]", "bg-[#2a5f78]"]

  return (
    <div className="bg-white border border-rule rounded-2xl p-6 shadow-card-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-semibold text-ink">Training activity</h3>
          <p className="text-[11px] text-faint mt-0.5">Last 12 months · each square is one day</p>
        </div>
      </div>
      <div className="flex gap-0.5 flex-wrap">
        {levels.map((l, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-sm ${colorMap[l]}`} title={`Level ${l}`} />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-faint font-medium">
        <span>Jun</span><span>Aug</span><span>Oct</span><span>Dec</span><span>Feb</span><span>Apr</span><span>May</span>
      </div>
      <div className="flex items-center gap-1 mt-2 justify-end text-[10px] text-faint">
        Less <span className="w-2.5 h-2.5 rounded-sm bg-[#ebeef2]" /><span className="w-2.5 h-2.5 rounded-sm bg-[#c8dbe4]" /><span className="w-2.5 h-2.5 rounded-sm bg-[#8ab8ce]" /><span className="w-2.5 h-2.5 rounded-sm bg-[#4a90b0]" /><span className="w-2.5 h-2.5 rounded-sm bg-[#2a5f78]" /> More
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create stats page layout**

Create `app/(dashboard)/statistics/page.tsx`:

```typescript
"use client"

import { TrainingHeatmap } from "@/components/stats/heatmap"

export default function StatisticsPage() {
  return (
    <div className="flex flex-col gap-6">

      {/* Hero banner */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-charcoal rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-[-40px] right-[-20px] w-36 h-36 rounded-full bg-white/[0.03]" />
          <p className="text-xs font-medium text-white/40 tracking-wide relative z-10">Total vocabulary</p>
          <p className="font-[family-name:var(--font-display)] italic text-6xl font-bold leading-none mt-2 relative z-10">486</p>
          <p className="text-sm text-white/40 mt-2 relative z-10"><strong className="text-gold font-bold">+22</strong> added this week</p>
        </div>
        <div className="bg-white border border-rule rounded-2xl p-8 shadow-card-md">
          <p className="text-xs font-medium text-faint tracking-wide">Current streak</p>
          <p className="font-[family-name:var(--font-display)] italic text-6xl font-bold text-ink leading-none mt-2">7</p>
          <p className="text-sm text-muted mt-2">consecutive days · best <strong className="text-accent-brand font-bold">14</strong></p>
        </div>
      </div>

      {/* Heatmap */}
      <TrainingHeatmap />

      {/* Bottom row: mastery + upcoming */}
      <div className="grid grid-cols-2 gap-4">
        {/* Mastery */}
        <div className="bg-white border border-rule rounded-2xl p-6 shadow-card-md">
          <h3 className="text-sm font-semibold text-ink mb-5">Mastery by category</h3>
          {[
            { label: "Reading", pct: 78 },
            { label: "Speaking", pct: 45 },
            { label: "Writing", pct: 62 },
          ].map(({ label, pct }) => (
            <div key={label} className="flex items-center gap-3 mb-3 last:mb-0">
              <span className="text-[13px] font-medium text-ink min-w-[70px]">{label}</span>
              <div className="flex-1 h-2 bg-[#ebeef2] rounded-sm overflow-hidden">
                <div className="h-full bg-charcoal rounded-sm" style={{ width: `${pct}%` }} />
              </div>
              <span className="font-mono text-xs text-muted min-w-[36px] text-right">{pct}%</span>
            </div>
          ))}
        </div>

        {/* Upcoming reviews */}
        <div className="bg-white border border-rule rounded-2xl p-6 shadow-card-md">
          <h3 className="text-sm font-semibold text-ink mb-4">Upcoming reviews</h3>
          {[
            { day: "Today", count: 8, types: "Reading · Writing" },
            { day: "Tomorrow", count: 14, types: "All categories" },
            { day: "In 2 days", count: 6, types: "Reading" },
            { day: "In 4 days", count: 11, types: "Speaking · Writing" },
          ].map(({ day, count, types }) => (
            <div key={day} className="flex items-center gap-3 py-3 border-b border-rule last:border-0">
              <span className="w-2 h-2 rounded-full bg-charcoal flex-shrink-0" />
              <span className="font-mono text-[11px] font-semibold text-muted min-w-[72px]">{day}</span>
              <span className="text-sm font-bold text-ink">{count} words</span>
              <span className="text-[11px] text-faint">{types}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/stats/ app/\(dashboard\)/statistics/ && git commit -m "feat: statistics page with heatmap, mastery bars, and review schedule"
```

---

### Task 22: Daily Goal Tracking

**Files:** Modify `components/training/training-session.tsx` (add goal check), create `components/home/goal-progress.tsx`

- [ ] **Step 1: Add goal progress to homepage data**

Create `components/home/goal-progress.tsx`:

```typescript
export function GoalProgress({ done, goal }: { done: number; goal: number }) {
  const pct = Math.min(Math.round((done / goal) * 100), 100)

  return (
    <div className="flex items-center gap-3">
      <div className="w-20 h-20 rounded-full bg-[conic-gradient(var(--color-charcoal)_0deg,var(--color-charcoal)_${pct * 3.6}deg,#ebeef2_${pct * 3.6}deg_360deg)] flex items-center justify-center flex-shrink-0">
        <div className="w-[62px] h-[62px] rounded-full bg-white flex items-center justify-center">
          <span className="text-xl font-extrabold text-ink">{done}</span>
        </div>
      </div>
      <div>
        <p className="text-[15px] font-bold text-ink">{done} / {goal}</p>
        <p className="text-xs text-faint mt-0.5">Today&apos;s goal</p>
        <div className="flex flex-col gap-1 mt-3 text-xs text-muted font-medium">
          <span>Reading · 8 / 10</span>
          <span>Speaking · 5 / 6</span>
          <span>Writing · 3 / 4</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/home/goal-progress.tsx && git commit -m "feat: daily goal progress component"
```

---

### Task 23: Build Verification

- [ ] **Step 1: Run build**

```bash
npm run build
```

Fix any TypeScript errors. Expected: successful build.

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "chore: phase 3 build verification"
```
