"use client"

import { useState } from "react"

export function PronunciationButton({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false)

  const speak = () => {
    if (!("speechSynthesis" in window)) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-US"
    utterance.rate = 0.85
    utterance.onstart = () => setPlaying(true)
    utterance.onend = () => setPlaying(false)
    utterance.onerror = () => setPlaying(false)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <button
      onClick={speak}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
        playing
          ? "bg-charcoal text-white"
          : "bg-[#f0ede6] text-muted hover:bg-[#e8e4dc] hover:text-ink"
      }`}
      title="Listen to pronunciation"
    >
      {playing ? "Playing..." : "Listen"}
    </button>
  )
}
