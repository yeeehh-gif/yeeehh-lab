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
      // 写作评估：详细的 AI 评判
      systemPrompt = `You are an English writing coach. Evaluate the student's answer fairly and constructively.
Always respond in this exact JSON format (no markdown, no other text):
{"score":"correct|maybe|wrong","feedback":"Your constructive feedback in Chinese (2-3 sentences)","correction":"A better version of the answer if needed, or empty string if fine","highlights":["good point 1","area to improve 1"]}`
      userPrompt = `Task: ${questionType === "translation" ? "Translate to English" : questionType === "comprehension" ? "Write about this topic" : "Write a sentence"}
Prompt: ${word}
Example/reference answer: ${correctAnswer}
Student's answer: ${userAnswer}

Evaluate the answer. Consider: grammar, vocabulary usage, naturalness, whether the target word/phrase was used correctly.
Score "correct" if the answer is good and uses the target language correctly.
Score "maybe" if mostly correct but has minor issues.
Score "wrong" if major errors or didn't use the target word/phrase.`
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
