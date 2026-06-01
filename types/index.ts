export interface Profile {
  id: string
  display_name: string | null
  daily_goal: number
  created_at: string
}

export interface Vocabulary {
  id: string
  user_id: string
  word: string
  phonetic: string | null
  part_of_speech: string | null
  definition: string
  example_sentence: string | null
  category: "reading" | "speaking" | "writing"
  source_note: string | null
  mastery_level: number
  created_at: string
  updated_at: string
}

export interface TrainingRecord {
  id: string
  user_id: string
  vocabulary_id: string
  training_type: "reading" | "speaking" | "writing"
  result: "correct" | "maybe" | "wrong"
  reviewed_at: string
}

export interface ReviewSchedule {
  id: string
  user_id: string
  vocabulary_id: string
  next_review_at: string
  interval_days: number
  review_count: number
}

export interface ErrorBacklog {
  id: string
  user_id: string
  vocabulary_id: string
  error_type: "reading" | "speaking" | "writing"
  attempts: number
  release_count: number
  next_attempt_at: string
}

export interface ImportSession {
  id: string
  user_id: string
  source: string
  items_found: number
  items_imported: number
  created_at: string
}

// M1 import types
export interface NotebookLMNotebook {
  id: string
  name: string
  source_count: number
  updated_at: string
}

export interface NotebookLMNote {
  id: string
  notebook_id: string
  notebook_name: string
  title: string
  updated_at: string
  word_count: number
}

export interface ExtractedItem {
  word: string
  phonetic?: string
  part_of_speech?: string
  definition: string
  example_sentence?: string
  category: "reading" | "speaking" | "writing"
  source_note?: string
  selected: boolean
}

// Auth form
export interface LoginFormData {
  email: string
  password: string
}
