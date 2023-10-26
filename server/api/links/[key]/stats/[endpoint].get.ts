import { IntervalProps } from '~/lib/stats'

export const intervalData = {
  '1h': {
    startDate: new Date(Date.now() - 3600000),
    granularity: 'minute'
  },
  '24h': {
    startDate: new Date(Date.now() - 86400000),
    granularity: 'hour'
  },
  '7d': {
    startDate: new Date(Date.now() - 604800000),
    granularity: 'day'
  },
  '30d': {
    startDate: new Date(Date.now() - 2592000000),
    granularity: 'day'
  },
  '90d': {
    startDate: new Date(Date.now() - 7776000000),
    granularity: 'month'
  },
  all: {
    startDate: new Date('2022-09-22'),
    granularity: 'month'
  }
}
export default defineAuthHandler(async (event) => {
  const { interval } = getQuery(event) as {interval: IntervalProps }
  const { endpoint, key } = getRouterParams(event)
  const url = new URL(
    `https://api.us-east.tinybird.co/v0/pipes/${endpoint}.json`
  )
  url.searchParams.append('key', decodeURIComponent(key))

  if (interval) {
    url.searchParams.append(
      'start',
      intervalData[interval].startDate
        .toISOString()
        .replace('T', ' ')
        .replace('Z', '')
    )
    url.searchParams.append(
      'end',
      new Date(Date.now()).toISOString().replace('T', ' ').replace('Z', '')
    )

    url.searchParams.append('granularity', intervalData[interval].granularity)
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${process.env.TINYBIRD_API_KEY}`
    }
  })
    .then(res => res.json())
    .then(({ data }) => {
      if (endpoint === 'clicks') {
        try {
          const clicks = data[0]['count()']
          return clicks || '0'
        } catch (e) {
          console.log(e)
        }
      }
      return data as any[]
    })
  return res
})
