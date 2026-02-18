// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/fonts'],
  fonts: {
    families: [
      {
        name: "Poppins",
        provider: "google",
        weights: [300, 400, 500, 600, 700],
        styles: ["normal", "italic"],
      },
      // {
      //   name: "Pacifico",
      //   provider: "google",
      //   weights: [400],
      //   styles: ["normal"],
      // },
    ],
  },
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
  }
})