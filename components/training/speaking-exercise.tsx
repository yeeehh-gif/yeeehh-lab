"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { TrainingQuestion } from "@/lib/training/types"

// Web Speech API 类型声明（浏览器自带，无需 npm 包）
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  [index: number]: SpeechRecognitionAlternative
}
interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}
interface SpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}
declare var SpeechRecognition: {
  new (): SpeechRecognition
}
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

export function SpeakingExercise({
  question,
  onAnswer,
}: {
  question: TrainingQuestion
  onAnswer: (result: "correct" | "maybe" | "wrong", userAnswer?: string) => void
}) {
  const [mode, setMode] = useState<"voice" | "text">("voice")
  const [textInput, setTextInput] = useState("")
  const [transcript, setTranscript] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [answer, setAnswer] = useState("")

  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null)
  const listeningRef = useRef(false) // 用于 onend 闭包读取最新状态
  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)

  // 初始化语音识别
  const getRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return null
    const rec = new SR()
    rec.lang = "en-US"
    rec.interimResults = true
    rec.continuous = true
    rec.maxAlternatives = 1

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ""
      let final = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        if (r.isFinal) final += r[0].transcript + " "
        else interim += r[0].transcript
      }
      setTranscript(prev => {
        const base = prev.replace(/\.\.\..*$/, "")
        return (base + final + (interim ? "..." + interim : "")).trim()
      })
    }

    rec.onerror = (event: Event) => {
      const e = event as SpeechRecognitionErrorEvent
      // 忽略静默和中断错误，不停止监听
      if (e.error === "no-speech" || e.error === "aborted") return
      console.warn("Speech recognition error:", e.error)
    }

    rec.onend = () => {
      // 自动续播：用户未手动停止时，silence 超时后自动重启识别
      // 通过 recognitionRef 判断是否还在监听状态
      if (recognitionRef.current && listeningRef.current) {
        try { rec.start() } catch { /* 已在运行则忽略 */ }
      }
    }

    recognitionRef.current = rec
    return rec
  }, [])

  // 清理
  useEffect(() => {
    return () => {
      listeningRef.current = false
      recognitionRef.current?.abort()
    }
  }, [])

  // 切换 mode 时重置
  function switchMode(m: "voice" | "text") {
    if (isListening) {
      listeningRef.current = false
      recognitionRef.current?.stop()
    }
    setMode(m)
    setTranscript("")
    setTextInput("")
  }

  // Voice: 开始/停止录音
  function toggleListening() {
    const rec = getRecognition()
    if (!rec) return
    if (isListening) {
      listeningRef.current = false
      rec.stop()
      setIsListening(false)
    } else {
      listeningRef.current = true
      setTranscript("")
      rec.start()
      setIsListening(true)
    }
  }

  // 提交
  function handleSubmit() {
    const userAnswer = mode === "voice"
      ? transcript.replace(/\.\.\..*$/, "").trim()  // 去掉 trailing interim
      : textInput.trim()
    if (!userAnswer) return

    const targetWord = question.vocabulary.word.toLowerCase()
    const response = userAnswer.toLowerCase()
    let result: "correct" | "maybe" | "wrong" = "wrong"
    if (response.includes(targetWord)) {
      result = response.length > 20 ? "correct" : "maybe"
    } else if (response.length > 10) {
      result = "maybe"
    }

    setAnswer(userAnswer)
    setSubmitted(true)
    onAnswer(result, userAnswer)
  }

  // 不支持时自动切到 text
  useEffect(() => {
    if (!isSupported) setMode("text")
  }, [isSupported])

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
        <div className="bg-white border border-rule rounded-2xl p-10 w-full shadow-card-md text-center">
          <p className="text-[10px] font-semibold text-faint tracking-[2px] uppercase mb-4">
            Speaking · Practice
          </p>
          <p className="text-sm font-medium text-muted mb-3">{question.prompt}</p>
          <p className="font-[family-name:var(--font-display)] italic text-2xl font-bold text-ink">
            {question.vocabulary.word}
          </p>
        </div>
        <div className="bg-[#fdfaee] border-2 border-ink rounded-xl p-6 w-full text-center shadow-[4px_4px_0_#d4cfc4]">
          <p className="text-xs text-muted mb-1">Your answer:</p>
          <p className="text-lg font-semibold text-ink mb-3 whitespace-pre-wrap">{answer}</p>
          <p className="text-xs text-muted mb-1">Reference:</p>
          <p className="text-base text-ink/70 italic">{question.correctAnswer}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {/* 题目卡片 */}
      <div className="bg-white border border-rule rounded-2xl p-10 w-full shadow-card-md text-center">
        <p className="text-[10px] font-semibold text-faint tracking-[2px] uppercase mb-4">
          Speaking · Practice
        </p>
        <p className="text-sm font-medium text-muted mb-3 whitespace-pre-line">{question.prompt}</p>
        <p className="font-[family-name:var(--font-display)] italic text-2xl font-bold text-ink">
          {question.vocabulary.word}
        </p>
        <p className="text-xs text-muted mt-1">{question.vocabulary.definition}</p>
      </div>

      {/* 模式切换 */}
      <div className="flex gap-1 bg-[#f2f5f8] rounded-lg p-1">
        <button
          onClick={() => switchMode("voice")}
          className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
            mode === "voice" ? "bg-charcoal text-white" : "text-muted hover:text-ink"
          }`}
        >
          🎤 Voice
        </button>
        <button
          onClick={() => switchMode("text")}
          className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
            mode === "text" ? "bg-charcoal text-white" : "text-muted hover:text-ink"
          }`}
        >
          ⌨️ Text
        </button>
      </div>

      {/* Voice 模式 */}
      {mode === "voice" && (
        <div className="w-full flex flex-col items-center gap-4">
          {!isSupported && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              Speech recognition not supported in this browser. Switching to Text mode.
            </p>
          )}

          <button
            onClick={toggleListening}
            disabled={!isSupported}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all text-2xl border-2 ${
              isListening
                ? "bg-red-50 border-red-400 animate-pulse shadow-[0_0_20px_rgba(255,0,0,0.2)]"
                : "bg-white border-rule hover:border-charcoal shadow-card-md"
            } disabled:opacity-30 disabled:cursor-not-allowed`}
            title={isListening ? "Stop recording" : "Start recording"}
          >
            🎤
          </button>

          {isListening && (
            <p className="text-xs text-red-500 font-medium animate-pulse">Recording...</p>
          )}

          <div className={`w-full min-h-[80px] border border-rule rounded-lg p-4 bg-white ${
            isListening ? "border-red-300" : ""
          }`}>
            {transcript ? (
              <p className="text-lg text-ink whitespace-pre-wrap">{transcript}</p>
            ) : (
              <p className="text-muted text-sm italic">
                {isListening ? "Speak now..." : "Tap the microphone and speak in English"}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Text 模式 */}
      {mode === "text" && (
        <>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault(); handleSubmit()
              }
            }}
            placeholder="Type what you would say..."
            rows={4}
            className="w-full border border-rule rounded-lg p-4 text-lg font-medium text-ink focus:outline-none focus:border-charcoal bg-white resize-none"
          />
          <p className="text-[10px] text-faint -mt-4">
            Press Cmd+Enter to submit
          </p>
        </>
      )}

      {/* 提交按钮 */}
      <button
        onClick={handleSubmit}
        disabled={
          mode === "voice" ? !transcript.trim() : !textInput.trim()
        }
        className="bg-charcoal text-white font-bold text-sm py-3 px-8 rounded-lg hover:bg-charcoal/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Submit answer
      </button>
    </div>
  )
}
