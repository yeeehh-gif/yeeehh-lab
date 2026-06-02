import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || "reading"
  const limit = parseInt(searchParams.get("limit") || "20")

  const now = new Date().toISOString()

  // Get vocabulary due for review via schedule（按类别过滤）
  const { data: schedule } = await supabase
    .from("review_schedule")
    .select("vocabulary_id, vocabulary!inner(category)")
    .eq("user_id", user.id)
    .eq("vocabulary.category", type)
    .lte("next_review_at", now)
    .order("next_review_at", { ascending: true })
    .limit(limit)

  let vocabularyIds = schedule?.map(s => s.vocabulary_id) || []

  // Also get error backlog items due today
  const { data: errors } = await supabase
    .from("error_backlog")
    .select("vocabulary_id")
    .eq("user_id", user.id)
    .eq("error_type", type)
    .lte("next_attempt_at", now)
    .limit(limit)

  const errorVocabIds = errors?.map(e => e.vocabulary_id) || []
  if (errorVocabIds.length) {
    vocabularyIds = [...vocabularyIds, ...errorVocabIds]
  }

  // Also get new words: mastery=0, not in any schedule, not in error_backlog
  if (vocabularyIds.length < limit) {
    // 查出所有已有排程的词（不限日期），避免 mastery=0 但已有排程的词被重复捞起
    const { data: allScheduled } = await supabase
      .from("review_schedule")
      .select("vocabulary_id")
      .eq("user_id", user.id)

    const scheduledIds = allScheduled?.map(s => s.vocabulary_id) || []
    const excludeIds = [...new Set([...errorVocabIds, ...scheduledIds])]

    let query = supabase
      .from("vocabulary")
      .select("id")
      .eq("user_id", user.id)
      .eq("category", type)
      .eq("mastery_level", 0)
      .limit(limit - vocabularyIds.length)

    if (excludeIds.length) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`)
    }

    const { data: newWords } = await query

    if (newWords) {
      vocabularyIds = [...vocabularyIds, ...newWords.map(w => w.id)]
    }
  }

  // Remove duplicates
  vocabularyIds = [...new Set(vocabularyIds)]

  if (vocabularyIds.length === 0) {
    return NextResponse.json({ queue: [], message: "No words to review today" })
  }

  const { data: vocabulary } = await supabase
    .from("vocabulary")
    .select("*")
    .in("id", vocabularyIds)

  return NextResponse.json({ queue: vocabulary || [] })
}
