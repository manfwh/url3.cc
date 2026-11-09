import { checkUrlSafety } from '#shared/utils/url-safety'
// 验证请求参数
export const validateRequest = (body: any) => {
  if (body.type === 'url' && (typeof body.url !== 'string' || !body.url.trim())) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unsafe URL',
      data: { code: 'unsafe_url', reason: 'invalid' }
    })
  }
  for (const value of [body.url, body.ios, body.android]) {
    if (typeof value !== 'string' || !value.trim()) { continue }
    const safety = checkUrlSafety(value)
    if (!safety.ok) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Unsafe URL',
        data: { code: 'unsafe_url', reason: safety.reason }
      })
    }
  }
  if (body.type === 'image' && !body.image) {
    throw new Error('Missing image')
  }
  // if (!body.key) {
  //   throw new Error('Missing key')
  // }
  if (body.key && body.key.includes('/')) {
    throw new Error('Invalid key')
  }
  // 去掉前后斜杠
  // const key = body.key.replace(/^\/+|\/+$/g, '')
  // if (key.length === 0) {
  //   throw new Error('Invalid key')
  // }
  return {
    ...body
  }
}

export const isBlackDomain = (url: string) => {
  const safety = checkUrlSafety(url)
  return !safety.ok && safety.reason === 'blacklist'
}
