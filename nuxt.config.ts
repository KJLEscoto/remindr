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
        { name: "description", content: "Remindr - A reminder app" },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      ],
    },
  },
})