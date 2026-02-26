<template>
  <div class="relative" ref="root">
    <!-- Display input -->
    <input
      class="w-full rounded-full bg-white/10 px-5 py-3 outline-none placeholder:font-light"
      :value="display"
      placeholder="--:-- --"
      readonly
      @focus="($event.target as HTMLInputElement).blur()"
      aria-label="Selected time"
    />

    <input type="hidden" :name="name" :value="value" />

    <!-- Button opens the panel -->
    <button
      type="button"
      class="absolute right-2 top-1/2 z-10 -translate-y-1/2 p-2 rounded-full bg-[#343434] hover:bg-[#2e2e2e] transition duration-200 ease-in"
      @click="toggle"
      aria-label="Select time"
      ref="anchorBtn"
    >
      <Clock4 class="size-5 pointer-events-none" />
    </button>

    <!-- Teleported panel -->
    <Transition name="pop">
      <Teleport to="body">
        <div
          v-if="open"
          ref="panel"
          class="fixed z-[9999] w-[320px] max-w-[90vw] rounded-2xl border border-white/10 bg-neutral-950/90 text-white backdrop-blur-xl shadow-2xl p-3"
          :style="panelStyle"
        >
          <div class="grid grid-cols-3 gap-2">
            <section class="group">
              <p class="mb-1 text-xs text-white/60 px-1">Hour</p>
              <div class="relative">
                <select
                  v-model="draftHour"
                  class="appearance-none w-full rounded-full bg-white/10 border border-white/10 px-3 py-2 outline-none cursor-pointer"
                >
                  <option
                    class="text-black"
                    v-for="h in hours"
                    :key="h"
                    :value="h"
                  >
                    {{ h }}
                  </option>
                </select>
                <span
                  class="absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none p-1 rounded-full z-10 bg-[#4a4a4a] group-hover:bg-[#404040] transition duration-200 ease-in"
                >
                  <ChevronsUpDown
                    class="size-4 text-white pointer-events-none"
                  />
                </span>
              </div>
            </section>

            <section class="group">
              <p class="mb-1 text-xs text-white/60 px-1">Minute</p>
              <div class="relative">
                <select
                  v-model="draftMinute"
                  class="appearance-none w-full rounded-full bg-white/10 border border-white/10 px-3 py-2 outline-none cursor-pointer"
                >
                  <option
                    class="text-black"
                    v-for="m in minutes"
                    :key="m"
                    :value="m"
                  >
                    {{ m }}
                  </option>
                </select>
                <span
                  class="absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none p-1 rounded-full z-10 bg-[#4a4a4a] group-hover:bg-[#404040] transition duration-200 ease-in"
                >
                  <ChevronsUpDown
                    class="size-4 text-white pointer-events-none"
                  />
                </span>
              </div>
            </section>

            <section class="group">
              <p class="mb-1 text-xs text-white/60 px-1">Period</p>
              <div class="relative">
                <select
                  v-model="draftPeriod"
                  class="appearance-none w-full rounded-full bg-white/10 border border-white/10 px-3 py-2 outline-none cursor-pointer"
                >
                  <option class="text-black" value="AM">AM</option>
                  <option class="text-black" value="PM">PM</option>
                </select>
                <span
                  class="absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none p-1 rounded-full z-10 bg-[#4a4a4a] group-hover:bg-[#404040] transition duration-200 ease-in"
                >
                  <ChevronsUpDown
                    class="size-4 text-white pointer-events-none"
                  />
                </span>
              </div>
            </section>
          </div>

          <div
            class="mt-3 flex items-center justify-end gap-2 border-t border-white/5 pt-3"
          >
            <button
              type="button"
              class="text-sm px-4 py-2 rounded-full bg-white/10 hover:bg-white/15"
              @click="open = false"
            >
              Close
            </button>
            <button
              type="button"
              class="text-sm px-4 py-2 rounded-full bg-white text-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="applyAndClose"
              :disabled="!canApply"
            >
              Apply
            </button>
          </div>
        </div>
      </Teleport>
    </Transition>
  </div>
</template>

<script setup lang="ts">
// import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { Clock4, ChevronsUpDown } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{ name?: string; modelValue?: string }>(),
  {
    name: "time",
    modelValue: "",
  },
);

