import type { ComputedRef, Ref } from "vue"

type BackgroundItem = {
  label: string
  src: string
}

declare module "#app" {
  interface NuxtApp {
    $background: {
      cookie: Ref<BackgroundItem>
      current: ComputedRef<BackgroundItem>
      replace: (bg: BackgroundItem) => BackgroundItem
      DEFAULT_BG: BackgroundItem
    }
  }
}

export {}