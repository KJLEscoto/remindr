// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // typescript: {
  //   typeCheck: true,
  // },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/fonts'],
  fonts: {
    families: [
      {
        name: "Poppins",
        provider: "google",
        weights: [300, 400, 500, 600, 700],
        styles: ["normal", "italic"],
      },
      {
        name: "Instrument Serif",
        provider: "google",
        weights: [400],
        styles: ["normal", "italic"],
      }
    ],
  },
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
  },
  app: {
  head: {
    title: "Remindr | KinWebb",
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },

      // SEO
      {
        name: "description",
        content:
          "A sleek, video-themed reminder app that allows you to set alarms, track countdowns, and mark tasks done with a clean, distraction-free interface. Designed and developed by KinWebb. © 2026 Kent Joemar Escoto.",
      },

      // Open Graph (previews: FB, Discord, iMessage, etc.)
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Remindr | KinWebb" },
      {
        property: "og:description",
        content:
          "A sleek, video-themed reminder app that allows you to set alarms, track countdowns, and mark tasks done with a clean, distraction-free interface.",
      },
      { property: "og:image", content: "/images/meta_thumbnail.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:type", content: "image/png" },

      // Twitter/X
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Remindr | KinWebb" },
      {
        name: "twitter:description",
        content:
          "A sleek, video-themed reminder app that allows you to set alarms, track countdowns, and mark tasks done with a clean, distraction-free interface.",
      },
      { name: "twitter:image", content: "/images/meta_thumbnail.png" },
    ],
    link: [{ rel: "icon", type: "image/png", href: "/remindr.png" }],
  },
},
})