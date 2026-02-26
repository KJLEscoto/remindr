// ~/lib/toast.ts
import { reactive } from "vue";

export type ToastVariant =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "set"
  | "complete"
  | "alarm"
  | "info"
  | "loading";

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type ToastAction = {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: "primary" | "secondary" | "ghost";
};

export type ToastItem = {
  id: string;
  createdAt: number;
  variant: ToastVariant;
  position: ToastPosition;
  label?: string;
  description?: string;
  actions?: ToastAction[];
  closable?: boolean;
  duration: number; // ms, 0 = persistent

  // ✅ sound
  sound?: string;

  // ✅ prevents replay (even if component remounts / becomes visible again)
  soundPlayed?: boolean;
  soundLoop?: boolean;
  done?: boolean;
};

type ToastOptions = Partial<
  Omit<ToastItem, "id" | "createdAt" | "soundPlayed">
> & {
  label?: string;
  description?: string;
  sound?: string;
  soundLoop?: boolean;
};

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const toastStore = reactive({
  toasts: [] as ToastItem[],
});

const loopAudios = new Map<string, HTMLAudioElement>();

function stopLoopSound(id: string) {
  const audio = loopAudios.get(id);
  if (!audio) return;
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch {}
  loopAudios.delete(id);
}

export function dismiss(id: string) {
  stopLoopSound(id);
  toastStore.toasts = toastStore.toasts.filter((t) => t.id !== id);
}

function scheduleAutoDismiss(item: ToastItem) {
  if (item.duration <= 0) return;
  window.setTimeout(() => dismiss(item.id), item.duration);
}

function playToastSound(item: ToastItem) {
  if (!import.meta.client) return;
  if (!item.sound) return;

  const src = `/audio/${encodeURIComponent(item.sound)}.mp3`;

  // ✅ looping alarm
  if (item.soundLoop) {
    // avoid duplicate loops
    if (loopAudios.has(item.id)) return;

    try {
      const audio = new Audio(src);
      audio.preload = "auto";
      audio.loop = true;
      loopAudios.set(item.id, audio);
      void audio.play().catch(() => {});
    } catch {
      // ignore
    }
    return;
  }

  // ✅ one-shot (your existing behavior)
  if (item.soundPlayed) return;
  item.soundPlayed = true;

  try {
    const audio = new Audio(src);
    audio.preload = "auto";
    void audio.play().catch(() => {});
  } catch {
    // ignore
  }
}

export function toast(opts: ToastOptions) {
  const item: ToastItem = {
    id: uid(),
    createdAt: Date.now(),
    variant: opts.variant ?? "default",
    position: opts.position ?? "top-center",
    label: opts.label,
    description: opts.description,
    actions: opts.actions,
    closable: opts.closable ?? true,
    duration: opts.duration ?? 4000,
    sound: opts.sound,
    soundPlayed: false,
    soundLoop: opts.soundLoop ?? false,
  };

  toastStore.toasts = [item, ...toastStore.toasts]; // newest first

  // ✅ play at creation time only
  playToastSound(item);

  // ✅ Nuxt 4 / Vite-safe client check
  if (import.meta.client) scheduleAutoDismiss(item);

  return item.id;
}

// shadcn-like helpers
toast.success = (label: string, o: ToastOptions = {}) =>
  toast({ ...o, variant: "success", label });
toast.error = (label: string, o: ToastOptions = {}) =>
  toast({ ...o, variant: "error", label });
toast.info = (label: string, o: ToastOptions = {}) =>
  toast({ ...o, variant: "info", label });
toast.set = (label: string, o: ToastOptions = {}) =>
  toast({ ...o, variant: "set", label });
toast.complete = (label: string, o: ToastOptions = {}) =>
  toast({ ...o, variant: "complete", label });
toast.alarm = (label: string, o: ToastOptions = {}) =>
  toast({ ...o, variant: "alarm", label });
toast.warning = (label: string, o: ToastOptions = {}) =>
  toast({ ...o, variant: "warning", label });
toast.loading = (label: string, o: ToastOptions = {}) =>
  toast({ ...o, variant: "loading", label, duration: 0 });
