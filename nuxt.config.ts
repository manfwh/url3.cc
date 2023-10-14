// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: [
    ['@nuxtjs/eslint-module', { lintOnStart: false }],
    '@nuxtjs/supabase',
    '@vueuse/nuxt',
    '@nuxt/ui',
    '@nuxtjs/fontaine'
  ],
  css: ['~/assets/css/main.css'],
  fontMetrics: {
    fonts: [
      {
        family: 'Poppins',
        fallbacks: ['Georgia'],
        fallbackName: 'fallback-poppins',
        src: 'fonts/poppins.ttf',
        root: 'assets'
      }
    ]
  },
  supabase: {
    cookieOptions: {
      maxAge: 60 * 60 * 8,
      sameSite: 'lax',
      secure: true
      // domain: '.localhost'
    },
    redirect: false,
    redirectOptions: {
      login: '/login',
      exclude: ['/']
    } as any
  },
  devServer: {
    port: 8888
  },
  build: {
    transpile: ['vue-sonner', /echarts/]
  },
  ui: {
    icons: ['lucide']
  }
})
