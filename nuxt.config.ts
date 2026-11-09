// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-11-09',
  runtimeConfig: {
    // Server-only. Set SAFE_BROWSING_API_KEY or NUXT_SAFE_BROWSING_API_KEY.
    // Never put this under `public`.
    safeBrowsingApiKey: '',
    // Server-only Analytics Engine SQL reads. Vercel env (never NUXT_PUBLIC_*):
    // CF_ACCOUNT_ID, CF_ANALYTICS_API_TOKEN, optional CF_ANALYTICS_DATASET.
    // Nuxt aliases: NUXT_CF_ACCOUNT_ID, NUXT_CF_ANALYTICS_API_TOKEN, NUXT_CF_ANALYTICS_DATASET.
    cfAccountId: '',
    cfAnalyticsApiToken: '',
    cfAnalyticsDataset: 'url3-cc',
    // Server-only admin allowlist. Vercel: ADMIN_EMAILS, optional ADMIN_USER_IDS.
    // Nuxt aliases: NUXT_ADMIN_EMAILS, NUXT_ADMIN_USER_IDS. Never NUXT_PUBLIC_*.
    adminEmails: '',
    adminUserIds: ''
  },
  devtools: { enabled: false },
  typescript: {
    // Nuxt 4 defaults this on. Existing handlers index into known arrays and
    // objects; keep the Nuxt 3 checker behavior so the migration does not
    // rewrite those call sites.
    tsConfig: {
      compilerOptions: {
        noUncheckedIndexedAccess: false,
        types: ['node']
      }
    },
    nodeTsConfig: {
      compilerOptions: {
        noUncheckedIndexedAccess: false,
        types: ['node']
      }
    },
    sharedTsConfig: {
      compilerOptions: {
        noUncheckedIndexedAccess: false,
        types: ['node']
      }
    }
  },
  nitro: {
    typescript: {
      tsConfig: {
        compilerOptions: {
          noUncheckedIndexedAccess: false,
          types: ['node']
        }
      }
    }
  },
  modules: [
    '@nuxtjs/supabase',
    '@vueuse/nuxt',
    '@nuxt/ui',
    '@nuxtjs/i18n',
    '@nuxt/content',
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
    '@pinia/nuxt'
  ],
  css: ['~/assets/css/main.css', '~/assets/css/scrollbars.css'],
  supabase: {
    cookieOptions: {
      maxAge: 60 * 60 * 8,
      sameSite: 'lax',
      // Secure cookies are dropped on http://localhost, so only force them in production.
      secure: process.env.NODE_ENV === 'production'
      // domain: '.localhost'
    },
    redirect: false,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/']
    },
    types: '~~/shared/database.types.ts'
  },
  devServer: {
    port: 8888
  },
  build: {
    transpile: [/echarts/, 'vue-echarts', 'resize-detector']
  },
  fonts: {
    families: [
      { name: 'Inter', provider: 'google' }
    ]
  },
  i18n: {
    baseUrl: 'https://app.url3.cc',
    strategy: 'prefix_except_default',
    defaultLocale: 'en',
    restructureDir: '.',
    vueI18n: './i18n.config.ts',
    locales: [
      { code: 'en', language: 'en-US' },
      { code: 'zh', language: 'zh-TW' },
      { code: 'ja', language: 'ja-JP' },
      { code: 'ko', language: 'ko-KR' },
      { code: 'id', name: 'Bahasa Indonesia', language: 'id-ID' },
      { code: 'vi', name: 'Tiếng Việt', language: 'vi-VN' },
      { code: 'th', name: 'ไทย', language: 'th-TH' },
      { code: 'es', language: 'es-ES' },
      { code: 'pt', language: 'pt-BR' },
      { code: 'fr', language: 'fr-FR' },
      { code: 'ru', language: 'ru-RU' },
      { code: 'it', language: 'it-IT' },
      { code: 'de', language: 'de-DE' }
    ]
  },
  site: {
    url: 'https://app.url3.cc'
  },
  // Unprefixed rules also match locale paths (/zh/login, /de/dashboard, ...).
  // /login is noindex but still crawlable so a search engine can drop it.
  routeRules: {
    '/dashboard': { robots: 'noindex, nofollow' },
    '/dashboard/**': { robots: 'noindex, nofollow' },
    '/admin': { robots: 'noindex, nofollow' },
    '/admin/**': { robots: 'noindex, nofollow' },
    '/auth': { robots: 'noindex, nofollow' },
    '/auth/**': { robots: 'noindex, nofollow' },
    '/confirm': { robots: 'noindex, nofollow' },
    '/login': { robots: 'noindex, nofollow' },
    '/test': { robots: 'noindex, nofollow' },
    '/test/**': { robots: 'noindex, nofollow' }
  },
  robots: {
    credits: false,
    mergeWithRobotsTxtPath: false,
    sitemap: ['https://app.url3.cc/sitemap.xml'],
    // Prefix rules. @nuxtjs/robots expands each path across i18n locales.
    disallow: ['/dashboard', '/admin', '/auth', '/confirm', '/test']
  },
  sitemap: {
    xsl: false,
    exclude: [
      '/auth/**',
      '/test/**',
      '/confirm',
      '/dashboard',
      '/admin',
      '/admin/**',
      '/*/admin',
      '/*/admin/**',
      '/login',
      /^\/(?:[a-z]{2}\/)?login\/?$/
    ]
  }
})
