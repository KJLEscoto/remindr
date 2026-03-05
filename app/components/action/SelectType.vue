<template>
  <button type="button"
    class="bg-black md:px-5 px-3 md:py-10 py-6 rounded-3xl border border-white/10 hover:border-white/50 transition duration-200 ease-in cursor-pointer flex flex-col items-center justify-center gap-3 w-full"
    @click="emit('select', type)">
    <!-- icon -->
    <component :is="Icon" class="md:size-16 size-10 pointer-events-none" />

    <!-- label -->
    <p class="text-sm">{{ text }}</p>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { AlarmClock, Timer } from "lucide-vue-next";

type ActionType = "Alarm" | "Timer";

const props = withDefaults(
  defineProps<{
    type: ActionType;
    label?: string;
  }>(),
  {
    label: undefined,
  },
);

const emit = defineEmits<{
  (e: "select", type: ActionType): void;
}>();

const Icon = computed(() => (props.type === "Alarm" ? AlarmClock : Timer));
const text = computed(() => props.label ?? props.type);
</script>