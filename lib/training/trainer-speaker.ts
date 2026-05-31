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
      id: `${vocab.id}-s-sh`, vocabularyId: vocab.id, type: "flashcard",
      prompt: `Read this aloud with correct pronunciation:\n\n"${vocab.example_sentence || vocab.word}"`,
      correctAnswer: vocab.example_sentence || vocab.word,
      vocabulary: vocab,
    }
  }

  private makeScenario(vocab: Vocabulary): TrainingQuestion {
    const scenarios = ["Ordering coffee", "Discussing work", "Asking for directions", "Casual chat with friends", "Business meeting"]
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]
    return {
      id: `${vocab.id}-s-sc`, vocabularyId: vocab.id, type: "comprehension",
      prompt: `Scenario: ${scenario}. Say a natural English sentence using "${vocab.word} (${vocab.definition})".`,
      correctAnswer: vocab.example_sentence || vocab.word,
      vocabulary: vocab,
    }
  }

  private makeTranslateSpeak(vocab: Vocabulary): TrainingQuestion {
    return {
      id: `${vocab.id}-s-ts`, vocabularyId: vocab.id, type: "translation",
      prompt: `See this meaning, say it in English: ${vocab.definition}`,
      correctAnswer: vocab.word,
      vocabulary: vocab,
    }
  }

  evaluateAnswer(question: TrainingQuestion, userResponse: string): "correct" | "maybe" | "wrong" {
    return "correct" // Speaking is self-assessed in text mode
  }

  getHint(question: TrainingQuestion): string {
    return `The word starts with "${question.vocabulary.word.charAt(0)}..." (${question.vocabulary.word.length} letters)`
  }
}
