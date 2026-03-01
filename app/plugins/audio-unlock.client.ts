// ~/plugins/audio-unlock.client.ts
import { installAutoUnlock } from "~/lib/audio";

export default defineNuxtPlugin(() => {
  installAutoUnlock();
});