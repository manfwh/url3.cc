const domain = 'url3.cc'
const fullDomain = `https://${domain}/`
export default defineAppConfig({
  domain,
  fullDomain,
  ui: {
    colors: {
      primary: 'green',
      neutral: 'gray'
    },
    icons: {
      loading: 'i-lucide-loader'
    },
    button: {
      slots: {
        base: 'transition-colors'
      }
    },
    input: {
      slots: {
        root: 'w-full'
      }
    },
    textarea: {
      slots: {
        root: 'w-full'
      }
    },
    selectMenu: {
      slots: {
        base: 'w-full'
      }
    }
  }
})
