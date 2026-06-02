import type { Vocabulary } from "@/types"

export interface TrainingQuestion {
  id: string
  vocabularyId: string
  type: "flashcard" | "translation" | "cloze" | "comprehension" | "writing"
  prompt: string
  correctAnswer: string
  choices?: string[]
  context?: string
  vocabulary: Vocabulary
}

export interface TrainingAnswer {
  questionId: string
  userResponse: string
  result: "correct" | "maybe" | "wrong"
  answeredAt: Date
}

export interface TrainingSessionResult {
  totalQuestions: number
  correct: number
  maybe: number
  wrong: number
  answers: TrainingAnswer[]
  startedAt: Date
  completedAt: Date
}

export interface Trainer {
  readonly category: "reading" | "speaking" | "writing"
  generateQuestions(vocabulary: Vocabulary[]): TrainingQuestion[]
  evaluateAnswer(question: TrainingQuestion, userResponse: string): "correct" | "maybe" | "wrong"
  getHint(question: TrainingQuestion): string
}
