const domain = 'url3.cc'
const fullDomain = `https://${domain}/`
export default defineAppConfig({
  domain,
  fullDomain,
  ui: {
    button: {
      color: {
        gray: {
          ghost: 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400'
        }
      }
    },
    tooltip: {
      base: '[@media(pointer:coarse)]:hidden h-8 px-2 py-2 text-xs font-normal truncate',
      background: 'bg-black dark:bg-white',
      color: 'dark:text-gray-900 text-white',
      popper: {
        placement: 'top'
      }
    },
    modal: {
      inner: 'fixed inset-0 overflow-y-auto w-screen'
    }
  }
})
