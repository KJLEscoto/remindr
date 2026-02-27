<template>
  <button type="button" @click="open = true"
    class="bg-black md:px-5 px-3 py-3 rounded-full border border-white/10 hover:border-white/50 transition duration-200 ease-in cursor-pointer flex items-center gap-1">
    <Plus class="size-5" />
    <p class="text-sm md:block hidden">set reminder</p>
  </button>

  <BaseDrawer v-model="open" :closable="false" side="bottom" :draggable="true" size="full">
    <div class="max-w-2xl mx-auto w-full space-y-6">
      <section class="space-y-2 text-center">
        <h1 class="text-white text-4xl font-instrument">
          What should I remind you about today?
        </h1>
        <p class="text-white/70 font-light md:text-base text-sm">A gentle ping when it’s time.</p>
      </section>

      <form class="md:space-y-3 space-y-2" @submit.prevent="saveReminder">
        <input v-model.trim="label"
          class="w-full rounded-full bg-white/10 px-5 py-3 outline-none placeholder:font-light text-white md:text-base text-sm" name="label"
          type="text" id="label" placeholder="Remind me of..." autocomplete="off" />

        <TimePicker v-model="time" name="time" />

        <button data-drawer-no-drag type="submit"
          class="w-full md:py-3 py-2.5 rounded-full bg-white text-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed md:text-base text-sm"
          :disabled="!canSubmit">
          Set Reminder
        </button>
      </form>
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { toast } from "~/lib/toast";
import { Plus } from "lucide-vue-next";

const open = ref(false);
const label = ref("");
const time = ref("");

const { $reminders } = useNuxtApp();

const canSubmit = computed(
  () => Boolean(label.value?.trim()) && Boolean(time.value),
);

function showSuccess(savedLabel: string, savedTime: string) {
  toast.set("Reminder set!", {
    description: `${useCapitalizeWords(savedLabel)} • ${savedTime}`,
    duration: 0,
    sound: "success",
    closable: true,
  });
}

function showRequireField() {
  toast.warning("Required fields!", {
    description: "Label and time are required.",
    duration: 0,
    sound: "error",
    closable: true,
  });
}

function resetAndClose() {
  label.value = "";
  time.value = "";
  open.value = false;
}

function saveReminder() {
  const trimmed = label.value.trim();

  if (!trimmed || !time.value) {
    showRequireField();
    return; // ✅ IMPORTANT: stop here
  }

  // uses plugin add()
  $reminders.add({
    label: trimmed,
    time: time.value,
  });

  showSuccess(trimmed, time.value);
  resetAndClose();
}
</script>
