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
      id: `${vocab.id}-w-tc`, vocabularyId: vocab.id, type: "writing",
      prompt: `Translate to English: ${vocab.definition}`,
      correctAnswer: vocab.example_sentence || `A sentence using "${vocab.word}"`,
      context: `Target word: ${vocab.word}`,
      vocabulary: vocab,
    }
  }

  private makeSentenceBuilder(vocab: Vocabulary): TrainingQuestion {
    return {
      id: `${vocab.id}-w-sb`, vocabularyId: vocab.id, type: "writing",
      prompt: `Write an English sentence using "${vocab.word}"`,
      correctAnswer: vocab.example_sentence || vocab.word,
      vocabulary: vocab,
    }
  }

  private makeThemeWriting(vocab: Vocabulary): TrainingQuestion {
    return {
      id: `${vocab.id}-w-tw`, vocabularyId: vocab.id, type: "writing",
      prompt: `Write 2-3 English sentences about "${vocab.word} (${vocab.definition})"`,
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
