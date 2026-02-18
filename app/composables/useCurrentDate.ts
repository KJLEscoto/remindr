import { computed, onBeforeUnmount, onMounted, ref } from "vue"

export function useCurrentDate() {
  const now = ref(new Date())
  let timer: number | undefined

  onMounted(() => {
    // update every minute (date changes daily, but this keeps it fresh)
    timer = window.setInterval(() => {
      now.value = new Date()
    }, 60_000)
  })

  onBeforeUnmount(() => {
    if (timer) window.clearInterval(timer)
  })

  const formatted = computed(() => {
    const dtf = new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      weekday: "long",
      month: "long",
      day: "2-digit",
    })

    // Example: "Wednesday, February 18"
    // Some locales might output "Wednesday, February 18" already,
    // but we normalize to remove leading zeros if any.
    return dtf.format(now.value).replace(/\b0(\d)\b/g, "$1")
  })

  return {
    now,
    date: formatted, // "Wednesday, February 18"
  }
}
