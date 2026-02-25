<!-- ~/components/Toaster.vue -->
<template>
  <teleport to="body">
    <div class="fixed inset-0 z-[1000] pointer-events-none">
      <div
        v-for="pos in positions"
        :key="pos"
        class="pointer-events-auto absolute w-full max-w-md p-4"
        :class="containerPlacement(pos)"
      >
        <!-- Layout wrapper: keeps peek visible, but NOT used for hover detection -->
        <div class="relative overflow-visible">
          <!-- Bottom stacks: spacer first (reserve peek space above) -->
          <div
            v-if="isBottom(pos)"
            class="pointer-events-none"
            :style="spacerStyle"
          />

          <!-- Hover box: ONLY the actual toast stack -->
          <div
            class="relative toast-stack"
            :data-hovered="hovered[pos] ? '1' : null"
            :data-bottom="isBottom(pos) ? '1' : null"
            @pointerenter="onHoverEnter(pos)"
            @pointerleave="onHoverLeave(pos)"
          >
            <TransitionGroup
              name="toast"
              tag="div"
              class="relative"
              @before-enter="onBeforeEnter"
              @enter="onEnter"
              @after-enter="onAfterEnter"
            >
              <div
                v-for="(t, i) in visibleFor(pos)"
                :key="t.id"
                class="relative"
                :data-newest="i === 0 ? '1' : null"
                :data-pos="pos"
                :data-collapse="collapsing[pos] ? '1' : null"
                :style="wrapStyle(pos, i, hovered[pos])"
              >
                <ToastCard
                  :toast="t"
                  :stack-index="i"
                  @dismiss="dismiss(t.id)"
                />
              </div>
            </TransitionGroup>
          </div>

          <!-- Top stacks: spacer last (reserve peek space below) -->
          <div
            v-if="!isBottom(pos)"
            class="pointer-events-none"
            :style="spacerStyle"
          />
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";
import {
  dismiss,
  toastStore,
  type ToastItem,
  type ToastPosition,
} from "~/lib/toast";

const MAX = 3;

const positions = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const satisfies readonly ToastPosition[];

const hovered = reactive<Record<ToastPosition, boolean>>({
  "top-left": false,
  "top-center": false,
  "top-right": false,
  "bottom-left": false,
  "bottom-center": false,
  "bottom-right": false,
});

/** Group toasts by position, newest first */
const grouped = computed(() => {
  const map = new Map<ToastPosition, ToastItem[]>();
  for (const p of positions) map.set(p, []);
  for (const t of toastStore.toasts) map.get(t.position)!.push(t);
  for (const p of positions)
    map.get(p)!.sort((a, b) => b.createdAt - a.createdAt);
  return map;
});

/** Always show max 3 (hover only changes layout style) */
function visibleFor(pos: ToastPosition) {
  return (grouped.value.get(pos) ?? []).slice(0, MAX);
}

function containerPlacement(pos: ToastPosition) {
  switch (pos) {
    case "top-left":
      return "left-0 top-0";
    case "top-center":
      return "left-1/2 top-0 -translate-x-1/2";
    case "top-right":
      return "right-0 top-0";
    case "bottom-left":
      return "left-0 bottom-0";
    case "bottom-center":
      return "left-1/2 bottom-0 -translate-x-1/2";
    case "bottom-right":
      return "right-0 bottom-0";
  }
}

function isBottom(pos: ToastPosition) {
  return pos.startsWith("bottom");
}

/* ---------- Tuning knobs ---------- */
const PEEK_Y = 20;
const GAP_EXPANDED = 5;
const SHRINK_STEP = 0.055;
const OPACITY_STEP = 0;
const BLUR_STEP = 0.8;

/** Spacer that reserves room for peeking toasts (but pointer-events-none so hover doesn’t “stick”) */
const spacerStyle = computed(() => {
  const peekSpace = PEEK_Y * (MAX - 1);
  return { height: `${peekSpace}px` };
});

