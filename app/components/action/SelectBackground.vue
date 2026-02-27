<template>
  <button
    @click="openPicker"
    class="w-11 h-11 rounded-full border border-white/30 hover:border-white/50 transition duration-200 ease-in cursor-pointer overflow-hidden"
  >
    <span v-if="savedThumbSrc">
      <img
        class="h-full w-full object-cover"
        :src="savedThumbSrc"
        :alt="savedBg.label"
        loading="lazy"
        draggable="false"
      />
    </span>

    <!-- fallback or loading -->
    <span v-else>
      <div class="bg-white/10 animate-pulse h-full w-full"></div>
    </span>
  </button>

  <BaseDrawer
    :closable="false"
    v-model="open"
    side="bottom"
    :draggable="true"
    size="full"
    @update:modelValue="onDrawerToggle"
  >
    <div class="max-w-2xl mx-auto w-full space-y-6">
      <section class="space-y-2 text-center">
        <h1 class="text-white text-4xl font-instrument">Current Background</h1>

        <!-- preview shows DRAFT -->
        <div class="relative rounded-3xl overflow-hidden aspect-video">
          <!-- skeleton -->
          <div
            v-show="previewLoading"
            class="absolute inset-0 rounded-3xl bg-white/10 animate-pulse"
          />

          <!-- show text only when draft != saved -->
          <div
            v-if="isPreviewing"
            class="absolute inset-0 flex items-center justify-center"
          >
            <p class="text-white px-6 py-2 rounded-full bg-black/40 text-sm">
              Background Preview
            </p>
          </div>

          <video
            class="h-full w-full object-cover rounded-3xl"
            :src="draftBg.src"
            autoplay
            muted
            loop
            playsinline
            @loadstart="previewLoading = true"
            @loadeddata="previewLoading = false"
            @canplay="previewLoading = false"
          />
        </div>
      </section>

      <form
        class="flex flex-col gap-4 items-center justify-center"
        @submit.prevent="applyBackground"
      >
        <p class="text-white/70 font-light text-sm">Select below</p>

        <!-- thumbnails (PNG) -->
        <!-- outer scroller (draggable) -->
        <div
          ref="thumbsViewportEl"
          data-drawer-no-drag
          class="w-full overflow-x-auto pb-1 select-none"
          @pointerdown="onThumbsPointerDown"
          @pointermove="onThumbsPointerMove"
          @pointerup="onThumbsPointerUp"
          @pointercancel="onThumbsPointerUp"
        >
          <!-- this wrapper lets us center when no overflow, but start when overflow -->
          <div
            class="min-w-full"
            :class="
              thumbsOverflows ? 'flex justify-start' : 'flex justify-center'
            "
          >
            <div
              ref="thumbsRowEl"
              class="flex items-center md:gap-5 gap-3 w-max"
            >
              <div v-for="bg in backgrounds" :key="bg.key">
                <button
                  type="button"
                  data-drawer-no-drag
                  class="h-16 w-16 rounded-full overflow-hidden border-2 transition duration-200 ease-in flex-none"
                  :class="
                    draftKey === bg.key
                      ? 'border-white'
                      : 'border-white/20 hover:border-white/40'
                  "
                  @click="preview(bg)"
                >
                  <img
                    :src="bg.thumbSrc"
                    :alt="bg.label"
                    class="h-full w-full object-cover"
                    loading="lazy"
                    draggable="false"
                  />
                </button>

                <div
                  class="text-center text-xs font-light text-white w-full p-1 pointer-events-none text-nowrap"
                >
                  {{ bg.label }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          data-drawer-no-drag
          type="submit"
          :disabled="!canApplyBackground"
          class="w-full md:py-3 py-2.5 rounded-full bg-white text-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed md:text-base text-sm"
        >
          Set Background
        </button>
      </form>
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { toast } from "~/lib/toast";

type BgManifestItem = {
  key: string;
  label: string;
  videoSrc: string;
  thumbSrc: string;
};

// what your background cookie expects
type BackgroundItem = { label: string; src: string };

const open = ref(false);
const previewLoading = ref(true);

const backgrounds = ref<BgManifestItem[]>([]);

onMounted(async () => {
  backgrounds.value = await $fetch<BgManifestItem[]>("/backgrounds.json");
});

const { $background, $videoPrefetch } = useNuxtApp();

// saved (cookie-backed)
const savedBg = computed<BackgroundItem>(() => $background.current.value);

const savedThumbSrc = computed(() => {
  const match =
    backgrounds.value.find((b) => b.videoSrc === savedBg.value.src) ??
    backgrounds.value.find((b) => b.videoSrc === $background.DEFAULT_BG.src);

  return match?.thumbSrc; // may be undefined while backgrounds.json is still loading
});

// draft (preview only)
const draftBg = ref<BackgroundItem>($background.current.value);
const draftKey = ref<string>("");

const isPreviewing = computed(() => draftBg.value.src !== savedBg.value.src);

function syncDraftToSaved() {
  draftBg.value = savedBg.value;

  // try to find matching key in manifest by video src
  const match = backgrounds.value.find((b) => b.videoSrc === savedBg.value.src);
  draftKey.value = match?.key ?? "";
}

function openPicker() {
  syncDraftToSaved();
  open.value = true;
}

function preview(bg: BgManifestItem) {
  // update preview only (video)
  draftBg.value = { label: bg.label, src: bg.videoSrc };
  draftKey.value = bg.key;

  $videoPrefetch.one(bg.videoSrc);
}

async function applyBackground() {
  if (!canApplyBackground.value) return;

  try {
    // in case replace() ever becomes async or throws
    await Promise.resolve($background.replace(draftBg.value));

    const label = $background.current.value.label || "Background";
    toast.success("Background changed!", {
      description: `${label} is now the theme.`,
      duration: 0,
      sound: "success",
      closable: false,
    });

    open.value = false;
  } catch (e) {
    console.error(e);

    toast.error("Error occurred", {
      description: "Failed to set background. Please try again.",
      duration: 0,
      sound: "error",
      closable: false,
    });
  }
}

const canApplyBackground = computed(() => {
  // disable if nothing selected OR same as current
  return !!draftBg.value?.src && draftBg.value.src !== savedBg.value.src;
});

// drawer open/close
function onDrawerToggle(v: boolean) {
  if (!v) syncDraftToSaved(); // closing without apply -> revert
  open.value = v;
}

// re-show skeleton whenever src changes
watch(
  () => draftBg.value.src,
  () => {
    previewLoading.value = true;
  },
);

/** -----------------------------------------
 *  Thumbnail strip: center if fits, start if overflow
 *  + drag/swipe horizontal scrolling
 *  ----------------------------------------- */
const thumbsViewportEl = ref<HTMLDivElement | null>(null);
const thumbsRowEl = ref<HTMLDivElement | null>(null);
const thumbsOverflows = ref(false);

function measureThumbOverflow() {
  const vp = thumbsViewportEl.value;
  const row = thumbsRowEl.value;
  if (!vp || !row) return;

  thumbsOverflows.value = row.scrollWidth > vp.clientWidth + 1;

  // if it overflows, make sure item[0] is visible
  if (thumbsOverflows.value) vp.scrollLeft = 0;
}

watch(
  () => backgrounds.value.length,
  async () => {
    await nextTick();
    measureThumbOverflow();
  },
);

// when opening drawer, reset so index 0 is visible
watch(open, async (v) => {
  if (!v) return;
  await nextTick();
  measureThumbOverflow();
  thumbsViewportEl.value && (thumbsViewportEl.value.scrollLeft = 0);
});

onMounted(() => {
  measureThumbOverflow();

  const onResize = async () => {
    await nextTick();
    measureThumbOverflow();
  };

  window.addEventListener("resize", onResize, { passive: true });
  onBeforeUnmount(() => window.removeEventListener("resize", onResize));
});

// --- Drag/swipe (does NOT break clicks) ---
const dragThumbs = ref<{
  pointerId: number;
  startX: number;
  startScrollLeft: number;
  dragging: boolean; // becomes true only after threshold
} | null>(null);

const DRAG_THRESHOLD = 6;

function onThumbsPointerDown(e: PointerEvent) {
  const vp = thumbsViewportEl.value;
  if (!vp) return;
  if (e.pointerType === "mouse" && e.button !== 0) return;

  dragThumbs.value = {
    pointerId: e.pointerId,
    startX: e.clientX,
    startScrollLeft: vp.scrollLeft,
    dragging: false,
  };
}

function onThumbsPointerMove(e: PointerEvent) {
  const vp = thumbsViewportEl.value;
  const st = dragThumbs.value;
  if (!vp || !st || e.pointerId !== st.pointerId) return;

  const dx = e.clientX - st.startX;

  // only enter "drag mode" once user actually drags
  if (!st.dragging && Math.abs(dx) >= DRAG_THRESHOLD) {
    st.dragging = true;

    // capture ONLY once dragging starts (keeps clicks working)
    try {
      vp.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  if (!st.dragging) return;

  // prevent text selection / native gestures during drag
  e.preventDefault?.();

  vp.scrollLeft = st.startScrollLeft - dx;
}

function onThumbsPointerUp(e: PointerEvent) {
  const vp = thumbsViewportEl.value;
  const st = dragThumbs.value;
  if (!vp || !st || e.pointerId !== st.pointerId) return;

  if (st.dragging) {
    try {
      vp.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  dragThumbs.value = null;
}

watch(open, async (v) => {
  if (!v) return;
  await nextTick();

  // saved first + then list order
  const urls: string[] = [];
  if (savedBg.value?.src) urls.push(savedBg.value.src);
  for (const b of backgrounds.value) urls.push(b.videoSrc);

  // keep small to avoid heavy network
  $videoPrefetch.many(urls, 4);
});
</script>

<style scoped>
/* optional: nicer drag UX */
[data-drawer-no-drag] {
  -webkit-user-select: none;
  user-select: none;
}

.w-full.overflow-x-auto {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.w-full.overflow-x-auto::-webkit-scrollbar {
  display: none;
}
</style>
