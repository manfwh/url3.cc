// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: [
    ['@nuxtjs/eslint-module', { lintOnStart: false }],
    '@nuxtjs/supabase',
    '@vueuse/nuxt',
    '@nuxt/ui',
    '@nuxtjs/fontaine',
    '@nuxtjs/i18n',
    '@nuxt/content'
  ],
  css: ['~/assets/css/main.css', '~/assets/css/scrollbars.css'],
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
    transpile: [/echarts/]
  },
  ui: {
    icons: ['lucide']
  },
  i18n: {
    baseUrl: 'https://url3.cc',
    locales: [{
      code: 'en',
      iso: 'en-US',
      foo: 'bar'
    }, {
      code: 'zh',
      iso: 'zh-TW',
      foo: 'bar'
    }, {
      code: 'ja',
      iso: 'ja-JP',
      foo: 'bar'
    }],
    defaultLocale: 'en'
  },
  content: {
    highlight: {
      theme: 'material-theme'
      // Theme used in all color schemes.
      // theme: 'github-light'

    }
  }
})
