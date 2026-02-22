import { computed } from "vue"

export type BackgroundItem = {
  label: string
  src: string
}

const DEFAULT_BG: BackgroundItem = {
  label: "Nocturne",
  src: "/videos/Nocturne.mov",
}

export default defineNuxtPlugin(() => {
  const cookie = useCookie<BackgroundItem>("background", {
    // ✅ default cookie value if not set
    default: () => DEFAULT_BG,
    sameSite: "lax",
    // secure: true, // enable on HTTPS production
    // maxAge: 60 * 60 * 24 * 30,
  })

  const current = computed(() => cookie.value ?? DEFAULT_BG)

  function replace(bg: BackgroundItem) {
    cookie.value = bg
    return bg
  }

  return {
    provide: {
      background: {
        cookie,
        current,
        replace,
        DEFAULT_BG,
      },
    },
  }
})