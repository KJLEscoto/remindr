<template>
  <Teleport to="body">
    <!-- Mount is controlled by `shown` so we can animate out before unmount -->
    <div v-if="shown" class="fixed inset-0 z-[9999]">
      <!-- Overlay -->
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300"
        :style="{ opacity: overlayOpacity }"
        :class="overlayClass"
        @click="onOverlayClick"
      />

      <!-- Panel -->
      <section
        ref="panel"
        class="absolute bg-gradient-to-b from-[#151515] to-[#000000] text-white shadow-2xl will-change-transform touch-pan-y h-fit pb-6"
        :class="[panelRadiusClass, panelPosClass, panelSizeClass, panelClass]"
        :style="panelStyle"
        role="dialog"
        aria-modal="true"
        :aria-label="title || 'Drawer'"
        tabindex="-1"
        @keydown.esc.prevent="onEsc"
        @pointerdown="onPointerDown"
      >
        <!-- Drag handle (kept) -->
        <div v-if="draggable" class="px-4 pt-3">
          <div class="mx-auto h-1.5 w-20 rounded-full bg-white/20" />
        </div>

        <!-- Header -->
        <header
          v-if="showHeader"
          class="flex items-center justify-between gap-3 px-4 py-3"
        >
          <div class="min-w-0">
            <p v-if="title" class="truncate text-base font-semibold">
              {{ title }}
            </p>
            <p v-if="description" class="truncate text-sm text-white/60">
              {{ description }}
            </p>
          </div>

          <button
            v-if="closable"
            type="button"
            class="rounded-lg p-2 hover:bg-white/10 active:scale-[0.98] transition"
            aria-label="Close drawer"
            data-drawer-no-drag
            @click="requestClose()"
          >
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </header>

        <!-- Content -->
        <div class="p-4" :class="contentClass">
          <slot />
        </div>

        <!-- Footer -->
        <footer v-if="$slots.footer" class="px-4 py-3">
          <slot name="footer" />
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

type Side = "bottom" | "right" | "left" | "top";
type Size = "sm" | "md" | "lg" | "full";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    side?: Side;
    size?: Size;
    title?: string;
    description?: string;
    closable?: boolean;
    persistent?: boolean;
    lockScroll?: boolean;
    draggable?: boolean;
    closeThreshold?: number; // % dragged to close
    velocityThreshold?: number; // px/ms
    panelClass?: string;
    overlayClass?: string;
    contentClass?: string;
    showHeader?: boolean;
  }>(),
  {
    side: "bottom",
    size: "md",
    closable: true,
    persistent: false,
    lockScroll: true,
    draggable: true,
    closeThreshold: 0.35,
    velocityThreshold: 0.9,
    panelClass: "",
    overlayClass: "",
    contentClass: "",
    showHeader: true,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "open"): void;
  (e: "close"): void;
}>();

const panel = ref<HTMLElement | null>(null);

// Controls actual mount/unmount (so close animation can play)
const shown = ref(false);

// animation + drag
const transitioning = ref(false);
const translatePx = ref(0); // along dismiss axis, always positive
const opening = ref(false);
const closing = ref(false);

const axis = computed<"x" | "y">(() =>
  props.side === "left" || props.side === "right" ? "x" : "y",
);

const sign = computed(() => {
  // normalize positive translate toward dismissal direction
  if (props.side === "bottom") return 1;
  if (props.side === "top") return -1;
  if (props.side === "right") return 1;
  return -1;
});

const panelPosClass = computed(() => {
  switch (props.side) {
    case "bottom":
      return "left-0 right-0 bottom-0";
    case "top":
      return "left-0 right-0 top-0";
    case "left":
      return "left-0 top-0 bottom-0";
    case "right":
      return "right-0 top-0 bottom-0";
  }
});

const panelRadiusClass = computed(() => {
  if (props.side === "bottom") return "rounded-t-[3rem]";
  if (props.side === "top") return "rounded-b-[3rem]";
  if (props.side === "left") return "rounded-r-[3rem]";
  return "rounded-l-[3rem]";
});

const panelSizeClass = computed(() => {
  const s = props.size;
  const side = props.side;

  if (side === "bottom" || side === "top") {
    if (s === "sm") return "h-[30vh] max-h-[30vh]";
    if (s === "md") return "h-[45vh] max-h-[45vh]";
    if (s === "lg") return "h-[70vh] max-h-[70vh]";
    return "h-[92vh] max-h-[92vh]";
  } else {
    if (s === "sm") return "w-[320px] max-w-[90vw]";
    if (s === "md") return "w-[420px] max-w-[90vw]";
    if (s === "lg") return "w-[560px] max-w-[90vw]";
    return "w-[92vw] max-w-[92vw]";
  }
});

