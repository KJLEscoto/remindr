<template>
  <button @click="openPicker"
    class="w-12 h-12 rounded-full border border-white/30 hover:border-white/50 transition duration-200 ease-in cursor-pointer overflow-hidden">
    <span v-if="savedThumbSrc">
      <img class="h-full w-full object-cover" :src="savedThumbSrc" :alt="savedBg.label" loading="lazy"
        draggable="false" />
    </span>

    <!-- fallback or loading -->
    <span v-else>
      <div class="bg-white/10 animate-pulse h-full w-full"></div>
    </span>
  </button>

  <BaseDrawer :closable="false" v-model="open" side="bottom" :draggable="true" size="full"
    @update:modelValue="onDrawerToggle">
    <div class="w-1/3 mx-auto space-y-6">
      <section class="space-y-2 text-center">
        <h1 class="text-white text-4xl font-instrument">Current Background</h1>

        <!-- preview shows DRAFT -->
        <div class="relative rounded-3xl overflow-hidden aspect-video">
          <!-- skeleton -->
          <div v-show="previewLoading" class="absolute inset-0 rounded-3xl bg-white/10 animate-pulse" />

          <!-- show text only when draft != saved -->
          <p v-if="isPreviewing"
            class="absolute inset-0 flex items-center justify-center text-white mix-blend-difference">
            Background Preview
          </p>

          <video class="h-full w-full object-cover rounded-3xl" :src="draftBg.src" autoplay muted loop playsinline
            @loadstart="previewLoading = true" @loadeddata="previewLoading = false" @canplay="previewLoading = false" />
        </div>
      </section>

      <form class="flex flex-col gap-4 items-center justify-center" @submit.prevent="applyBackground">
        <p class="text-white/70 font-light">Select below</p>

        <!-- thumbnails (PNG) -->
        <div class="flex items-center gap-4 overflow-x-auto pb-1">
          <div v-for="bg in backgrounds" :key="bg.key">
            <button type="button" data-drawer-no-drag
              class="h-20 w-20 rounded-full overflow-hidden border-2 transition duration-200 ease-in flex-none"
              :class="draftKey === bg.key ? 'border-white' : 'border-white/20 hover:border-white/40'"
              @click="preview(bg)">
              <img :src="bg.thumbSrc" :alt="bg.label" class="h-full w-full object-cover" loading="lazy"
                draggable="false" />
            </button>
            <!-- label -->
            <div class="text-center text-xs font-light text-white w-full p-2 pointer-events-none text-nowrap">
              {{ bg.label }}
            </div>
          </div>
        </div>

        <button class="w-full py-3 rounded-full bg-white text-black hover:opacity-90">
          Set Background
        </button>
      </form>
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
type BgManifestItem = {
  key: string
  label: string
  videoSrc: string
  thumbSrc: string
}

// what your background cookie expects
type BackgroundItem = { label: string; src: string }

const open = ref(false)
const previewLoading = ref(true)

const backgrounds = ref<BgManifestItem[]>([])

onMounted(async () => {
  backgrounds.value = await $fetch<BgManifestItem[]>("/backgrounds.json")
})

const { $background } = useNuxtApp()

// saved (cookie-backed)
const savedBg = computed<BackgroundItem>(() => $background.current.value)

const savedThumbSrc = computed(() => {
  const match =
    backgrounds.value.find((b) => b.videoSrc === savedBg.value.src) ??
    backgrounds.value.find((b) => b.videoSrc === $background.DEFAULT_BG.src)

  return match?.thumbSrc // may be undefined while backgrounds.json is still loading
})

// draft (preview only)
const draftBg = ref<BackgroundItem>($background.current.value)
const draftKey = ref<string>("")

const isPreviewing = computed(() => draftBg.value.src !== savedBg.value.src)

function syncDraftToSaved() {
  draftBg.value = savedBg.value

  // try to find matching key in manifest by video src
  const match = backgrounds.value.find((b) => b.videoSrc === savedBg.value.src)
  draftKey.value = match?.key ?? ""
}

function openPicker() {
  syncDraftToSaved()
  open.value = true
}

function preview(bg: BgManifestItem) {
  // update preview only (video)
  draftBg.value = { label: bg.label, src: bg.videoSrc }
  draftKey.value = bg.key
}

function applyBackground() {
  // commit to cookie
  $background.replace(draftBg.value)
  open.value = false
}

// drawer open/close
function onDrawerToggle(v: boolean) {
  if (!v) syncDraftToSaved() // closing without apply -> revert
  open.value = v
}

// re-show skeleton whenever src changes
watch(
  () => draftBg.value.src,
  () => {
    previewLoading.value = true
  }
)
</script>