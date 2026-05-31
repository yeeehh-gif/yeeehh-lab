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

  // Get current schedule state
  const { data: currentSchedule } = await supabase
    .from("review_schedule")
    .select("*")
    .eq("user_id", user.id)
    .eq("vocabulary_id", vocabularyId)
    .maybeSingle()

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

  // Update mastery level
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
