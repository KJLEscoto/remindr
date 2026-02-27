<template>
  <div ref="cardEl"
    class="pointer-events-auto toast-card relative w-full rounded-3xl bg-glass shadow-[0_18px_55px_rgba(0,0,0,0.45)]"
    :class="{ 'is-closing': closing }" :style="[cardStyle, glassVars]" role="status" aria-live="polite"
    @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerUp">
    <div class="flex gap-3 p-4">
      <div class="mt-0.5 shrink-0">
        <component :is="icon" class="h-5 w-5 text-white" :class="toast.variant === 'loading' ? 'animate-spin' : ''" />
      </div>

      <div class="min-w-0 flex-1">
        <div v-if="toast.label" class="text-sm font-semibold text-white">
          {{ toast.label }}
        </div>

        <div v-if="toast.description" class="mt-1 text-sm text-white/70">
          {{ toast.description }}
        </div>

        <div v-if="toast.actions?.length" class="mt-3 flex flex-wrap gap-2">
          <button v-for="(a, i) in toast.actions" :key="i" type="button"
            class="rounded-lg px-3 py-1.5 text-sm font-medium transition" :class="actionClass(a.variant)"
            @click="onAction(a)">
            {{ a.label }}
          </button>
        </div>
      </div>

      <button v-if="toast.closable !== false" type="button"
        class="ml-2 rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white" aria-label="Dismiss"
        data-no-drag @pointerdown.stop.prevent @mousedown.stop.prevent @click.stop="requestClose()">
        <X class="size-5 pointer-events-none" />
      </button>

      <button v-if="toast.variant === 'alarm'" type="button"
        class="ml-2 rounded-lg p-2 text-white/70 transition hover:bg-green-500/30 hover:text-white" aria-label="Dismiss"
        data-no-drag @pointerdown.stop.prevent @mousedown.stop.prevent @click.stop="requestAlarmDone()">
        <Check class="size-5 pointer-events-none" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from "vue";
import { toast as toastApi, type ToastAction, type ToastItem } from "~/lib/toast";
import {
  CheckCircle2,
  Check,
  AlertTriangle,
  Info,
  ClockCheck,
  AlarmClock,
  ClockPlus,
  Loader2,
  Bell,
  X,
} from "lucide-vue-next";

const props = defineProps<{ toast: ToastItem; stackIndex?: number }>();
const emit = defineEmits<{ (e: "dismiss"): void }>();

/* Glass vars */
const glassVars = computed(
  () =>
    ({
      "--glass-blur": "12px",
      "--glass-tint": "0.3",
    }) as Record<string, string>,
);

