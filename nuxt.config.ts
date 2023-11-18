// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: [
    ['@nuxtjs/eslint-module', { lintOnStart: false }],
    '@nuxtjs/supabase',
    '@vueuse/nuxt',
    '@nuxt/ui',
    '@nuxtjs/google-fonts',
    '@nuxtjs/i18n',
    '@nuxt/content',
    'nuxt-simple-sitemap'
  ],
  css: ['~/assets/css/main.css', '~/assets/css/scrollbars.css'],
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
  } as any,
  devServer: {
    port: 8888
  },
  build: {
    transpile: [/echarts/, 'vue-echarts', 'resize-detector']
  },
  ui: {
    icons: ['lucide']
  },
  i18n: {
    baseUrl: 'https://app.url3.cc',
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
  },
  googleFonts: {
    families: {
      Inter: true
    }
  },
  site: {
    url: 'https://app.url3.cc'
  },
  sitemap: {
    exclude: ['/auth/**', '/test/**', '/confirm', '/dashboard']
  }
})