const emit = defineEmits<{ (e: "update:modelValue", v: string): void }>();

const open = ref(false);
const root = ref<HTMLElement | null>(null);
const panel = ref<HTMLElement | null>(null);

const hours = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
const minutes = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0"),
);

type Period = "AM" | "PM" | "--";

const savedHour = ref("--");
const savedMinute = ref("--");
const savedPeriod = ref<Period>("--");

const draftHour = ref("--");
const draftMinute = ref("--");
const draftPeriod = ref<Period>("--");

function parseInitial(v: string) {
  const match = v.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return;

  const hh = match[1] ?? "--";
  const mm = match[2] ?? "--";
  const apRaw = (match[3] ?? "--").toUpperCase();
  const ap: Period = apRaw === "PM" ? "PM" : "AM";

  savedHour.value = String(hh).padStart(2, "0");
  savedMinute.value = mm;
  savedPeriod.value = ap;

  draftHour.value = savedHour.value;
  draftMinute.value = savedMinute.value;
  draftPeriod.value = savedPeriod.value;
}

parseInitial(props.modelValue);

watch(
  () => props.modelValue,
  (v) => {
    if (v) parseInitial(v);
  },
);

const display = computed(
  () => `${savedHour.value}:${savedMinute.value} ${savedPeriod.value}`,
);
const value = computed(() => display.value);

/** ---------- Smart positioning (top/bottom flip) ---------- */
const panelPos = ref({ top: 0, left: 0 });

const panelStyle = computed(() => ({
  top: `${panelPos.value.top}px`,
  left: `${panelPos.value.left}px`,
}));

async function updatePanelPosition() {
  await nextTick();

  const anchor = root.value; // anchor to whole input container (recommended)
  const elPanel = panel.value;
  if (!anchor || !elPanel) return;

  const r = anchor.getBoundingClientRect();
  const panelRect = elPanel.getBoundingClientRect();

  const gap = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Align right edge of panel with right edge of anchor
  let left = r.right - panelRect.width;
  left = Math.max(8, Math.min(left, vw - panelRect.width - 8));

  const spaceBelow = vh - r.bottom;
  const spaceAbove = r.top;

  // Prefer below, but flip if not enough space
  let top: number;
  if (spaceBelow >= panelRect.height + gap || spaceBelow >= spaceAbove) {
    top = r.bottom + gap;
  } else {
    top = r.top - panelRect.height - gap;
  }

  top = Math.max(8, Math.min(top, vh - panelRect.height - 8));

  panelPos.value = { top, left };
}

/** ---------- Open/close ---------- */
async function toggle() {
  if (!open.value) {
    // reset draft from saved on open
    draftHour.value = savedHour.value;
    draftMinute.value = savedMinute.value;
    draftPeriod.value = savedPeriod.value;
    open.value = true;
    await updatePanelPosition();
  } else {
    open.value = false;
  }
}

function applyAndClose() {
  savedHour.value = draftHour.value;
  savedMinute.value = draftMinute.value;
  savedPeriod.value = draftPeriod.value;

  emit("update:modelValue", display.value);
  open.value = false;
}

/** Close when clicking outside (works with Teleport) */
function onDocClick(e: MouseEvent) {
  if (!open.value) return;
  const t = e.target as Node;
  if (
    (root.value && root.value.contains(t)) ||
    (panel.value && panel.value.contains(t))
  ) {
    return;
  }
  open.value = false;
}

const canApply = computed(() => {
  return (
    draftHour.value !== "--" &&
    draftMinute.value !== "--" &&
    draftPeriod.value !== "--"
  );
});

function onViewportChange() {
  if (!open.value) return;
  updatePanelPosition();
}

onMounted(() => {
  document.addEventListener("mousedown", onDocClick);
  window.addEventListener("resize", onViewportChange);
  // capture scroll from any container
  window.addEventListener("scroll", onViewportChange, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", onDocClick);
  window.removeEventListener("resize", onViewportChange);
  window.removeEventListener("scroll", onViewportChange, true);
});

// If panel content size changes (fonts, etc), re-position
watch(open, (v) => {
  if (v) updatePanelPosition();
});
</script>
