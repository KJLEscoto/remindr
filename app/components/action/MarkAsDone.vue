<template>
  <button type="button" :disabled="disabled" @click="onDone"
    class="bg-green-950 px-5 py-3 rounded-full border border-white/10 hover:border-green-500/50 transition duration-200 ease-in cursor-pointer flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
    <p class="text-sm">mark as done</p>

    <svg xmlns="http://www.w3.org/2000/svg" class="!size-5" width="24" height="24" viewBox="0 0 24 24">
      <path fill="currentColor"
        d="M9 16.17L5.53 12.7a.996.996 0 1 0-1.41 1.41l4.18 4.18c.39.39 1.02.39 1.41 0L20.29 7.71a.996.996 0 1 0-1.41-1.41z" />
    </svg>
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  reminderId?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: "done"): void
}>()

const { $reminders } = useNuxtApp()

function onDone() {
  if (props.disabled) return
  if (!props.reminderId) return

  $reminders.remove(props.reminderId)
  emit("done")
}
</script>