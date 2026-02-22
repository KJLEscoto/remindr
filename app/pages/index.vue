<template>
  <main class="h-screen w-full relative">

    <!-- background video -->
    <video class="absolute inset-0 h-full w-full object-cover" src="/videos/Nocturne.mov" autoplay muted loop></video>

    <div class="relative z-20 h-full w-full flex items-center justify-center">
      <div class="rounded-[3rem] h-fit w-1/3 bg-glass flex flex-col gap-10">

        <!-- button actions -->
        <section class="flex items-center justify-between w-full">

          <div class="flex items-center gap-2">

            <!-- set reminder drawer -->
            <ActionSetReminder />

            <!-- mark as done -->
            <button @click="console.log('mark as done')"
              class="bg-green-950 px-5 py-3 rounded-full border border-white/10 hover:border-green-500/50 transition duration-200 ease-in cursor-pointer flex items-center gap-1">
              <p class="text-sm">mark as done</p>

              <svg xmlns="http://www.w3.org/2000/svg" class="!size-5" width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor"
                  d="M9 16.17L5.53 12.7a.996.996 0 1 0-1.41 1.41l4.18 4.18c.39.39 1.02.39 1.41 0L20.29 7.71a.996.996 0 1 0-1.41-1.41z" />
              </svg>
            </button>
          </div>

          <div>
            <button @click="console.log('change background')"
              class="w-12 h-12 rounded-full border border-white overflow-hidden">
              <video class="h-full w-full object-cover" src="/videos/Nocturne.mov" autoplay muted loop></video>
            </button>
          </div>
        </section>

        <!-- time -->
        <section class="w-full text-center flex flex-col gap-3">
          <div class="text-8xl flex items-center justify-center gap-4 font-instrument">
            {{ hour }}
            <Delimiter />
            {{ minute }}
            <Delimiter />
            {{ second }}
            {{ period }}
          </div>
          <p class="text-white/80">{{ date }}</p>
        </section>



        <!-- carousel indicator -->
        <div class="flex items-center justify-center gap-2">
          <div class="!size-2 rounded-full bg-white" />
          <div class="!size-2 rounded-full bg-white/30" />
          <div class="!size-2 rounded-full bg-white/30" />
        </div>
      </div>
    </div>
  </main>
</template>


<script setup lang="ts">
const { hour, minute, second, period } = useCurrentTime()
const { date } = useCurrentDate()
</script>