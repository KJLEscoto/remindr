<!-- ~/components/Toaster.vue -->
<template>
  <teleport to="body">
    <div class="fixed inset-0 z-50 pointer-events-none">
      <div
        v-for="pos in POSITIONS"
        :key="pos"
        class="absolute p-4 pointer-events-none w-[calc(100vw-2rem)] max-w-md"
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
            class="relative toast-hitbox"
            :data-hovered="hovered[pos] ? '1' : null"
            :data-bottom="isBottom(pos) ? '1' : null"
            @pointerenter="handleHover(pos, true)"
            @pointerleave="handleHover(pos, false)"
          >
            <TransitionGroup
              name="toast"
              tag="div"
              class="relative w-full pointer-events-none"
              @before-enter="onBeforeEnter"
              @enter="onEnter"
              @after-enter="onAfterEnter"
            >
              <div
                v-for="(t, i) in visibleFor(pos)"
                :key="t.id"
                class="relative w-full pointer-events-auto"
                :data-newest="i === 0 ? '1' : null"
                :data-pos="pos"
                :data-collapse="collapsing[pos] ? '1' : null"
                :style="wrapStyle(pos, i, hovered[pos])"
              >
                <ToastCard
                  class="w-full pointer-events-auto"
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

/* ---------------- Constants ---------------- */
const MAX_VISIBLE = 3;

const POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const satisfies readonly ToastPosition[];

/** Create a per-position record with a default value */
function createPosRecord<T>(value: T) {
  return Object.fromEntries(POSITIONS.map((p) => [p, value])) as Record<
    ToastPosition,
    T
  >;
}

const hovered = reactive(createPosRecord(false));
const collapsing = reactive(createPosRecord(false));

/* ---------------- Grouping: newest first ---------------- */
const grouped = computed(() => {
  const map = new Map<ToastPosition, ToastItem[]>();
  for (const p of POSITIONS) map.set(p, []);

  for (const t of toastStore.toasts) {
    map.get(t.position)?.push(t);
  }

  for (const p of POSITIONS) {
    map.get(p)!.sort((a, b) => b.createdAt - a.createdAt);
  }

  return map;
});

function visibleFor(pos: ToastPosition) {
  return (grouped.value.get(pos) ?? []).slice(0, MAX_VISIBLE);
}

/* ---------------- Placement helpers ---------------- */
function isBottom(pos: ToastPosition) {
  return pos.startsWith("bottom");
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

/* ---------------- Layout tuning ---------------- */
const PEEK_Y = 20;
const GAP_EXPANDED = 5;
const SHRINK_STEP = 0.055;
const OPACITY_STEP = 0; // keep opacity as-is

const spacerStyle = computed(() => ({
  height: `${PEEK_Y * (MAX_VISIBLE - 1)}px`,
}));

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

/* ---------------- Enter animation (newest only) ---------------- */
function onBeforeEnter(el: Element) {
  const e = el as HTMLElement;
  if (e.getAttribute("data-newest") !== "1") return;

  const pos = (e.getAttribute("data-pos") || "top-center") as ToastPosition;
  const fromTop = !isBottom(pos);

  e.style.setProperty("--enterY", fromTop ? "-120vh" : "120vh");
  e.style.opacity = "0";
}

function onEnter(el: Element, done: () => void) {
  const e = el as HTMLElement;
  if (e.getAttribute("data-newest") !== "1") return void done();

  requestAnimationFrame(() => {
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

/* ---------------- Hover collapse/expand ---------------- */
const leaveTimers = createPosRecord<number | null>(null);

function handleHover(pos: ToastPosition, isEnter: boolean) {
  // cancel pending leave
  if (leaveTimers[pos]) {
    clearTimeout(leaveTimers[pos]!);
    leaveTimers[pos] = null;
  }

  if (isEnter) {
    collapsing[pos] = false;
    hovered[pos] = true;
    return;
  }

  // tiny debounce to prevent hover flicker during animation/layout shifts
  leaveTimers[pos] = window.setTimeout(() => {
    hovered[pos] = false;

    collapsing[pos] = true;
    window.setTimeout(() => {
      collapsing[pos] = false;
    }, 120);

    leaveTimers[pos] = null;
  }, 80);
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

/* extra translateY using --enterY (newest only) */
.toast-enter-active[data-newest="1"],
.toast-enter-from[data-newest="1"],
.toast-enter-to[data-newest="1"] {
  transform: translateY(var(--enterY, 0px)) scale(1) !important;
}

/* stack "breathes" on hover */
.toast-stack {
  transition: transform 260ms cubic-bezier(0.2, 0.85, 0.2, 1);
  will-change: transform;
}

.toast-stack[data-hovered="1"]:not([data-bottom="1"]) {
  transform: translateY(10px);
}

.toast-stack[data-hovered="1"][data-bottom="1"] {
  transform: translateY(-10px);
}

.toast-hitbox {
  transition: transform 260ms cubic-bezier(0.2, 0.85, 0.2, 1);
  will-change: transform;
}

.toast-hitbox[data-hovered="1"]:not([data-bottom="1"]) {
  transform: translateY(10px);
}

.toast-hitbox[data-hovered="1"][data-bottom="1"] {
  transform: translateY(-10px);
}
</style>
