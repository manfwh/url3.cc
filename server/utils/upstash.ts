import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { nanoid } from '~/server/utils'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || ''
})

export const ratelimit = (
  requests: number = 10,
  seconds:
    | `${number} ms`
    | `${number} s`
    | `${number} m`
    | `${number} h`
    | `${number} d` = '10 s'
) => {
  return process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(requests, seconds),
      analytics: true,
      prefix: 'shortLink/ratelimit'
    })
    : {
        limit: () => ({ success: true })
      }
}
type Expire = 1800 | 86400 | 604800 | 2592000 // 30 分 | 24 小时 | 1 周 | 1 月
export async function setRandomKey (data: {
  url?:string,
  type?: string,
  image?: string
}, ex: Expire = 1800): Promise<{response: string; key: string}> {
  const key = nanoid()
  const response = await redis.set(
    `short-link:${key}`,
    {
      ...data,
      is_demo: true
    },
    {
      nx: true,
      ex
    }
  )
  if (response !== 'OK') {
    return setRandomKey(data)
  } else {
    return {
      response,
      key
    }
  }
}
