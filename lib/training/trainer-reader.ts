import type { Trainer, TrainingQuestion } from "./types"
import type { Vocabulary } from "@/types"

export class TrainReader implements Trainer {
  readonly category = "reading" as const

  generateQuestions(vocabulary: Vocabulary[]): TrainingQuestion[] {
    if (vocabulary.length === 0) return []

    const questions: TrainingQuestion[] = []
    const types = ["flashcard", "translation", "cloze", "comprehension"] as const

    // Collect all definitions for use as distractor pool
    const allDefinitions = vocabulary.map((v) => v.definition)

    for (const vocab of vocabulary) {
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
          questions.push(this.makeComprehension(vocab, allDefinitions))
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
      prompt: vocab.definition,
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

  private makeComprehension(vocab: Vocabulary, allDefinitions: string[]): TrainingQuestion {
    const distractors = this.pickDistractors(vocab.definition, allDefinitions, 3)
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

  /**
   * Pick N real definitions from other words as distractors.
   * Prefer definitions that are different from the correct one.
   */
  private pickDistractors(correct: string, pool: string[], count: number): string[] {
    const candidates = pool.filter((d) => d !== correct && d.length > 1)
    const shuffled = this.shuffle(candidates)
    // Take up to 'count' unique distractors
    const unique = [...new Set(shuffled)]
    const result = unique.slice(0, count)
    // If not enough unique ones from pool, add fallback distractors
    while (result.length < count) {
      const fallbacks = [
        "完全相反的意思",
        "容易混淆的近义词",
        "不相关的概念",
      ]
      const fb = fallbacks[result.length % fallbacks.length]
      if (!result.includes(fb)) result.push(fb)
    }
    return result
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
    if (response === correct) return "correct"
    const correctWords = correct.split(/\s+/).filter((w) => w.length > 1)
    const responseWords = response.split(/\s+/).filter((w) => w.length > 1)
    const overlap = correctWords.filter((w) => responseWords.includes(w))
    if (overlap.length >= correctWords.length * 0.7) return "maybe"
    if (overlap.length > 0) return "maybe"
    return "wrong"
  }

  getHint(question: TrainingQuestion): string {
    switch (question.type) {
      case "flashcard":
        return `Starts with "${question.correctAnswer.charAt(0)}..." (${question.correctAnswer.length} chars)`
      case "translation":
        return `The English word starts with "${question.correctAnswer.charAt(0)}..."`
      case "cloze":
        return `The missing word has ${question.correctAnswer.length} letters`
      case "comprehension":
        return `The correct definition is ${question.correctAnswer.length} characters long`
      default:
        return `Try to recall this from memory.`
    }
  }
}
