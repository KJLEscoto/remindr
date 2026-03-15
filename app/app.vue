<template>
  <div>
    <!-- App (always rendered) -->
    <div :class="{ 'animate-pulse pointer-events-none select-none': booting }">
      <NuxtRouteAnnouncer />
      <NuxtPage />
      <Toaster />
      <KinwebbAttribute />
    </div>

    <!-- Loader overlay (refresh only) -->
    <div v-if="booting"
      class="fixed inset-0 z-[9999] grid place-items-center bg-black/85 backdrop-blur-md h-screen overflow-hidden">
      <Loader />
    </div>
  </div>
</template>

<script setup lang="ts">
const booting = ref(true)

let timer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  timer = setTimeout(() => {
    booting.value = false
  }, 1400)

  watch(
    booting,
    (value) => {
      document.body.style.overflow = value ? 'hidden' : ''
      document.documentElement.style.overflow = value ? 'hidden' : ''
    },
    { immediate: true }
  )
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)

  if (import.meta.client) {
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
  }
})
</script>
