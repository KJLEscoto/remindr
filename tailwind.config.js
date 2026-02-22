/** @type {import('tailwindcss').Config} */
export default {
  content: {
    files: [
      // all directories and extensions will correspond to your Nuxt config
      "srcDir/components/**/*.{vue,js,jsx,mjs,ts,tsx}",
      "srcDir/layouts/**/*.{vue,js,jsx,mjs,ts,tsx}",
      "srcDir/pages/**/*.{vue,js,jsx,mjs,ts,tsx}",
      "srcDir/plugins/**/*.{js,ts,mjs}",
      "srcDir/composables/**/*.{js,ts,mjs}",
      "srcDir/utils/**/*.{js,ts,mjs}",
      "srcDir/{A,a}pp.{vue,js,jsx,mjs,ts,tsx}",
      "srcDir/{E,e}rror.{vue,js,jsx,mjs,ts,tsx}",
      "srcDir/app.config.{js,ts,mjs}",
      "srcDir/app/spa-loading-template.html",

      // ✅ if you're using Nuxt 4 app/ structure, include this too:
      "srcDir/app/**/*.{vue,js,jsx,mjs,ts,tsx}",
    ],
  },
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "ui-sans-serif", "system-ui"],
        instrument: ["Instrument Serif", "ui-serif", "system-ui"],
        // pacifico: ["Pacifico", "cursive", "system-ui"],
      },
    },
  },
  plugins: [],
};
