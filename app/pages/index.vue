<template>
  <main class="h-screen w-full relative">
    <!-- background video -->
    <video
      class="absolute inset-0 h-full w-full object-cover"
      :src="savedBg.src"
      autoplay
      muted
      loop
    />

    <div class="relative z-20 h-full w-full flex items-center justify-center">
      <div class="rounded-[3rem] h-fit w-1/3 bg-glass p-6 flex flex-col gap-10">
        <!-- Actions -->
        <section class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2">
            <ActionSetReminder />

            <Transition name="pop">
              <ActionMarkAsDone
                v-if="activeIndex > 0 && currentReminder"
                :reminder-id="currentReminder.id"
                @done="afterDone"
              />
            </Transition>
          </div>

          <ActionSelectBackground />
        </section>

        <!-- Carousel -->
        <ReminderCarousel
          v-model:activeIndex="activeIndex"
          :hour="hour"
          :minute="minute"
          :second="second"
          :period="period"
          :date="date"
          :reminders="reminders"
          :remainingMap="remainingMap"
        />

        <button @click="showSuccess">success</button>
        <button @click="showError">error</button>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { toast } from "~/lib/toast";

function showSuccess() {
  // toast.success("Saved!", {
  //   description: "Your changes were stored successfully.",
  //   actions: [
  //     {
  //       label: "Undo",
  //       variant: "secondary",
  //       onClick: () => console.log("undo"),
  //     },
  //   ],
  //   duration: 0,
  // });

  // toast.success("SUCCESS", {
  //   description: "Please check your card and try again.",
  //   duration: 0,
  // });

  const id = toast.loading("Uploading...", {
    description: "This may take a few seconds.",
    closable: false,
  });

  setTimeout(() => {
    // finish loading -> show success, dismiss old
    import("~/lib/toast").then(({ dismiss }) => dismiss(id));
    toast.success("Uploaded!", { description: "Your file is ready." });
  }, 1500);
}

function showError() {
  toast.error("ERROR", {
    description: "Please check your card and try again.",
    duration: 0,
  });
}

const time = useCurrentTime();
const { date } = useCurrentDate();
const { remaining } = useReminderCountdown(time);

const { $background } = useNuxtApp();

// ✅ saved (cookie-backed)
const savedBg = computed(() => $background.current.value);

const { $reminders } = useNuxtApp();
const reminders = computed(() => $reminders.list.value ?? []);

const remainingMap = computed(() => {
  const map = new Map<string, ReturnType<typeof remaining>>();
  for (const item of reminders.value) map.set(item.id, remaining(item.time));
  return map;
});

const activeIndex = ref(0);

const currentReminder = computed(() => {
  if (activeIndex.value <= 0) return null;
  return reminders.value[activeIndex.value - 1] ?? null;
});

function afterDone() {
  // If no reminders left, return to time slide
  if (reminders.value.length === 0) {
    activeIndex.value = 0;
    return;
  }

  // Keep index within bounds (time slide + reminder slides)
  const max = reminders.value.length;
  if (activeIndex.value > max) activeIndex.value = max;
}

// expose time pieces
const hour = computed(() => time.hour.value);
const minute = computed(() => time.minute.value);
const second = computed(() => time.second.value);
const period = computed(() => time.period.value);
</script>
