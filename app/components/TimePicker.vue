<template>
  <div class="relative" ref="root">
    <!-- Display input -->
    <input class="w-full rounded-full bg-white/10 px-5 py-3 outline-none placeholder:font-light" :value="display"
      placeholder="--:-- --" readonly @focus="($event.target as HTMLInputElement).blur()" aria-label="Selected time" />

    <input type="hidden" :name="name" :value="value" />

    <!-- Button opens the panel -->
    <button type="button"
      class="absolute right-2 top-1/2 z-10 -translate-y-1/2 p-2 rounded-full bg-transparent hover:bg-white/10 transition duration-200 ease-in"
      @click="toggle" aria-label="Select time" ref="anchorBtn">
      <svg xmlns="http://www.w3.org/2000/svg" class="!size-5 pointer-events-none" viewBox="0 0 15 15">
        <path fill="currentColor"
          d="M7.5.877a6.623 6.623 0 1 1 0 13.246A6.623 6.623 0 0 1 7.5.877m0 .95a5.674 5.674 0 1 0 0 11.343a5.674 5.674 0 0 0-.002-11.345M7.5 4a.5.5 0 0 1 .5.5v2.793l1.854 1.854l.064.078a.5.5 0 0 1-.693.693l-.078-.064l-2-2A.5.5 0 0 1 7 7.5v-3a.5.5 0 0 1 .5-.5" />
      </svg>
    </button>

    <!-- Teleported panel -->
    <Teleport to="body">
      <div v-if="open" ref="panel"
        class="fixed z-[9999] w-[320px] max-w-[90vw] rounded-2xl border border-white/10 bg-neutral-950/90 text-white backdrop-blur-xl shadow-2xl p-3"
        :style="panelStyle">
        <div class="grid grid-cols-3 gap-2">
          <div>
            <p class="mb-1 text-xs text-white/60 px-1">Hour</p>
            <select v-model="draftHour"
              class="w-full rounded-xl bg-white/10 border border-white/10 px-3 py-2 outline-none">
              <option disabled value="00">--</option>
              <option class="text-black" v-for="h in hours" :key="h" :value="h">{{ h }}</option>
            </select>
          </div>

          <div>
            <p class="mb-1 text-xs text-white/60 px-1">Minute</p>
            <select v-model="draftMinute"
              class="w-full rounded-xl bg-white/10 border border-white/10 px-3 py-2 outline-none">
              <option class="text-black" v-for="m in minutes" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>

          <div>
            <p class="mb-1 text-xs text-white/60 px-1">AM/PM</p>
            <select v-model="draftPeriod"
              class="w-full rounded-xl bg-white/10 border border-white/10 px-3 py-2 outline-none">
              <option class="text-black" value="AM">AM</option>
              <option class="text-black" value="PM">PM</option>
            </select>
          </div>
        </div>

        <div class="mt-3 flex items-center justify-end gap-2">
          <button type="button" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15" @click="open = false">
            Close
          </button>
          <button type="button" class="px-4 py-2 rounded-xl bg-white text-black hover:opacity-90"
            @click="applyAndClose">
            Apply
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"

const props = withDefaults(defineProps<{ name?: string; modelValue?: string }>(), {
  name: "time",
  modelValue: "",
})

const emit = defineEmits<{ (e: "update:modelValue", v: string): void }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const anchorBtn = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)

const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"))
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

type Period = "AM" | "PM" | "--"

const savedHour = ref("--")
const savedMinute = ref("--")
const savedPeriod = ref<Period>("--")

const draftHour = ref("--")
const draftMinute = ref("--")
const draftPeriod = ref<Period>("--")

function parseInitial(v: string) {
  const match = v.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i)
  if (!match) return

  const hh = match[1] ?? "--"
  const mm = match[2] ?? "--"
  const apRaw = (match[3] ?? "--").toUpperCase()
  const ap: Period = apRaw === "PM" ? "PM" : "AM"

  savedHour.value = String(hh).padStart(2, "0")
  savedMinute.value = mm
  savedPeriod.value = ap

  draftHour.value = savedHour.value
  draftMinute.value = savedMinute.value
  draftPeriod.value = savedPeriod.value
}

parseInitial(props.modelValue)

watch(
  () => props.modelValue,
  (v) => {
    if (v) parseInitial(v)
  }
)

const display = computed(() => `${savedHour.value}:${savedMinute.value} ${savedPeriod.value}`)
const value = computed(() => display.value)

/** ---------- Smart positioning (top/bottom flip) ---------- */
const panelPos = ref({ top: 0, left: 0 })

const panelStyle = computed(() => ({
  top: `${panelPos.value.top}px`,
  left: `${panelPos.value.left}px`,
}))

async function updatePanelPosition() {
  await nextTick()

  const anchor = root.value // anchor to whole input container (recommended)
  const elPanel = panel.value
  if (!anchor || !elPanel) return

  const r = anchor.getBoundingClientRect()
  const panelRect = elPanel.getBoundingClientRect()

  const gap = 8
  const vw = window.innerWidth
  const vh = window.innerHeight

  // Align right edge of panel with right edge of anchor
  let left = r.right - panelRect.width
  left = Math.max(8, Math.min(left, vw - panelRect.width - 8))

  const spaceBelow = vh - r.bottom
  const spaceAbove = r.top

  // Prefer below, but flip if not enough space
  let top: number
  if (spaceBelow >= panelRect.height + gap || spaceBelow >= spaceAbove) {
    top = r.bottom + gap
  } else {
    top = r.top - panelRect.height - gap
  }

  top = Math.max(8, Math.min(top, vh - panelRect.height - 8))

  panelPos.value = { top, left }
}

/** ---------- Open/close ---------- */
async function toggle() {
  if (!open.value) {
    // reset draft from saved on open
    draftHour.value = savedHour.value
    draftMinute.value = savedMinute.value
    draftPeriod.value = savedPeriod.value
    open.value = true
    await updatePanelPosition()
  } else {
    open.value = false
  }
}

function applyAndClose() {
  savedHour.value = draftHour.value
  savedMinute.value = draftMinute.value
  savedPeriod.value = draftPeriod.value

  emit("update:modelValue", display.value)
  open.value = false
}

/** Close when clicking outside (works with Teleport) */
function onDocClick(e: MouseEvent) {
  if (!open.value) return
  const t = e.target as Node
  if (
    (root.value && root.value.contains(t)) ||
    (panel.value && panel.value.contains(t))
  ) {
    return
  }
  open.value = false
}

function onViewportChange() {
  if (!open.value) return
  updatePanelPosition()
}

onMounted(() => {
  document.addEventListener("mousedown", onDocClick)
  window.addEventListener("resize", onViewportChange)
  // capture scroll from any container
  window.addEventListener("scroll", onViewportChange, true)
})

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", onDocClick)
  window.removeEventListener("resize", onViewportChange)
  window.removeEventListener("scroll", onViewportChange, true)
})

// If panel content size changes (fonts, etc), re-position
watch(open, (v) => {
  if (v) updatePanelPosition()
})
</script>