/* Icon */
const icon = computed(() => {
  switch (props.toast.variant) {
    case "success":
      return CheckCircle2;
    case "warning":
      return AlertTriangle;
    case "info":
      return Info;
    case "set":
      return ClockPlus;
    case "complete":
      return ClockCheck;
    case "alarm":
      return AlarmClock;
    case "loading":
      return Loader2;
    case "error":
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

/* ✅ Sound */
let audioEl: HTMLAudioElement | null = null;

onBeforeUnmount(() => {
  if (!audioEl) return;
  audioEl.pause();
  audioEl = null;
});

/* Close + exit vector */
const closing = ref(false);
const CLOSE_MS = 240;

const cardEl = ref<HTMLElement | null>(null);
const exit = ref<{ x: number; y: number } | null>(null);

function requestClose(
  exitVec?: { x: number; y: number },
  afterClose?: () => void
) {
  if (closing.value) return;
  closing.value = true;
  exit.value = exitVec ?? { x: 0, y: -14 };

  window.setTimeout(() => {
    emit("dismiss");
    afterClose?.();
  }, CLOSE_MS);
}

function requestAlarmDone(exitVec?: { x: number; y: number }) {
  // close current toast first (animation)
  requestClose(exitVec, () => {
    const label = props.toast.description || props.toast.label || "Reminder";
    const time = props.toast.label || "";

    toastApi.complete("Reminder completed!", {
      description: `${useCapitalizeWords(label)}${time ? ` • ${time}` : ""}`,
      duration: 0,
      sound: "success",
      closable: true,
    });
  });
}

const cardStyle = computed(() => {
  if (closing.value) {
    const e = exit.value ?? { x: 0, y: -14 };
    return {
      transform: `translate3d(${e.x}px, ${e.y}px, 0) scale(0.98)`,
      touchAction: "none",
    } as Record<string, string>;
  }

  const d = drag.value;
  if (!d) return {};

  return {
    transform: `translate3d(${d.dx}px, ${d.dy}px, 0)`,
    transition: d.dragging
      ? "none"
      : "transform 260ms cubic-bezier(.2,.8,.2,1)",
    touchAction: "none",
  } as Record<string, string>;
});

/* Swipe: hold-to-drag on mobile, threshold-drag on mouse */
const drag = ref<{
  id: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  dragging: boolean;
  allowDrag: boolean;      // ✅ gate
  holdTimer?: number;
} | null>(null);

const HOLD_MS = 500;
const START_THRESHOLD = 10;     // bump slightly
const DISMISS_THRESHOLD = 52;

function isTouchPointer(e: PointerEvent) {
  return e.pointerType === "touch" || e.pointerType === "pen";
}

function clearHold() {
  if (drag.value?.holdTimer) {
    window.clearTimeout(drag.value.holdTimer);
    drag.value.holdTimer = undefined;
  }
}

function onPointerDown(e: PointerEvent) {
  if (closing.value) return;
  if (e.pointerType === "mouse" && e.button !== 0) return;

  const target = e.target as HTMLElement | null;
  if (target?.closest("button, a, input, textarea, select, [data-no-drag]")) return;

  drag.value = {
    id: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    dx: 0,
    dy: 0,
    dragging: false,
    allowDrag: !isTouchPointer(e), // ✅ mouse can drag immediately (but only after threshold)
  };

  // ✅ Touch: require long press before we even allow drag
  if (isTouchPointer(e)) {
    const el = e.currentTarget as HTMLElement;
    drag.value.holdTimer = window.setTimeout(() => {
      if (!drag.value || drag.value.id !== e.pointerId || closing.value) return;
      drag.value.allowDrag = true;

      // capture only after hold (prevents “click becomes drag”)
      try {
        el.setPointerCapture(e.pointerId);
      } catch {}
    }, HOLD_MS);
  } else {
    // mouse capture is fine
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  }
}

function onPointerMove(e: PointerEvent) {
  if (closing.value) return;
  const d = drag.value;
  if (!d || e.pointerId !== d.id) return;

  const dx = e.clientX - d.startX;
  const dy = e.clientY - d.startY;

  // ✅ Touch: if user moves before hold completes, cancel drag (treat as scroll/tap)
  if (!d.allowDrag && isTouchPointer(e)) {
    if (Math.hypot(dx, dy) > START_THRESHOLD) clearHold();
    return;
  }

  // ✅ Still not allowed? do nothing
  if (!d.allowDrag) return;

  // ✅ Start dragging only after threshold (prevents micro-move on click)
  if (!d.dragging) {
    if (Math.hypot(dx, dy) < START_THRESHOLD) return;
    d.dragging = true;
  }

  // when actively dragging, prevent scrolling
  e.preventDefault?.();

  d.dx = dx;
  d.dy = dy;
}

function onPointerUp(e: PointerEvent) {
  if (closing.value) return;
  const d = drag.value;
  if (!d || e.pointerId !== d.id) return;

  clearHold();

  // ✅ If never started dragging, don't move the toast at all
  if (!d.dragging) {
    drag.value = null;
    return;
  }

  const { dx, dy } = d;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  const swipeIsDown = dy > 0 && absY > absX;
  const swipeIsUp = dy < 0 && absY >= absX;
  const swipeIsLeftRight = absX > absY;

  const shouldDismiss =
    !swipeIsDown &&
    ((swipeIsLeftRight && absX >= DISMISS_THRESHOLD) ||
      (swipeIsUp && absY >= DISMISS_THRESHOLD));

  if (shouldDismiss) {
    const w = cardEl.value?.offsetWidth ?? 320;
    const h = cardEl.value?.offsetHeight ?? 80;

    const flingX = swipeIsLeftRight ? Math.sign(dx) * (w + 80) : 0;
    const flingY = swipeIsUp ? -(h + 80) : 0;

    drag.value = null;
    requestClose({ x: flingX || dx, y: flingY || dy });
    return;
  }

  // snap back
  d.dragging = false;
  d.dx = 0;
  d.dy = 0;
  window.setTimeout(() => (drag.value = null), 260);
}

async function onAction(a: ToastAction) {
  try {
    await a.onClick();
  } finally {
    requestClose();
  }
}
</script>

<style scoped>
:deep(svg) {
  display: block;
}

.toast-card {
  overflow: hidden;
  transition:
    opacity 240ms ease,
    filter 240ms ease,
    transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
  will-change: transform, opacity, filter;
}

.toast-card > .flex {
  position: relative;
  z-index: 1;
}

.toast-card.is-closing {
  opacity: 0;
  filter: blur(3px);
  pointer-events: none;
}
</style>
