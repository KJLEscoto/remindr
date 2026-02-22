import type { ComputedRef } from "vue"

type Period = "AM" | "PM"

export type Remaining = {
  hour: string
  minute: string
  second: string
  text: string // "- HH:MM:SS"
  totalSeconds: number
} | null

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

function to24h(hh12: number, period: Period) {
  if (period === "AM") return hh12 === 12 ? 0 : hh12
  return hh12 === 12 ? 12 : hh12 + 12
}

function parseTime12h(t: string) {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!m) return null

  const hh = Number(m[1])
  const mm = Number(m[2])

  const raw = (m[3] ?? "").toUpperCase()
  if (raw !== "AM" && raw !== "PM") return null
  const ap = raw as Period

  if (hh < 1 || hh > 12 || mm < 0 || mm > 59) return null
  return { hh, mm, ap }
}

function computeRemaining(
  nowHour12: string,
  nowMinute: string,
  nowSecond: string,
  nowPeriod: "AM" | "PM" | "",
  reminderTime: string
): Remaining {
  if (!nowPeriod) return null

  const nh12 = Number(nowHour12)
  const nm = Number(nowMinute)
  const ns = Number(nowSecond)
  if (Number.isNaN(nh12) || Number.isNaN(nm) || Number.isNaN(ns)) return null

  const now24 = to24h(nh12, nowPeriod)
  const nowTotal = now24 * 3600 + nm * 60 + ns

  const parsed = parseTime12h(reminderTime)
  if (!parsed) return null

  const target24 = to24h(parsed.hh, parsed.ap)
  const targetTotal = target24 * 3600 + parsed.mm * 60 // second = 0

  // if passed already, count to tomorrow
  let diff = targetTotal - nowTotal
  if (diff <= 0) diff += 24 * 3600

  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60

  const hour = pad2(h)
  const minute = pad2(m)
  const second = pad2(s)

  return {
    hour,
    minute,
    second,
    text: `- ${hour}:${minute}:${second}`,
    totalSeconds: diff,
  }
}

export function useReminderCountdown(args: {
  hour: ComputedRef<string>
  minute: ComputedRef<string>
  second: ComputedRef<string>
  period: ComputedRef<"AM" | "PM" | "">
}) {
  function remaining(reminderTime: string): Remaining {
    return computeRemaining(
      args.hour.value,
      args.minute.value,
      args.second.value,
      args.period.value,
      reminderTime
    )
  }

  return { remaining }
}