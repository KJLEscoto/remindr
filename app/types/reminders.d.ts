import type { ComputedRef, Ref } from "vue";

export type ReminderType = "alarm" | "timer";

export type Reminder = {
  id: string;
  label: string;
  type: ReminderType;  // ✅ new
  time: string;        // alarm time OR timer duration
  createdAt: string;
};

declare module "#app" {
  interface NuxtApp {
    $reminders: {
      cookie: Ref<Reminder[]>;
      list: ComputedRef<Reminder[]>;
      add: (reminder: Omit<Reminder, "id" | "createdAt">) => Reminder;
      remove: (id: string) => void;
      clear: () => void;
    };
  }
}

export {};