function wrapStyle(pos: ToastPosition, index: number, expanded: boolean) {
  const bottom = isBottom(pos);
  const dir = bottom ? -1 : 1;

  if (expanded) {
    return {
      position: "relative",
      transform: "none",
      opacity: 1,
      marginTop: index === 0 ? "0px" : `${GAP_EXPANDED}px`,
      zIndex: 100 - index,
      transition:
        "transform 320ms cubic-bezier(.2,.8,.2,1), opacity 240ms, margin 240ms",
    } as const;
  }

  const y = dir * index * PEEK_Y;
  const scale = 1 - index * SHRINK_STEP;
  const opacity = 1 - index * OPACITY_STEP;

  return {
    position: "absolute",
    top: bottom ? "auto" : "0px",
    bottom: bottom ? "0px" : "auto",
    left: "0px",
    right: "0px",
    transform: `translateY(${y}px) scale(${scale})`,
    transformOrigin: bottom ? "bottom center" : "top center",
    opacity,
    zIndex: 100 - index,
    transition: "transform 320ms cubic-bezier(.2,.8,.2,1), opacity 240ms",
  } as const;
}

function onBeforeEnter(el: Element) {
  const e = el as HTMLElement;

  // Only animate the newest toast (index 0)
  if (e.getAttribute("data-newest") !== "1") return;

  const pos = (e.getAttribute("data-pos") || "top-center") as ToastPosition;
  const fromTop = !pos.startsWith("bottom");

  // Start OUTSIDE screen edge
  // (negative for top, positive for bottom)
  e.style.setProperty("--enterY", fromTop ? "-120vh" : "120vh");

  // Ensure we start invisible
  e.style.opacity = "0";
}

function onEnter(el: Element, done: () => void) {
  const e = el as HTMLElement;

  if (e.getAttribute("data-newest") !== "1") {
    done();
    return;
  }

  requestAnimationFrame(() => {
    // Drop to final position (your wrapStyle transform stays intact)
    e.style.setProperty("--enterY", "0px");
    e.style.opacity = "1";
  });

  window.setTimeout(done, 320);
}

function onAfterEnter(el: Element) {
  const e = el as HTMLElement;
  e.style.removeProperty("--enterY");
  e.style.removeProperty("opacity");
}

const collapsing = reactive<Record<ToastPosition, boolean>>({
  "top-left": false,
  "top-center": false,
  "top-right": false,
  "bottom-left": false,
  "bottom-center": false,
  "bottom-right": false,
});

function onHoverEnter(pos: ToastPosition) {
  collapsing[pos] = false;
  hovered[pos] = true;
}

function onHoverLeave(pos: ToastPosition) {
  hovered[pos] = false;

  collapsing[pos] = true;
  window.setTimeout(() => {
    collapsing[pos] = false;
  }, 120); // ✅ increase to 180 if you want even slower
}
</script>

<style scoped>
.toast-move {
  transition: transform 240ms cubic-bezier(0.2, 1.2, 0.2, 1);
}

/* Enter/leave */
.toast-enter-active {
  transition:
    transform 320ms cubic-bezier(0.2, 0.85, 0.2, 1),
    opacity 240ms ease;
}

.toast-leave-active {
  transition:
    transform 220ms cubic-bezier(0.2, 0.85, 0.2, 1),
    opacity 200ms ease;
  position: absolute;
}

/* ✅ Key: add an extra translateY using --enterY without breaking wrapStyle() */
.toast-enter-active[data-newest="1"],
.toast-enter-from[data-newest="1"],
.toast-enter-to[data-newest="1"] {
  transform: translateY(var(--enterY, 0px)) scale(1) !important;
}

/* ✅ whole stack "breathes" on hover */
.toast-stack {
  transition: transform 260ms cubic-bezier(0.2, 0.85, 0.2, 1);
  will-change: transform;
}

/* top positions: move DOWN a bit */
.toast-stack[data-hovered="1"]:not([data-bottom="1"]) {
  transform: translateY(10px);
}

/* bottom positions: move UP a bit (towards center) */
.toast-stack[data-hovered="1"][data-bottom="1"] {
  transform: translateY(-10px);
}
</style>
