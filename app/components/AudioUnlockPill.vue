<template>
  <button v-if="show" type="button" class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border transition pointer-events-auto
           bg-white/10 border-white/20 text-white hover:bg-white/15 active:scale-[0.98]"
    :class="enabled ? 'border-green-400/40' : 'border-white/20'" @click="onEnable">
    <span class="size-2 rounded-full" :class="enabled ? 'bg-green-400' : 'bg-yellow-300'" />
    <span>{{ enabled ? "Sound enabled" : "Enable sound" }}</span>
  </button>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import { isAudioUnlocked, unlockAudio } from "~/lib/audio";
import { toast } from "~/lib/toast";

const enabled = ref(false);
const show = ref(true);

function refresh() {
  enabled.value = isAudioUnlocked();
  // hide pill once enabled (optional). If you want it always visible, remove this line:
  show.value = !enabled.value;
}

async function onEnable() {
  const ok = await unlockAudio();
  refresh();

  if (!ok) {
    toast.warning("Couldn’t enable sound", {
      description: "Try tapping again. iOS requires interaction to enable audio.",
      duration: 2500,
      closable: true,
    });
    return;
  }

  toast.success("Sound enabled", {
    description: "Alarms can now play automatically while the app is open.",
    duration: 2000,
    closable: true,
    sound: "success",
  });
}

let t: number | null = null;
onMounted(() => {
  refresh();
  // keep it in sync in case auto-unlock triggers elsewhere
  t = window.setInterval(refresh, 500);
});
onBeforeUnmount(() => {
  if (t) window.clearInterval(t);
});
</script>