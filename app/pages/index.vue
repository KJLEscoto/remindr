<template>
  <main class="h-screen w-full relative">
    <!-- background video -->
    <video
      ref="bgVideoEl"
      class="absolute inset-0 h-full w-full object-cover pointer-events-none"
      :src="savedBg.src"
      autoplay
      muted
      loop
      playsinline
      webkit-playsinline
      preload="auto"
      disablepictureinpicture
      controlslist="nodownload noplaybackrate noremoteplayback"
      aria-hidden="true"
    />

    <div
      class="relative z-20 h-full w-full flex flex-col gap-5 items-center justify-center"
    >
      <section class="max-w-2xl mx-auto w-full px-4">
        <div
          class="rounded-[3rem] h-fit w-full bg-glass md:p-6 p-5 flex flex-col md:gap-10 gap-7"
        >
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
            :currentTime="currentTime"
            @trigger="handleTrigger"
          />
        </div>
      </section>
    </div>
    <div
      class="text-center w-full md:text-xs text-[.6rem] text-white/20 mix-blend-difference absolute bottom-5 z-40"
    >
      Powered by
      <a
        href="https://kinwebb.netlify.app/"
        target="_blank"
        rel="noopener noreferrer"
        class="text-white/50 hover:underline hover:text-white/60 ease-in transition-all duration-200"
      >
        KinWebb
      </a>
      <!-- |
      Share your feedback here. -->
    </div>
  </main>
</template>

<script setup lang="ts">
import { toast } from "~/lib/toast";
const { $background, $audio } = useNuxtApp();

async function handleTrigger(id: string) {
  const item = reminders.value.find((r) => r.id === id);
  if (!item) return;

  $reminders.remove(id);

  // If audio is still locked (user never tapped yet), show prompt
  // (import from ~/lib/audio)
  const { isAudioUnlocked } = await import("~/lib/audio");
  if (!isAudioUnlocked()) {
    toast.warning("Tap anywhere to enable alarm sound", {
      description: "iPhone blocks alarm audio until you interact once.",
      duration: 0,
      closable: true,
    });
  }

  toast.alarm(`${item.time}`, {
    description: `${useCapitalizeWords(item.label)}`,
    duration: 0,
    sound: "alarm",
    soundLoop: true,
    closable: false,
  });
}

const time = useCurrentTime();
const { date } = useCurrentDate();
const { remaining } = useReminderCountdown(time);

const currentTime = computed(
  () => `${time.hour.value}:${time.minute.value} ${time.period.value}`,
);

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

onMounted(() => {
  const nuxtApp = useNuxtApp(); // now we're on client, plugin exists

  watch(
    () => savedBg.value.src,
    (src) => {
      if (!src) return;
      nuxtApp.$videoPrefetch.one(src);
    },
    { immediate: true },
  );
});

const bgVideoEl = ref<HTMLVideoElement | null>(null);

watch(
  () => savedBg.value.src,
  async () => {
    await nextTick();
    const v = bgVideoEl.value;
    if (!v) return;

    v.muted = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
    v.setAttribute("muted", "");
    v.setAttribute("loop", "");
    v.setAttribute("preload", "auto");

    try {
      await v.play();
    } catch {}
  },
  { immediate: true },
);
</script>
