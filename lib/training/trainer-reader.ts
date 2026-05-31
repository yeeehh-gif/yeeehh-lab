import type { Trainer, TrainingQuestion } from "./types"
import type { Vocabulary } from "@/types"

export class TrainReader implements Trainer {
  readonly category = "reading" as const

  generateQuestions(vocabulary: Vocabulary[]): TrainingQuestion[] {
    if (vocabulary.length === 0) return []
    const questions: TrainingQuestion[] = []
    const types = ["flashcard", "translation", "cloze", "comprehension"] as const

    for (const vocab of vocabulary) {
      const type = types[Math.floor(Math.random() * types.length)]
      switch (type) {
        case "flashcard": questions.push(this.makeFlashcard(vocab)); break
        case "translation": questions.push(this.makeTranslation(vocab)); break
        case "cloze": questions.push(this.makeCloze(vocab)); break
        case "comprehension": questions.push(this.makeComprehension(vocab)); break
      }
    }
    return questions
  }

  private makeFlashcard(vocab: Vocabulary): TrainingQuestion {
    return {
      id: `${vocab.id}-fc`, vocabularyId: vocab.id, type: "flashcard",
      prompt: vocab.word, correctAnswer: vocab.definition, vocabulary: vocab,
    }
  }

  private makeTranslation(vocab: Vocabulary): TrainingQuestion {
    return {
      id: `${vocab.id}-tr`, vocabularyId: vocab.id, type: "translation",
      prompt: vocab.definition, correctAnswer: vocab.word, vocabulary: vocab,
    }
  }

  private makeCloze(vocab: Vocabulary): TrainingQuestion {
    const sentence = vocab.example_sentence || `The word "${vocab.word}" is used in context.`
    const blank = sentence.replace(new RegExp(vocab.word, "gi"), "__________")
    return {
      id: `${vocab.id}-cl`, vocabularyId: vocab.id, type: "cloze",
      prompt: blank, correctAnswer: vocab.word, context: sentence, vocabulary: vocab,
    }
  }

  private makeComprehension(vocab: Vocabulary): TrainingQuestion {
    const distractors = [
      "与上下文无关的选项",
      "相反的意思",
      "近义但不同的表达",
    ]
    return {
      id: `${vocab.id}-co`, vocabularyId: vocab.id, type: "comprehension",
      prompt: `What does "${vocab.word}" mean?`,
      correctAnswer: vocab.definition,
      choices: this.shuffle([vocab.definition, ...distractors]),
      vocabulary: vocab,
    }
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
        return `Starts with "${question.correctAnswer.charAt(0)}..." (${question.correctAnswer.length} chars)`
      case "translation":
        return `The English word starts with "${question.correctAnswer.charAt(0)}..."`
      case "cloze":
        return `The missing word has ${question.correctAnswer.length} letters`
      case "comprehension":
        return `The correct definition is ${question.correctAnswer.length} characters long`
    }
  }
}
