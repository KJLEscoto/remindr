// plugins/reminders.ts
import { computed } from "vue"

type Reminder = {
  id: string
  label: string
  time: string
  createdAt: string
}

export default defineNuxtPlugin(() => {
  const cookie = useCookie<Reminder[]>("reminders", {
    default: () => [],
    sameSite: "lax",
  })

  const list = computed(() => cookie.value ?? [])

  function add(reminder: Omit<Reminder, "id" | "createdAt">) {
    const item: Reminder = {
      id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
      createdAt: new Date().toISOString(),
      ...reminder,
    }
    cookie.value = [...list.value, item]
    return item
  }

  function remove(id: string) {
    cookie.value = list.value.filter((r) => r.id !== id)
  }

  function clear() {
    cookie.value = []
  }

  return {
    provide: {
      reminders: { cookie, list, add, remove, clear },
    },
  }
})