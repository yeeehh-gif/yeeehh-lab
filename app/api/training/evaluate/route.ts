import { NextResponse } from "next/server"

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || ""
const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"

async function callDeepSeek(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!DEEPSEEK_KEY) throw new Error("DEEPSEEK_API_KEY not configured")

  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_KEY}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek error ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.choices[0].message.content.trim()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { word, correctAnswer, userAnswer, questionType, category, exampleSentence } = body

    if (!userAnswer || !correctAnswer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let systemPrompt = ""
    let userPrompt = ""

    if (category === "writing") {
      // 写作评估：三级评分 + 更优表达
      systemPrompt = `You are an English writing coach. Evaluate the student's answer.
Always respond in this exact JSON format (no markdown, no other text):
{"score":"pass|needs_improvement|fail","feedback":"Your constructive feedback in Chinese (2-3 sentences)","better_expression":"A more natural/idiomatic English version of the student's answer","highlights":["good point or area to improve"]}

Scoring criteria (strict):
- "pass": Grammar is CORRECT and expression is NATURAL/IDIOMATIC. The sentence sounds like something a native speaker would say.
- "needs_improvement": Grammar is CORRECT but expression is AWKWARD/UNNATURAL. The sentence is grammatically valid but sounds stiff, translated, or not idiomatic.
- "fail": Grammar has ERRORS (tense, agreement, word order, missing articles, wrong prepositions, etc.)

CRITICAL: You MUST always provide a "better_expression" field. Never leave it empty.
- If the answer is already perfect (pass): provide a slightly different but equally natural version.
- If the answer is grammatical but awkward (needs_improvement): provide the more natural way a native speaker would say it.
- If the answer has grammar errors (fail): provide the CORRECTED version with proper grammar.
- The better_expression MUST be a real, natural English sentence — never empty.`
      userPrompt = `Task: Write in English
Prompt: ${word}
Reference answer: ${correctAnswer}
Student's answer: ${userAnswer}

Evaluate the answer carefully:
1. Check grammar correctness (tenses, agreement, word order, articles, prepositions, etc.)
2. Check naturalness (does it sound like native English, or is it awkward/translated?)
3. Provide a better_expression that is both grammatically correct and natural-sounding.`
    } else if (category === "speaking") {
      // 口语评估：发音/流利度/自然度 + 更优表达
      systemPrompt = `You are an English speaking coach. Evaluate the student's spoken answer (transcribed from speech).
Always respond in this exact JSON format (no markdown, no other text):
{"score":"pass|needs_improvement|fail","feedback":"Your constructive feedback in Chinese (2-3 sentences)","better_expression":"A more natural/fluent English version of the student's answer","highlights":["good point or area to improve"]}

Scoring criteria:
- "pass": Grammar correct, expression sounds natural AND fluent (like spoken English, not written/formal). Target word used correctly.
- "needs_improvement": Grammar correct but expression sounds stiff, written-style, or awkward when spoken aloud.
- "fail": Grammar errors, or didn't use the target word, or answer is nonsensical.

CRITICAL: Always provide a "better_expression" field — a version that sounds natural when SPOKEN (conversational, not formal written English). If the answer is already perfect, provide a slight variation.`
      userPrompt = `Task: Speak in English
Prompt: ${word}
Reference answer: ${correctAnswer}
Student's spoken answer (speech-to-text transcript): ${userAnswer}

Evaluate the answer:
1. Grammar correctness
2. Naturalness for SPOKEN English (conversational tone, not stiff/formal)
3. Fluency — does it sound like natural speech?
4. Correct use of target word/phrase
5. Provide a better_expression that sounds natural when spoken aloud.`
    } else if (questionType === "comprehension") {
      // 选择题评估保持不变（已经由前端判断）
      systemPrompt = `You evaluate multiple-choice comprehension answers. Respond ONLY with JSON: {"score":"correct|wrong"}`
      userPrompt = `Question: ${word}\nCorrect answer: ${correctAnswer}\nStudent selected: ${userAnswer}\nIs the student correct?`
    } else if (questionType === "translation") {
      // 翻译评估
      systemPrompt = `You are an English teacher evaluating translation exercises. Be encouraging but accurate.
Respond ONLY in this JSON format (no markdown):
{"score":"correct|maybe|wrong","feedback":"Brief Chinese feedback (1-2 sentences)","accepted":true|false}`
      userPrompt = `Target phrase to translate: "${correctAnswer}"
Student's translation: "${userAnswer}"
Correct reference: "${correctAnswer}"

Evaluate if the student's answer matches the meaning. Be flexible — accept:
- Minor spelling mistakes (score: maybe)
- Correct meaning but different wording (score: correct)
- Partial match (score: maybe)
- Completely wrong (score: wrong)`
    } else {
      // 完形填空/flashcard
      systemPrompt = `You evaluate fill-in-the-blank answers. Respond ONLY with JSON: {"score":"correct|maybe|wrong","feedback":"Brief Chinese feedback (1 sentence)"}`
      userPrompt = `Blank to fill: "${correctAnswer}"
Student's answer: "${userAnswer}"
Context sentence: ${exampleSentence || "N/A"}

Evaluate if the student filled the blank correctly. Accept minor case differences as correct.`
    }

    const result = await callDeepSeek(systemPrompt, userPrompt)

    // Parse JSON response
    let jsonStr = result
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.split("\n").slice(1).join("\n")
      if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3)
    }
    if (jsonStr.startsWith("json")) jsonStr = jsonStr.slice(4)
    jsonStr = jsonStr.trim()

    const evaluation = JSON.parse(jsonStr)
    return NextResponse.json(evaluation)
  } catch (err: any) {
    return NextResponse.json(
      { score: "correct", feedback: "", error: err.message },
      { status: 200 } // 降级：出错时默认通过，不阻塞训练
    )
  }
}
