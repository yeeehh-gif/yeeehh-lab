/**
 * Ebbinghaus forgetting curve intervals (in days).
 */
const INTERVALS = [1, 2, 4, 7, 15, 30]

export interface ScheduleResult {
  nextReviewAt: Date
  intervalDays: number
  intervalIndex: number
}

export function calculateNextReview(
  currentIntervalIndex: number,
  result: "correct" | "maybe" | "wrong",
  now: Date = new Date()
): ScheduleResult {
  let nextIndex: number
  switch (result) {
    case "correct":
      nextIndex = Math.min(currentIntervalIndex + 1, INTERVALS.length - 1)
      break
    case "maybe":
      nextIndex = Math.max(currentIntervalIndex - 1, 0)
      break
    case "wrong":
      nextIndex = 0
      break
  }
  const intervalDays = INTERVALS[nextIndex]
  const nextReviewAt = new Date(now)
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays)
  nextReviewAt.setHours(0, 0, 0, 0)
  return { nextReviewAt, intervalDays, intervalIndex: nextIndex }
}

const ERROR_INTERVALS = [1, 2]

export function calculateErrorRequeue(
  currentAttempts: number,
  now: Date = new Date()
): { nextAttemptAt: Date; attempts: number; shouldRelease: boolean } {
  const attempts = currentAttempts + 1
  const shouldRelease = attempts > ERROR_INTERVALS.length
  const nextAttemptAt = new Date(now)
  if (!shouldRelease) {
    nextAttemptAt.setDate(nextAttemptAt.getDate() + ERROR_INTERVALS[attempts - 1])
  }
  nextAttemptAt.setHours(0, 0, 0, 0)
  return { nextAttemptAt, attempts, shouldRelease }
}

export { INTERVALS, ERROR_INTERVALS }
