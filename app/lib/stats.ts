export type IntervalProps = '1h' | '24h' | '7d' | '30d' | '90d' | 'all';
export const INTERVALS: {display: string, slug: IntervalProps}[] = [
  {
    display: 'Last hour',
    slug: '1h'
  },
  {
    display: 'Last 24 hours',
    slug: '24h'
  },
  {
    display: 'Last 7 days',
    slug: '7d'
  },
  {
    display: 'Last 30 days',
    slug: '30d'
  },
  {
    display: 'Last 3 months',
    slug: '90d'
  },
  {
    display: 'All Time',
    slug: 'all'
  }
]
