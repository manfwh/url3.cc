import { isValidUrl } from '~/server/utils'
// 验证请求参数
export const validateRequest = (body: any) => {
  if (body.type === 'url' && (!body.url || !isValidUrl(body.url))) {
    throw new Error('Invalid URL')
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
