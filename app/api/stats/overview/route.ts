import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date().toISOString()

  // Total vocabulary count
  const { count: totalWords } = await supabase
    .from("vocabulary")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  // Words added this week
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const { count: addedThisWeek } = await supabase
    .from("vocabulary")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", weekAgo.toISOString())

  // Today's review count (due today)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { data: dueToday } = await supabase
    .from("review_schedule")
    .select("vocabulary_id")
    .eq("user_id", user.id)
    .lte("next_review_at", now)
    .order("next_review_at")

  // Also count new words (never reviewed)
  const { count: newWords } = await supabase
    .from("vocabulary")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("mastery_level", 0)

  const todayReviewCount = (dueToday?.length || 0) + (newWords || 0)

  // Error backlog count
  const { count: errorCount } = await supabase
    .from("error_backlog")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .lte("next_attempt_at", now)

  // Tomorrow's review count
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(23, 59, 59, 999)
  const { count: tomorrowCount } = await supabase
    .from("review_schedule")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("next_review_at", new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString())
    .lte("next_review_at", tomorrow.toISOString())

  return NextResponse.json({
    totalWords: totalWords || 0,
    addedThisWeek: addedThisWeek || 0,
    todayReview: todayReviewCount,
    errorBacklog: errorCount || 0,
    tomorrowReview: tomorrowCount || 0,
  })
}
