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

export async function setRandomKey (url:string): Promise<{response: string; key: string}> {
  const key = nanoid()
  const response = await redis.set(
    `short-link:${key}`,
    { url },
    {
      nx: true,
      ex: 30 * 60
    }
  )
  if (response !== 'OK') {
    return setRandomKey(url)
  } else {
    return {
      response,
      key
    }
  }
}
