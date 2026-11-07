<script setup lang="ts">
import { readPublicClickTotal } from '~/utils/public-clicks'

const props = defineProps<{
  linkKey: string,
  clicks?: number | null,
  publicTotal?: boolean
}>()
const lastTotal = ref(0)
const { data: clicks, status, refresh } = useAsyncData(`link-${props.linkKey}-${props.publicTotal ? 'public' : 'clicks'}`, async () => {
  if (props.publicTotal) {
    try {
      const res = await $fetch(`/api/public/links/${encodeURIComponent(props.linkKey)}/clicks`)
      const total = readPublicClickTotal(res)
      lastTotal.value = total
      return total
    } catch {
      return lastTotal.value
    }
  }
  if (props.clicks === undefined) {
    const res = await $fetch<number>(`/api/links/${encodeURIComponent(props.linkKey)}/stats/clicks`, {
      params: {
        interval: 'all'
      }
    })
    return res
  } else {
    return props.clicks
  }
})

const PUBLIC_TOTAL_REFRESH_MS = 20_000
let poll: ReturnType<typeof setInterval> | undefined

function stopPoll () {
  if (!poll) { return }
  clearInterval(poll)
  poll = undefined
}

function startPoll () {
  if (!props.publicTotal || poll) { return }
  poll = setInterval(() => { refresh() }, PUBLIC_TOTAL_REFRESH_MS)
}

function onVisible () {
  if (!props.publicTotal) { return }
  if (document.visibilityState === 'hidden') {
    stopPoll()
    return
  }
  refresh()
  startPoll()
}

onMounted(() => {
  if (!props.publicTotal) { return }
  startPoll()
  document.addEventListener('visibilitychange', onVisible)
})

onBeforeUnmount(() => {
  stopPoll()
  document.removeEventListener('visibilitychange', onVisible)
})

const localePath = useLocalePath()

</script>
<template>
  <UButton
    color="gray"
    size="xs"
    :to="localePath(`/dashboard/links/${linkKey}`)"
    variant="soft"
    icon="i-heroicons-chart-bar-solid"
    class="  text-gray-500 dark:text-gray-400"
  >
    <USkeleton v-if="(status === 'pending' || status === 'idle') && clicks === undefined" class="w-3 h-5" />
    <span v-else class="min-w-[12px] text-center">{{ clicks }} </span>
    clicks
  </UButton>
</template>
