import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { execFile } from "child_process"
import { promisify } from "util"

const execFileAsync = promisify(execFile)

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || ""
const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"

const EXTRACTION_PROMPT = `Extract useful English vocabulary, phrases, and sentence patterns from the text.
For each item, return:
- word: the English word or phrase
- definition: meaning in Simplified Chinese
- example_sentence: the original sentence where it appears
- category: "reading" / "speaking" / "writing"

Only include items worth learning. Skip basic words (the, a, is).
Extract ALL useful vocabulary — no limit on the number of items. Return ONLY a JSON array, no markdown:

[{"word":"ubiquitous","definition":"无处不在的","example_sentence":"The internet has become ubiquitous.","category":"reading"}]

Text:
{text}`

async function extractWithDeepSeek(text: string): Promise<any[]> {
  if (!DEEPSEEK_KEY) throw new Error("DEEPSEEK_API_KEY not configured")

  const prompt = EXTRACTION_PROMPT.replace("{text}", text.slice(0, 50000))
  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_KEY}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are an English teacher. Extract vocabulary from text. Return only valid JSON array." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 16384,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek API ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  let raw = data.choices[0].message.content.trim()
  // Strip markdown fences
  if (raw.startsWith("```")) { raw = raw.split("\n").slice(1).join("\n"); if (raw.endsWith("```")) raw = raw.slice(0, -3) }
  if (raw.startsWith("json")) raw = raw.slice(4)
  raw = raw.trim()

  return JSON.parse(raw)
}

async function importToDb(supabase: any, userId: string, items: any[], source: string) {
  // 1. 去重：查出用户已有词汇，只导入不重复的
  const importWords = items.map(i => i.word.trim().toLowerCase())
  const { data: existing } = await supabase
    .from("vocabulary")
    .select("word")
    .eq("user_id", userId)
    .in("word", importWords.map(w => w.toLowerCase()))

  const existingWords = new Set((existing || []).map((e: any) => e.word.toLowerCase()))
  const newItems = items.filter(i => !existingWords.has(i.word.trim().toLowerCase()))
  const skipped = items.length - newItems.length

  if (newItems.length === 0) {
    await supabase.from("import_sessions").insert({
      user_id: userId, source,
      items_found: items.length, items_imported: 0,
    })
    return { imported: 0, skipped }
  }

  // 2. 插入新词
  const vocab = newItems.map((item: any) => ({
    user_id: userId,
    word: item.word,
    phonetic: item.phonetic || null,
    part_of_speech: item.part_of_speech || null,
    definition: item.definition,
    example_sentence: item.example_sentence || null,
    category: item.category || "reading",
    source_note: item.source_note || source,
    mastery_level: 0,
  }))

  const { data, error } = await supabase.from("vocabulary").insert(vocab).select("id")
  if (error) throw new Error(error.message)

  await supabase.from("import_sessions").insert({
    user_id: userId, source,
    items_found: items.length,
    items_imported: data?.length || newItems.length,
  })

  return { imported: data?.length || newItems.length, skipped }
}

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()

  // Mode: NotebookLM sources → DeepSeek extraction
  if (body.sources) {
    try {
      const sources = body.sources as { notebookId: string; sourceId: string; title: string; notebookName: string }[]
      const allItems: any[] = []

      for (const src of sources) {
        try {
          const { stdout } = await execFileAsync("notebooklm", [
            "source", "fulltext", src.sourceId, "-n", src.notebookId, "--json",
          ], { timeout: 30000, env: process.env })

          const data = JSON.parse(stdout)
          const content = data.content || ""
          if (content.length < 100) continue

          const items = await extractWithDeepSeek(content)
          for (const item of items) {
            item.source_note = src.notebookName || data.title || src.title
          }
          allItems.push(...items)
        } catch (e: any) {
          console.error(`Failed source ${src.sourceId}:`, e.message)
        }
      }

      if (allItems.length === 0) {
        return NextResponse.json({ error: "No vocabulary could be extracted. Try pasting text directly." }, { status: 400 })
      }

      const result = await importToDb(supabase, user.id, allItems, "notebooklm")
      return NextResponse.json({ extracted: allItems, ...result })
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  // Mode: Paste text → DeepSeek extraction
  if (body.text) {
    try {
      const items = await extractWithDeepSeek(body.text)
      const result = await importToDb(supabase, user.id, items, "paste")
      return NextResponse.json({ extracted: items, ...result })
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  // Mode: Direct import from review list
  if (body.items) {
    try {
      const result = await importToDb(supabase, user.id, body.items, "notebooklm")
      return NextResponse.json({ ...result })
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  return NextResponse.json({ error: "Invalid request. Send { text } or { items }" }, { status: 400 })
}
