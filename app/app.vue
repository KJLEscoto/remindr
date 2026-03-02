<template>
  <div>
    <!-- App (always rendered) -->
    <div :class="{ 'animate-pulse pointer-events-none select-none': booting }">
      <NuxtRouteAnnouncer />
      <NuxtPage />
      <Toaster />
    </div>

    <!-- Loader overlay (refresh only) -->
    <div
      v-if="booting"
      class="fixed inset-0 z-[9999] grid place-items-center bg-black/85 backdrop-blur-md"
    >
      <Loader />
    </div>
  </div>
</template>

<script setup lang="ts">
const booting = ref(true);

onMounted(() => {
  const MIN_TIME = 1400; // ms
  setTimeout(() => {
    booting.value = false;
  }, MIN_TIME);
});
</script>
