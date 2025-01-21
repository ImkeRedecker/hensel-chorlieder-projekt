import {fileURLToPath} from 'node:url';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: ["@nuxt/ui"],
  vite: {
    worker: {
        format: 'es',
    },
    optimizeDeps: {
        exclude: ['verovio'],
    },
  },
  nitro: {
    publicAssets: [
      {
        baseURL: 'kern/hensel-chorlieder',
        dir: fileURLToPath (new URL('./hensel-chorlieder/kern', import.meta.url)),
        maxAge: 3600,
      },
    ],
  },
  colorMode: {
    preference: 'light',
  },
});
