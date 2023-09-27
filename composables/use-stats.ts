import { IntervalProps } from '~/lib/stats'

export const STATS_KEY = Symbol('stats stata') as InjectionKey<{
  interval: Ref<IntervalProps>
}>

export default function useStats () {
  const stata = inject(STATS_KEY)
  return stata
}
