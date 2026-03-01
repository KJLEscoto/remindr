// ~/lib/audio.ts
// WebAudio-based sound manager with iOS unlock + loop support.

type LoopHandle = { stop: () => void };

let ctx: AudioContext | null = null;
let unlocked = false;

const bufferCache = new Map<string, AudioBuffer>();
const loopHandles = new Map<string, LoopHandle>();

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    ctx = new AC();
  }
  return ctx!;
}

export function isAudioUnlocked() {
  return unlocked;
}

/** Call inside a user gesture (tap/click). Also safe to call repeatedly. */
export async function unlockAudio(): Promise<boolean> {
  if (!import.meta.client) return false;
  if (unlocked) return true;

  try {
    const c = getCtx();
    if (c.state !== "running") await c.resume();

    // "Priming" sound: 1-sample silent buffer (helps on iOS)
    const buffer = c.createBuffer(1, 1, 22050);
    const src = c.createBufferSource();
    src.buffer = buffer;
    src.connect(c.destination);
    src.start(0);

    unlocked = true;
    return true;
  } catch {
    return false;
  }
}

/** Automatically unlock on the first interaction anywhere. */
export function installAutoUnlock() {
  if (!import.meta.client) return;

  const handler = async () => {
    const ok = await unlockAudio();
    if (!ok) return;

    window.removeEventListener("touchstart", handler, true);
    window.removeEventListener("pointerdown", handler, true);
    window.removeEventListener("mousedown", handler, true);
    window.removeEventListener("keydown", handler, true);
  };

  window.addEventListener("touchstart", handler, true);
  window.addEventListener("pointerdown", handler, true);
  window.addEventListener("mousedown", handler, true);
  window.addEventListener("keydown", handler, true);
}

async function loadBuffer(sound: string): Promise<AudioBuffer | null> {
  if (!import.meta.client) return null;

  const key = sound;
  const cached = bufferCache.get(key);
  if (cached) return cached;

  if (!unlocked) return null;

  try {
    const c = getCtx();
    const url = `/audio/${encodeURIComponent(sound)}.mp3`;
    const res = await fetch(url, { cache: "force-cache" });
    const arr = await res.arrayBuffer();
    const buf = await c.decodeAudioData(arr.slice(0));
    bufferCache.set(key, buf);
    return buf;
  } catch {
    return null;
  }
}

export async function playOneShot(sound: string) {
  if (!import.meta.client) return;
  if (!unlocked) return;

  const buf = await loadBuffer(sound);
  if (!buf) return;

  try {
    const c = getCtx();
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = false;
    src.connect(c.destination);
    src.start(0);
  } catch {
    // ignore
  }
}

export async function playLoop(id: string, sound: string) {
  if (!import.meta.client) return;
  if (!unlocked) return;

  // avoid duplicate loops for same toast id
  if (loopHandles.has(id)) return;

  const buf = await loadBuffer(sound);
  if (!buf) return;

  try {
    const c = getCtx();
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(c.destination);
    src.start(0);

    loopHandles.set(id, {
      stop: () => {
        try {
          src.stop();
          src.disconnect();
        } catch {}
      },
    });
  } catch {
    // ignore
  }
}

export function stopLoop(id: string) {
  const h = loopHandles.get(id);
  if (!h) return;
  try {
    h.stop();
  } catch {}
  loopHandles.delete(id);
}