export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const userAgent = getRequestHeader(event, 'user-agent')
    if (userAgent && userAgent.match(/Win[a-z0-9]*;/)) {
      html.htmlAttrs.push('class=nuxt-ui-scrollbars')
    }
  })
})
