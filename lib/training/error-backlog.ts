import { createClient } from "@/lib/supabase/client"
import { calculateErrorRequeue } from "@/lib/ebbinghaus"
import type { ErrorBacklog } from "@/types"

export async function captureError(params: {
  vocabularyId: string
  errorType: "reading" | "speaking" | "writing"
}): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

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
    if (existing) {
      await supabase.from("error_backlog").delete().eq("id", existing.id)
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
