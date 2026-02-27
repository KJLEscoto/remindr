<template>
  <button type="button" :disabled="disabled" @click="onDone"
    class="bg-green-950 md:px-5 px-3 py-3 rounded-full border border-white/10 hover:border-green-500/50 transition duration-200 ease-in cursor-pointer flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
    <p class="text-sm md:block hidden">mark as done</p>
    <Check class="size-5" />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Check } from "lucide-vue-next";
import { toast } from "~/lib/toast";

type ReminderItem = {
  id: string;
  label: string;
  time: string;
};

const props = defineProps<{
  reminderId?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "done"): void;
}>();

const { $reminders } = useNuxtApp();

/**
 * Prefer plugin state if available.
 * Fallback: read cookie directly (adjust cookie key if yours differs).
 */
const reminders = computed<ReminderItem[]>(() => {
  const fromPlugin = ($reminders as any)?.items?.value ?? ($reminders as any)?.items;
  if (Array.isArray(fromPlugin)) return fromPlugin;

  const cookie = useCookie<ReminderItem[]>("reminders", { default: () => [] });
  return cookie.value ?? [];
});

function showDoneToast(label: string, time: string) {
  toast.complete("Reminder completed!", {
    description: `${useCapitalizeWords(label)} • ${time}`,
    duration: 0,
    sound: "success",
    closable: false
  });
}

function onDone() {
  if (props.disabled) return;
  if (!props.reminderId) return;

  // ✅ get label/time BEFORE removing
  const item = reminders.value.find((r) => r.id === props.reminderId);

  $reminders.remove(props.reminderId);

  if (item) {
    showDoneToast(item.label, item.time);
  } else {
    toast.complete("Reminder completed!", {
      description: "Removed from your list.",
      duration: 0,
      sound: "success",
      closable: false
    });
  }

  emit("done");
}
</script>