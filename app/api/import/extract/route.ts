import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { items } = await request.json()

  const vocabulary = items.map((item: any) => ({
    user_id: user.id,
    word: item.word,
    phonetic: item.phonetic || null,
    part_of_speech: item.part_of_speech || null,
    definition: item.definition,
    example_sentence: item.example_sentence || null,
    category: item.category,
    source_note: item.source_note || null,
    mastery_level: 0,
  }))

  const { data, error } = await supabase
    .from("vocabulary")
    .insert(vocabulary)
    .select("id")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from("import_sessions").insert({
    user_id: user.id,
    source: "notebooklm",
    items_found: items.length,
    items_imported: data.length,
  })

  return NextResponse.json({ imported: data.length })
}
