"use client"

/**
 * 训练反馈卡片 — 支持 writing 专属三级评分和通用 correct/maybe/wrong 评分
 *
 * Writing 评分体系（按 category 区分）:
 * - pass:             语法正确 + 表达自然 → 通过
 * - needs_improvement: 语法正确 + 表达不自然 → 还需要努力
 * - fail:             语法不正确 → 不通
 *
 * 每个 writing 评估都附带 betterExpression（AI 的更优表达建议）
 */
export function FeedbackCard({
  feedback,
  aiScore,
  aiFeedback,
  aiCorrection,
  betterExpression,
  category,
  onNext,
}: {
  feedback: "correct" | "maybe" | "wrong"
  aiScore: "pass" | "needs_improvement" | "fail" | null
  aiFeedback: string
  aiCorrection: string
  betterExpression: string
  category: string
  onNext: () => void
}) {
  const isWritingOrSpeaking = category === "writing" || category === "speaking"

  const getScoreMeta = () => {
    if (isWritingOrSpeaking) {
      // Writing/Speaking 专属三级评分
      if (aiScore === "pass") {
        return { label: "通过！", sub: "语法正确，表达自然", bg: "bg-green-50", border: "border-green-600", text: "text-green-800" }
      }
      if (aiScore === "needs_improvement") {
        return { label: "还需要努力", sub: "语法正确但表达不够自然", bg: "bg-amber-50", border: "border-amber-500", text: "text-amber-800" }
      }
      if (aiScore === "fail") {
        return { label: "不通", sub: "语法有误，需要多加练习", bg: "bg-red-50", border: "border-red-500", text: "text-red-800" }
      }
      // AI 未返回时用本地评估兜底
      if (feedback === "correct") {
        return { label: "通过！", sub: "语法正确，表达自然", bg: "bg-green-50", border: "border-green-600", text: "text-green-800" }
      }
      if (feedback === "maybe") {
        return { label: "还需要努力", sub: "语法正确但表达不够自然", bg: "bg-amber-50", border: "border-amber-500", text: "text-amber-800" }
      }
      return { label: "不通", sub: "语法有误，需要多加练习", bg: "bg-red-50", border: "border-red-500", text: "text-red-800" }
    }

    // 非写作的通用展示
    if (feedback === "correct") {
      return { label: "POW! Nailed it!", sub: "", bg: "bg-[#fdfaee]", border: "border-ink", text: "text-ink" }
    }
    if (feedback === "maybe") {
      return { label: "HMM... Close!", sub: "", bg: "bg-white", border: "border-ink", text: "text-ink" }
    }
    return { label: "NOPE! It'll come back soon.", sub: "", bg: "bg-white", border: "border-ink", text: "text-ink" }
  }

  const meta = getScoreMeta()

  return (
    <div className={`py-4 px-6 rounded-lg ${meta.bg} border-2 ${meta.border} shadow-[3px_3px_0_#d4cfc4]`}>
      <p className={`font-bold text-lg mb-0.5 ${meta.text}`}>
        {meta.label}
      </p>
      {meta.sub && (
        <p className="text-xs text-faint mb-2">{meta.sub}</p>
      )}

      {/* AI 中文反馈 */}
      {aiFeedback && (
        <p className="text-sm text-body mb-2 leading-relaxed">{aiFeedback}</p>
      )}

      {/* Writing/Speaking 更优表达 — 始终展示 */}
      {isWritingOrSpeaking && betterExpression && (
        <div className="bg-white/60 border border-rule rounded-lg p-3 mb-3">
          <p className="text-[10px] font-semibold text-faint tracking-[1px] uppercase mb-1">
            Better expression
          </p>
          <p className="text-sm text-ink leading-relaxed italic">
            {betterExpression}
          </p>
        </div>
      )}

      {/* 非写作的通用 suggestion */}
      {!isWritingOrSpeaking && aiCorrection && (
        <p className="text-sm text-accent-brand mb-3 leading-relaxed italic">
          Suggestion: {aiCorrection}
        </p>
      )}

      <button
        onClick={onNext}
        className="bg-charcoal text-white font-bold text-sm py-2 px-8 rounded-md hover:bg-charcoal/90 transition-colors"
      >
        Next →
      </button>
    </div>
  )
}
