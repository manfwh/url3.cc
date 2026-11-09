import type { MaybeRef } from 'vue'
import type { IntervalProps } from '~/lib/stats'

export const STATS_KEY = Symbol('stats stata') as InjectionKey<{
  interval: Ref<IntervalProps>
}>

export default function useStats () {
  const stata = inject(STATS_KEY)
  return stata
}

export function useLinkStatsUrl (endpoint: string) {
  const key = inject<MaybeRef<string | string[]>>('key', '')
  const base = inject<MaybeRef<string>>('statsApiBase', '/api/links')
  return computed(() => {
    const raw = unref(key)
    const linkKey = Array.isArray(raw) ? raw[0] : raw
    return `${unref(base)}/${linkKey}/stats/${endpoint}`
  })
}
