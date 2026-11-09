const SITEMAP_URL = 'https://app.url3.cc/sitemap.xml'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('robots:robots-txt', (ctx) => {
    const lines = ctx.robotsTxt
      .split('\n')
      .filter(line => !/^sitemap:/i.test(line.trim()))
    while (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop()
    }
    lines.push(`Sitemap: ${SITEMAP_URL}`)
    ctx.robotsTxt = `${lines.join('\n')}\n`
  })
})