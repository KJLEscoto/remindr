import { computed, onBeforeUnmount, onMounted, ref } from "vue"

type PHTime = {
  hour: string
  minute: string
  second: string
  period: "AM" | "PM" | ""
}

export function useCurrentTime() {
  const now = ref(new Date())
  let timer: number | undefined

  const getParts = (d: Date): PHTime => {
    const dtf = new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })

    const map = new Map(dtf.formatToParts(d).map((p) => [p.type, p.value]))

    return {
      hour: map.get("hour") ?? "00",
      minute: map.get("minute") ?? "00",
      second: map.get("second") ?? "00",
      period: (map.get("dayPeriod") as "AM" | "PM" | undefined) ?? "",
    }
  }

  const parts = computed(() => getParts(now.value))

  onMounted(() => {
    timer = window.setInterval(() => {
      now.value = new Date()
    }, 1000)
  })

  onBeforeUnmount(() => {
    if (timer) window.clearInterval(timer)
  })

  return {
    now,
    hour: computed(() => parts.value.hour),
    minute: computed(() => parts.value.minute),
    second: computed(() => parts.value.second),
    period: computed(() => parts.value.period),
  }
}
