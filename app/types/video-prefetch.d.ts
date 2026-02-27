// ~/types/video-prefetch.d.ts
export {};

declare module "#app" {
  interface NuxtApp {
    $videoPrefetch: {
      one: (url: string) => Promise<void> | void;
      many: (urls: string[], limit?: number) => Promise<void>;
      _prefetched: Set<string>;
    };
  }
}

declare module "vue" {
  interface ComponentCustomProperties {
    $videoPrefetch: NuxtApp["$videoPrefetch"];
  }
}
