<template>
  <button @click="open = true"
    class="bg-black px-5 py-3 rounded-full border border-white/10 hover:border-white/50 transition duration-200 ease-in cursor-pointer flex items-center gap-1">
    <svg xmlns="http://www.w3.org/2000/svg" class="!size-5" width="24" height="24" viewBox="0 0 24 24">
      <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M12 5v14m-7-7h14" />
    </svg>
    <p class="text-sm">set reminder</p>
  </button>

  <BaseDrawer :closable="false" v-model="open" side="bottom" :draggable="true">
    <div class="w-1/3 mx-auto space-y-6">
      <section class="space-y-2 text-center">
        <h1 class="text-white text-2xl">What should I remind you about today?</h1>
        <p class="text-white/70 font-light">A gentle ping when it’s time.</p>
      </section>

      <!-- inputs -->
      <form class="space-y-3">
        <input class="w-full rounded-full bg-white/10 px-5 py-3 outline-none placeholder:font-light" name="label"
          type="text" id="label" placeholder="Remind me of..." />
        <TimePicker name="time" />
        <button class="w-full py-3 rounded-full bg-white text-black hover:opacity-90">
          Set Reminder
        </button>
      </form>
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
const open = ref(false)
</script>