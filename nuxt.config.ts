import {fileURLToPath} from 'node:url';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@nuxt/ui"],
  nitro: {
    publicAssets: [
      {
        baseURL: 'kern/hensel-chorales',
        dir: fileURLToPath (new URL('./hensel-chorales/kern', import.meta.url)),
        maxAge: 3600,
      },
    ],
  },
})