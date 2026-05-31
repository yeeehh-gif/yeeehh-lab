// NotebookLM API client using the notebooklm skill
// In production, this calls the NotebookLM API to fetch notes and content

export interface NotebookLMNoteFull {
  id: string
  title: string
  content: string
  updated_at: string
}

export async function fetchNotebookLMNotes(): Promise<NotebookLMNoteFull[]> {
  return []
}

export async function extractVocabularyFromContent(
  content: string
): Promise<{
  word: string
  definition: string
  category: "reading" | "speaking" | "writing"
}[]> {
  return []
}
