// ~/plugins/video-prefetch.client.ts
export default defineNuxtPlugin(() => {
  // cache across the whole SPA session
  const prefetched = new Set<string>();
  const inflight = new Map<string, Promise<void>>();

  // tweak if you want
  const MAX_CONCURRENCY = 2;
  let active = 0;
  const queue: Array<() => Promise<void>> = [];

  function runNext() {
    if (active >= MAX_CONCURRENCY) return;
    const job = queue.shift();
    if (!job) return;

    active++;
    job()
      .catch(() => {})
      .finally(() => {
        active--;
        runNext();
      });
  }

  function enqueue(job: () => Promise<void>) {
    queue.push(job);
    runNext();
  }

  function preloadLink(url: string) {
    try {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "video";
      link.href = url;
      document.head.appendChild(link);
    } catch {
      // ignore
    }
  }

  function warmWithVideo(url: string) {
    return new Promise<void>((resolve) => {
      const v = document.createElement("video");
      v.preload = "auto";
      v.muted = true;
      v.playsInline = true;
      v.style.position = "fixed";
      v.style.width = "0";
      v.style.height = "0";
      v.style.opacity = "0";
      v.style.pointerEvents = "none";

      const done = () => {
        v.removeEventListener("loadedmetadata", done);
        v.removeEventListener("canplay", done);
        v.removeEventListener("error", done);
        // stop + cleanup
        try {
          v.pause();
          v.removeAttribute("src");
          v.load();
        } catch {}
        v.remove();
        resolve();
      };

      v.addEventListener("loadedmetadata", done, { once: true });
      v.addEventListener("canplay", done, { once: true });
      v.addEventListener("error", done, { once: true });

      document.body.appendChild(v);
      v.src = url;
      v.load();
    });
  }

  async function prefetchOne(url: string) {
    if (!url) return;
    if (prefetched.has(url)) return;

    // if already in-flight, await it
    const existing = inflight.get(url);
    if (existing) return existing;

    // create promise and store inflight
    const p = new Promise<void>((resolve) => {
      enqueue(async () => {
        try {
          // best-effort hint
          preloadLink(url);

          // warm cache more reliably
          await warmWithVideo(url);

          prefetched.add(url);
        } finally {
          inflight.delete(url);
          resolve();
        }
      });
    });

    inflight.set(url, p);
    return p;
  }

  async function prefetchMany(urls: string[], limit = 4) {
    const unique = Array.from(new Set(urls.filter(Boolean)));
    const slice = unique.slice(0, limit);
    await Promise.all(slice.map((u) => prefetchOne(u)));
  }

  return {
    provide: {
      videoPrefetch: {
        one: prefetchOne,
        many: prefetchMany,
        // exposed mostly for debugging
        _prefetched: prefetched,
      },
    },
  };
});
