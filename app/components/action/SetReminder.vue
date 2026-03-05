<template>
  <button type="button" @click="open = true"
    class="bg-black md:px-5 px-3 py-3 rounded-full border border-white/10 hover:border-white/50 transition duration-200 ease-in cursor-pointer flex items-center gap-1">
    <Plus class="size-5" />
    <p class="text-sm md:block hidden">set reminder</p>
  </button>

  <!-- Drawer 1: choose type -->
  <BaseDrawer v-model="open" :closable="false" side="bottom" :draggable="true" size="full">
    <div class="max-w-2xl mx-auto w-full space-y-6">
      <section class="space-y-2 text-center">
        <h1 class="text-white text-4xl font-instrument">In what type?</h1>
        <p class="text-white/70 font-light md:text-base text-sm">
          Please select from the following:
        </p>
      </section>

      <section class="flex w-full items-center gap-5">
        <ActionSelectType type="Alarm" @select="onSelect" />
        <ActionSelectType type="Timer" @select="onSelect" />
      </section>
    </div>
  </BaseDrawer>

  <!-- Drawer 2A: Alarm -->
  <BaseDrawer v-model="openSetAlarm" :closable="false" side="bottom" :draggable="true" size="full">
    <div class="max-w-2xl mx-auto w-full space-y-6">
      <section class="space-y-2 text-center">
        <h1 class="text-white text-4xl font-instrument">Set an alarm</h1>
        <p class="text-white/70 font-light md:text-base text-sm">Wake up, remember, or be on time.</p>
      </section>

      <form class="md:space-y-3 space-y-2" @submit.prevent="saveAlarmReminder">
        <input v-model.trim="label"
          class="w-full rounded-full bg-white/10 px-5 py-3 outline-none placeholder:font-light text-white text-base"
          name="label" type="text" id="label" placeholder="Remind me of..." autocomplete="off" />

        <AlarmPicker v-model="time" name="time" />

        <button data-drawer-no-drag type="submit"
          class="w-full md:py-3 py-2.5 rounded-full bg-white text-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-base"
          :disabled="!canSubmitAlarm">
          Start Alarm
        </button>
      </form>
    </div>
  </BaseDrawer>

  <!-- Drawer 2B: Timer -->
  <BaseDrawer v-model="openSetTimer" :closable="false" side="bottom" :draggable="true" size="full">
    <div class="max-w-2xl mx-auto w-full space-y-6">
      <section class="space-y-2 text-center">
        <h1 class="text-white text-4xl font-instrument">Set a timer</h1>
        <p class="text-white/70 font-light md:text-base text-sm">Count down, then alert you.</p>
      </section>

      <form class="md:space-y-3 space-y-2" @submit.prevent="saveTimerReminder">
        <input v-model.trim="timerLabel"
          class="w-full rounded-full bg-white/10 px-5 py-3 outline-none placeholder:font-light text-white text-base"
          name="timerLabel" type="text" placeholder="Timer for..." autocomplete="off" />

        <!-- Replace this with your real TimerPicker (minutes/seconds) -->
        <TimerPicker v-model="timerTime" name="timerTime" />

        <button data-drawer-no-drag type="submit"
          class="w-full md:py-3 py-2.5 rounded-full bg-white text-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-base"
          :disabled="!canSubmitTimer">
          Start Timer
        </button>
      </form>
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { toast } from "~/lib/toast";
import { Plus } from "lucide-vue-next";

type ActionType = "Alarm" | "Timer";

const open = ref(false);
const openSetAlarm = ref(false);
const openSetTimer = ref(false);

// Alarm fields
const label = ref("");
const time = ref("");

// Timer fields (example)
const timerLabel = ref("");
const timerTime = ref("");

const { $reminders } = useNuxtApp();

/** called by <ActionCard /> */
function onSelect(type: ActionType) {
  // close drawer 1 first
  open.value = false;

  nextTick(() => {
    if (type === "Alarm") openSetAlarm.value = true;
    else openSetTimer.value = true;
  });
}

/* Alarm */
const canSubmitAlarm = computed(() => Boolean(label.value.trim()) && Boolean(time.value));

function saveAlarmReminder() {
  const trimmed = label.value.trim();
  if (!trimmed || !time.value) {
    toast.warning("Required fields!", {
      description: "Label and time are required.",
      duration: 0,
      sound: "error",
      closable: true,
    });
    return;
  }

  $reminders.add({ label: trimmed, time: time.value, type: "alarm" });

  toast.set("Alarm started!", {
    description: `${useCapitalizeWords(trimmed)} • ${time.value}`,
    duration: 0,
    sound: "success",
    closable: true,
  });

  label.value = "";
  time.value = "";
  openSetAlarm.value = false;
}

/* Timer */
const canSubmitTimer = computed(() => {
  const lbl = timerLabel.value.trim();
  const t = timerTime.value.trim();
  return Boolean(lbl) && Boolean(t) && t !== "00:00:00";
});

function saveTimerReminder() {
  const trimmedLabel = timerLabel.value.trim();
  const t = timerTime.value.trim();

  // required
  if (!trimmedLabel || !t || t === "00:00:00") {
    toast.warning("Required fields!", {
      description: "Timer label and duration are required.",
      duration: 0,
      sound: "error",
      closable: true,
    });
    return;
  }

  // ✅ save on reminders
  $reminders.add({ label: trimmedLabel, time: t, type: "timer" });

  toast.set("Timer started!", {
    description: `${useCapitalizeWords(trimmedLabel)} • ${t}`,
    duration: 0,
    sound: "success",
    closable: true,
  });

  // reset + close
  timerLabel.value = "";
  timerTime.value = "";
  openSetTimer.value = false;
}
</script>