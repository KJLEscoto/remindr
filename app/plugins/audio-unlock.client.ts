// ~/plugins/audio-unlock.client.ts
export default defineNuxtPlugin(() => {
  let ctx: AudioContext | null = null;
  let unlocked = false;

  async function unlock() {
    if (unlocked) return true;

    try {
      ctx =
        ctx ||
        new (window.AudioContext || (window as any).webkitAudioContext)();

      // resume must be called from a user gesture on iOS
      if (ctx.state !== "running") await ctx.resume();

      // tiny silent beep to fully unlock output
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.00001;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.01);

      unlocked = true;
      return true;
    } catch {
      return false;
    }
  }

  // One-time global listener: first real gesture unlocks audio
  const handler = () => {
    unlock().finally(() => {
      window.removeEventListener("touchstart", handler);
      window.removeEventListener("mousedown", handler);
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
    });
  };

  window.addEventListener("touchstart", handler, { passive: true });
  window.addEventListener("mousedown", handler, { passive: true });
  window.addEventListener("pointerdown", handler, { passive: true });
  window.addEventListener("keydown", handler, { passive: true });

  return {
    provide: {
      audio: {
        unlock,
        isUnlocked: () => unlocked,
        getContext: () => ctx,
      },
    },
  };
});
