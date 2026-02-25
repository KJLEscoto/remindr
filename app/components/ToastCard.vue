<template>
  <div
    ref="cardEl"
    class="pointer-events-auto toast-card relative w-full rounded-3xl bg-glass shadow-[0_18px_55px_rgba(0,0,0,0.45)]"
    :class="{ 'is-closing': closing }"
    :style="[cardStyle, glassVars]"
    role="status"
    aria-live="polite"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div class="flex gap-3 p-4">
      <!-- Icon -->
      <div class="mt-0.5 shrink-0">
        <component
          :is="icon"
          class="h-5 w-5 text-white"
          :class="toast.variant === 'loading' ? 'animate-spin' : ''"
        />
      </div>

      <!-- Content -->
      <div class="min-w-0 flex-1">
        <div v-if="toast.label" class="text-sm font-semibold text-white">
          {{ toast.label }}
        </div>
        <div v-if="toast.description" class="mt-1 text-sm text-white/70">
          {{ toast.description }}
        </div>

        <!-- Actions -->
        <div v-if="toast.actions?.length" class="mt-3 flex flex-wrap gap-2">
          <button
            v-for="(a, i) in toast.actions"
            :key="i"
            type="button"
            class="rounded-lg px-3 py-1.5 text-sm font-medium transition"
            :class="actionClass(a.variant)"
            @click="onAction(a)"
          >
            {{ a.label }}
          </button>
        </div>
      </div>

      <!-- Close -->
      <button
        v-if="toast.closable !== false"
        type="button"
        class="ml-2 rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
        aria-label="Dismiss"
        @click="requestClose()"
      >
        <X class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { ToastAction, ToastItem } from "~/lib/toast";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
  Bell,
  X,
} from "lucide-vue-next";

const props = defineProps<{ toast: ToastItem; stackIndex?: number }>();
const emit = defineEmits<{ (e: "dismiss"): void }>();

const glassVars = computed(() => {
  const i = props.stackIndex ?? 0;

  // ✅ keep blur ON for all, optionally increase slightly for deeper stacks
  const blurPx = 12; // or: 12 + i * 1.5
  const tint = 0.3; // or: 0.30 + i * 0.03

  return {
    "--glass-blur": `${blurPx}px`,
    "--glass-tint": `${tint}`,
  } as Record<string, string>;
});
/* ---------------- Icons ---------------- */
const icon = computed(() => {
  switch (props.toast.variant) {
    case "success":
      return CheckCircle2;
    case "error":
      return XCircle;
    case "warning":
      return AlertTriangle;
    case "info":
      return Info;
    case "loading":
      return Loader2;
    default:
      return Bell;
  }
});

function actionClass(v?: ToastAction["variant"]) {
  switch (v) {
    case "secondary":
      return "bg-white/10 text-white hover:bg-white/15";
    case "ghost":
      return "bg-transparent text-white/80 hover:bg-white/10";
    default:
      return "bg-white text-black hover:bg-white/90";
  }
}

/* ---------------- Fade-out dismiss (DON'T snap back) ---------------- */
const closing = ref(false);
const CLOSE_MS = 240;

const cardEl = ref<HTMLElement | null>(null);

// when closing, we animate OUT using this vector
const exit = ref<{ x: number; y: number } | null>(null);

function requestClose(exitVec?: { x: number; y: number }) {
  if (closing.value) return;
  closing.value = true;
  exit.value = exitVec ?? { x: 0, y: -14 }; // default close: small up
  window.setTimeout(() => emit("dismiss"), CLOSE_MS);
}

/* ---------------- Swipe-to-dismiss (any direction except down) ---------------- */
const drag = ref<{
  id: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  dragging: boolean;
} | null>(null);

const START_THRESHOLD = 8; // px before we treat it as a drag
const DISMISS_THRESHOLD = 52; // px to dismiss

const cardStyle = computed(() => {
  // closing: animate out in the swipe direction, no snap-back
  if (closing.value) {
    const e = exit.value ?? { x: 0, y: -14 };
    return {
      transform: `translate3d(${e.x}px, ${e.y}px, 0) scale(0.98)`,
      touchAction: "none",
    } as Record<string, string>;
  }

  const d = drag.value;
  if (!d) return {};

  // ✅ remove "imaginary barrier": no hard clamp
  return {
    transform: `translate3d(${d.dx}px, ${d.dy}px, 0)`,
    transition: d.dragging
      ? "none"
      : "transform 260ms cubic-bezier(.2,.8,.2,1)",
    touchAction: "none",
  } as Record<string, string>;
});

function onPointerDown(e: PointerEvent) {
  if (closing.value) return;
  if (e.pointerType === "mouse" && e.button !== 0) return;

  const el = e.currentTarget as HTMLElement;
  el.setPointerCapture(e.pointerId);

  drag.value = {
    id: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    dx: 0,
    dy: 0,
    dragging: false,
  };
}

function onPointerMove(e: PointerEvent) {
  if (closing.value) return;
  const d = drag.value;
  if (!d || e.pointerId !== d.id) return;

  const dx = e.clientX - d.startX;
  const dy = e.clientY - d.startY;

  if (!d.dragging) {
    const dist = Math.hypot(dx, dy);
    if (dist < START_THRESHOLD) return;
    d.dragging = true;
  }

  d.dx = dx;
  d.dy = dy;
}

function onPointerUp(e: PointerEvent) {
  if (closing.value) return;
  const d = drag.value;
  if (!d || e.pointerId !== d.id) return;

  const dx = d.dx;
  const dy = d.dy;

  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  // direction checks
  const swipeIsDown = dy > 0 && absY > absX; // down-dominant => NEVER dismiss
  const swipeIsUp = dy < 0 && absY >= absX;
  const swipeIsLeftRight = absX > absY;

  const shouldDismiss =
    !swipeIsDown &&
    ((swipeIsLeftRight && absX >= DISMISS_THRESHOLD) ||
      (swipeIsUp && absY >= DISMISS_THRESHOLD));

  if (shouldDismiss) {
    // ✅ don’t reset position; animate out along swipe direction
    const w = cardEl.value?.offsetWidth ?? 320;
    const h = cardEl.value?.offsetHeight ?? 80;

    // fling out farther than the card size
    const flingX = swipeIsLeftRight ? Math.sign(dx) * (w + 80) : 0;
    const flingY = swipeIsUp ? -(h + 80) : 0;

    drag.value = null;
    requestClose({ x: flingX || dx, y: flingY || dy });
    return;
  }

  // snap back only when NOT dismissing
  d.dragging = false;
  d.dx = 0;
  d.dy = 0;
  window.setTimeout(() => (drag.value = null), 260);
}

/* ---------------- Action click ---------------- */
async function onAction(a: ToastAction) {
  try {
    await a.onClick();
  } finally {
    requestClose();
  }
}
</script>

<style scoped>
/* rotate loader icon */
:deep(svg) {
  display: block;
}

/* Base appearance transition */
.toast-card {
  overflow: hidden;

  /* ✅ important: allow the fade to animate */
  transition:
    opacity 240ms ease,
    filter 240ms ease,
    transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
  will-change: transform, opacity, filter;
}

/* make content sit above the glass */
.toast-card > .flex {
  position: relative;
  z-index: 1;
}

/* Fade out (transform handled by computed style so it follows swipe direction) */
.toast-card.is-closing {
  opacity: 0;
  filter: blur(3px);
  transform: translateY(-10px) scale(0.98);
  pointer-events: none;
}
</style>