function setBodyLock(locked: boolean) {
  if (!props.lockScroll) return;
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

function getPanelSize() {
  const el = panel.value;
  if (!el) return 0;
  const r = el.getBoundingClientRect();
  return axis.value === "y" ? r.height : r.width;
}

// Overlay fades out as you drag down
const overlayOpacity = computed(() => {
  if (!shown.value) return "0";
  const size = getPanelSize() || 1;
  const p = Math.min(1, Math.max(0, translatePx.value / size));
  const base = closing.value ? 0 : 1;
  return String(Math.max(0, base - p * 0.9));
});

const panelStyle = computed(() => {
  // inline transform is used for both animation + drag (smooth with transition flag)
  const t = translatePx.value;
  const tx = axis.value === "x" ? t * sign.value : 0;
  const ty = axis.value === "y" ? t * sign.value : 0;

  return {
    transform: `translate3d(${tx}px, ${ty}px, 0)`,
    transition: transitioning.value
      ? "transform 360ms cubic-bezier(.22,1,.36,1)"
      : "none",
  } as Record<string, string>;
});

function onOverlayClick() {
  if (props.persistent) return;
  requestClose();
}

function onEsc() {
  if (props.persistent) return;
  requestClose();
}

/** Request close with smooth exit even if parent toggles v-model */
function requestClose() {
  emit("update:modelValue", false);
}

/** Play open animation */
async function playOpen() {
  shown.value = true;
  opening.value = true;
  closing.value = false;

  setBodyLock(true);
  await nextTick();

  // Put it off-screen (or slightly off) WITHOUT transition first
  transitioning.value = false;

  const size = getPanelSize();
  // Start from hidden outside (most drawer-like)
  translatePx.value = size + 60;

  // Wait a frame so the initial transform is painted
  requestAnimationFrame(() => {
    // Turn on transition on the next frame
    transitioning.value = true;

    // Animate into view
    translatePx.value = 0;

    // cleanup flags after animation ends
    window.setTimeout(() => {
      transitioning.value = false;
      opening.value = false;
    }, 340);
  });

  panel.value?.focus();
  emit("open");
}

/** Play close animation then unmount */
function playClose() {
  if (!shown.value) return;
  opening.value = false;
  closing.value = true;

  transitioning.value = true;
  const size = getPanelSize();
  translatePx.value = size + 60; // slide out

  window.setTimeout(() => {
    transitioning.value = false;
    closing.value = false;
    translatePx.value = 0;
    shown.value = false;
    setBodyLock(false);
    emit("close");
  }, 340);
}

// Keep internal mount state in sync with v-model but animate nicely
watch(
  () => props.modelValue,
  (v) => {
    if (!import.meta.client) return;
    if (v) playOpen();
    else playClose();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (!import.meta.client) return;
  setBodyLock(false);
  removeDragListeners();
});

/* ---------------- Drag anywhere on panel ---------------- */

const drag = ref({
  active: false,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  lastT: 0,
  velocity: 0, // px/ms along axis normalized
});

function isNoDragTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  // don’t start drag from interactive elements (input, button, link, textarea, select)
  const interactive = target.closest(
    "input, textarea, select, button, a, [role='button'], [contenteditable='true'], [data-drawer-no-drag]",
  );
  return !!interactive;
}

function rubberBand(x: number, limit: number) {
  if (x <= limit) return x;
  const extra = x - limit;
  return limit + extra * 0.35;
}

function onPointerDown(e: PointerEvent) {
  if (!props.draggable) return;
  if (props.persistent) return;
  if (closing.value || opening.value) return;
  if (isNoDragTarget(e.target)) return; // Capture
  (e.currentTarget as HTMLElement)?.setPointerCapture?.(e.pointerId);

  drag.value.active = true;
  drag.value.startX = e.clientX;
  drag.value.startY = e.clientY;
  drag.value.lastX = e.clientX;
  drag.value.lastY = e.clientY;
  drag.value.lastT = performance.now();
  drag.value.velocity = 0;

  transitioning.value = false;

  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp, { passive: true });
  window.addEventListener("pointercancel", onPointerUp, { passive: true });
}

function onPointerMove(e: PointerEvent) {
  if (!drag.value.active) return;
  e.preventDefault();

  const now = performance.now();
  const dx = e.clientX - drag.value.startX;
  const dy = e.clientY - drag.value.startY;

  // along dismiss axis only
  const raw = axis.value === "x" ? dx : dy;
  const along = raw * sign.value; // normalize to positive

  const size = getPanelSize();
  const clamped = Math.max(0, along);
  translatePx.value = size ? rubberBand(clamped, size * 0.9) : clamped;

  // velocity along axis
  const dt = Math.max(1, now - drag.value.lastT);
  const dAxis =
    axis.value === "x"
      ? e.clientX - drag.value.lastX
      : e.clientY - drag.value.lastY;
  drag.value.velocity = (dAxis * sign.value) / dt;

  drag.value.lastX = e.clientX;
  drag.value.lastY = e.clientY;
  drag.value.lastT = now;
}

function removeDragListeners() {
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
  window.removeEventListener("pointercancel", onPointerUp);
}

function onPointerUp() {
  if (!drag.value.active) return;
  drag.value.active = false;
  removeDragListeners();

  const size = getPanelSize() || 1;
  const progress = Math.min(1, Math.max(0, translatePx.value / size));
  const v = drag.value.velocity;

  const shouldClose =
    progress >= props.closeThreshold || v >= props.velocityThreshold;

  transitioning.value = true;

  if (shouldClose) {
    // animate out then requestClose (watch will finish unmount)
    translatePx.value = size + 60;
    window.setTimeout(() => {
      requestClose();
    }, 60);
  } else {
    // snap back
    translatePx.value = 0;
    window.setTimeout(() => {
      transitioning.value = false;
    }, 340);
  }
}
</script>
