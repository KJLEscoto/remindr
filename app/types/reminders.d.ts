import type { ComputedRef, Ref } from "vue"

type Reminder = {
  id: string
  label: string
  time: string
  createdAt: string
}

declare module "#app" {
  interface NuxtApp {
    $reminders: {
      cookie: Ref<Reminder[]>
      list: ComputedRef<Reminder[]>
      add: (reminder: Omit<Reminder, "id" | "createdAt">) => Reminder
      remove: (id: string) => void
      clear: () => void
    }
  }
}

export {}