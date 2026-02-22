<template>
  <button @click="openPicker"
    class="w-12 h-12 rounded-full border border-white/30 hover:border-white/50 transition duration-200 ease-in cursor-pointer overflow-hidden">
    <!-- ✅ always show SAVED background outside -->
    <video class="h-full w-full object-cover" :src="savedBg.src" autoplay muted loop />
  </button>

  <BaseDrawer :closable="false" v-model="open" side="bottom" :draggable="true" size="full"
    @update:modelValue="onDrawerToggle">
    <div class="w-1/3 mx-auto space-y-6">
      <section class="space-y-2 text-center">
        <h1 class="text-white text-2xl">Current Background</h1>

        <!-- ✅ preview shows DRAFT -->
        <div class="relative rounded-3xl overflow-hidden aspect-video">
          <!-- Skeleton (same size as video) -->
          <div v-show="previewLoading" class="absolute inset-0 rounded-3xl bg-white/10 animate-pulse" />
          <p v-if="isPreviewing"
            class="absolute inset-0 flex items-center justify-center text-white/70 mix-blend-difference">
            Background Preview
          </p>
          <video class="h-full w-full object-cover rounded-3xl" :src="draftBg.src" autoplay muted loop playsinline
            @loadstart="previewLoading = true" @loadeddata="previewLoading = false" @canplay="previewLoading = false" />
        </div>
      </section>

      <form class="flex flex-col gap-4 items-center justify-center" @submit.prevent="applyBackground">
        <p class="text-white/70 font-light">Select below</p>

        <div class="flex items-center gap-4">
          <label v-for="bg in backgrounds" :key="bg.label" class="cursor-pointer" data-drawer-no-drag>
            <input type="radio" v-model="draftLabel" :value="bg.label" class="hidden" @change="preview(bg)" />

            <video data-drawer-no-drag class="h-20 w-20 object-cover rounded-full border-2 pointer-events-auto"
              :class="draftLabel === bg.label ? 'border-white' : 'border-white/20 hover:border-white/40 transition duration-200 ease-in'"
              :src="bg.src" autoplay muted loop />
          </label>
        </div>

        <button class="w-full py-3 rounded-full bg-white text-black hover:opacity-90">
          Set Background
        </button>
      </form>
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
type BackgroundItem = { label: string; src: string }

const open = ref(false)

const backgrounds: BackgroundItem[] = [
  { label: "Nocturne", src: "/videos/Nocturne.mov" },
  { label: "Helix", src: "/videos/Helix.mov" },
]

const { $background } = useNuxtApp()

// ✅ saved (cookie-backed)
const savedBg = computed(() => $background.current.value)
const isPreviewing = computed(() => draftBg.value.src !== savedBg.value.src)

// ✅ draft (preview only)
const draftBg = ref<BackgroundItem>(savedBg.value)
const draftLabel = ref<string>(savedBg.value.label)

function syncDraftToSaved() {
  draftBg.value = savedBg.value
  draftLabel.value = savedBg.value.label
}

function openPicker() {
  syncDraftToSaved()
  open.value = true
}

function preview(bg: BackgroundItem) {
  // update preview only
  draftBg.value = bg
  draftLabel.value = bg.label
}

function applyBackground() {
  // commit to cookie
  $background.replace(draftBg.value)
  open.value = false
}

// called whenever drawer opens/closes (v-model update)
function onDrawerToggle(v: boolean) {
  // if closing without applying, revert to saved
  if (!v) syncDraftToSaved()
  open.value = v
}

const previewLoading = ref(true)

watch(
  () => draftBg.value.src,
  () => {
    // when user selects a different bg, show skeleton again until it loads
    previewLoading.value = true
  }
)
</script>