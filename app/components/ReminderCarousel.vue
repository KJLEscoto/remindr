<template>
  <section class="w-full text-center flex flex-col gap-10 select-none">
    <!-- Viewport -->
    <div ref="viewport" class="relative overflow-hidden touch-pan-y" @pointerdown="onPointerDown">
      <!-- Track -->
      <div class="flex will-change-transform" :style="trackStyle">
        <!-- Slide 0: TIME -->
        <div class="w-full shrink-0 px-2">
          <div class="md:text-8xl text-6xl flex items-center justify-center md:gap-4 gap-3 font-instrument !text-nowrap">
            {{ hour }}
            <Delimiter /> {{ minute }}
            <Delimiter /> {{ second }} {{ period }}
          </div>
          <p class="text-white/80 mt-2 md:text-base text-sm">{{ date }}</p>
        </div>

        <!-- Slides: reminders -->
        <div v-for="item in reminders" :key="item.id" class="w-full shrink-0 px-2">
          <div class="md:text-8xl text-6xl flex items-center justify-center md:gap-4 gap-3 font-instrument !text-nowrap">
            <template v-if="remainingMap.get(item.id)">
              - {{ remainingMap.get(item.id)!.hour }}
              <Delimiter /> {{ remainingMap.get(item.id)!.minute }}
              <Delimiter /> {{ remainingMap.get(item.id)!.second }}
            </template>
            <template v-else>
              - --
              <Delimiter /> --
              <Delimiter /> --
            </template>
          </div>

          <p class="text-white/80 mt-2 md:text-base text-sm">
            <span class="capitalize">{{ item.label }}</span> ({{ item.time }})
          </p>
        </div>
      </div>
    </div>

    <!-- Indicators (always at least 1 dot to prevent layout collapse) -->
    <section class="flex items-center justify-center md:gap-2 gap-1.5 h-auto">
      <button v-for="i in totalSlides" :key="i" type="button" class="md:h-2 h-1.5 md:w-2 w-1.5 rounded-full transition"
        :class="activeIndex === i - 1 ? 'bg-white' : 'bg-white/30 hover:bg-white/50'" @click="goTo(i - 1)"
        aria-label="Go to slide" />
    </section>
  </section>
</template>

<script setup lang="ts">
type Remaining = { hour: string; minute: string; second: string } | null
type Reminder = { id: string; label: string; time: string; createdAt: string }

const props = defineProps<{
  hour: string
  minute: string
  second: string
  period: string
  date: string
  reminders: Reminder[]
  remainingMap: Map<string, Remaining>
  currentTime: string // ✅ add
}>()

const emit = defineEmits<{
  (e: "update:activeIndex", v: number): void
  (e: "trigger", id: string): void
}>()

const triggered = ref(new Set<string>())

watch(
  () => props.currentTime,
  (nowStr) => {
    for (const r of props.reminders) {
      // normalize spaces/case just in case
      const a = nowStr.trim().toUpperCase()
      const b = r.time.trim().toUpperCase()

      if (a !== b) continue
      if (triggered.value.has(r.id)) continue

      triggered.value.add(r.id)
      emit("trigger", r.id)
    }
  }
)

const totalSlides = computed(() => 1 + props.reminders.length)
const activeIndex = ref(0)
const viewport = ref<HTMLElement | null>(null)

const dragging = ref(false)
const startX = ref(0)
const startTrackX = ref(0)
const dragX = ref(0) // live position during drag
const trackX = ref(0)
const viewportW = ref(1)

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function updateViewportW() {
  viewportW.value = viewport.value?.clientWidth || 1
  trackX.value = -activeIndex.value * viewportW.value
}

onMounted(() => {
  nextTick(() => updateViewportW())
  window.addEventListener("resize", updateViewportW)
})
onBeforeUnmount(() => window.removeEventListener("resize", updateViewportW))

watch(totalSlides, () => {
  activeIndex.value = clamp(activeIndex.value, 0, totalSlides.value - 1)
  trackX.value = -activeIndex.value * viewportW.value
})

const trackStyle = computed(() => {
  const x = dragging.value ? dragX.value : trackX.value
  return {
    transform: `translate3d(${x}px,0,0)`,
    transition: dragging.value ? "none" : "transform 360ms cubic-bezier(.22,1,.36,1)",
  }
})

function goTo(i: number) {
  activeIndex.value = clamp(i, 0, totalSlides.value - 1)
  trackX.value = -activeIndex.value * viewportW.value

  // ✅ important: notify parent
  emit("update:activeIndex", activeIndex.value)
}

function rubberBand(x: number, min: number, max: number) {
  if (x > max) return max + (x - max) * 0.35
  if (x < min) return min + (x - min) * 0.35
  return x
}

function onPointerDown(e: PointerEvent) {
  if (totalSlides.value <= 1) return
  updateViewportW()

  dragging.value = true
  startX.value = e.clientX
  startTrackX.value = trackX.value
  dragX.value = trackX.value

    ; (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)

  window.addEventListener("pointermove", onPointerMove, { passive: false })
  window.addEventListener("pointerup", onPointerUp, { passive: true })
  window.addEventListener("pointercancel", onPointerUp, { passive: true })
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return
  e.preventDefault()

  const dx = e.clientX - startX.value
  const raw = startTrackX.value + dx

  const minX = -(totalSlides.value - 1) * viewportW.value
  const maxX = 0

  dragX.value = rubberBand(raw, minX, maxX)
}

function onPointerUp() {
  if (!dragging.value) return
  dragging.value = false

  window.removeEventListener("pointermove", onPointerMove)
  window.removeEventListener("pointerup", onPointerUp)
  window.removeEventListener("pointercancel", onPointerUp)

  // snap to nearest slide based on where the track ended
  const rawIndex = Math.round(-dragX.value / viewportW.value)
  goTo(rawIndex)
}
</script>