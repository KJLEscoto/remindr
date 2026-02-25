// ~/lib/toast.ts
import { reactive } from "vue";

export type ToastVariant =
  | "default"
  | "success"
  | "error"
  | "warning"
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
};

type ToastOptions = Partial<Omit<ToastItem, "id" | "createdAt">> & {
  label?: string;
  description?: string;
};

function uid() {
  // simple stable id, good enough for UI
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const toastStore = reactive({
  toasts: [] as ToastItem[],
});

export function dismiss(id: string) {
  toastStore.toasts = toastStore.toasts.filter((t) => t.id !== id);
}

function scheduleAutoDismiss(item: ToastItem) {
  if (item.duration <= 0) return;
  window.setTimeout(() => dismiss(item.id), item.duration);
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
  };

  toastStore.toasts = [item, ...toastStore.toasts]; // newest first

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
toast.warning = (label: string, o: ToastOptions = {}) =>
  toast({ ...o, variant: "warning", label });
toast.loading = (label: string, o: ToastOptions = {}) =>
  toast({ ...o, variant: "loading", label, duration: 0 });
