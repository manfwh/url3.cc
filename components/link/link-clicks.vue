<script setup lang="ts">
const props = defineProps<{
  linkKey: string,
  clicks?: number | null
}>()
const { data: clicks, status } = useAsyncData(`link-${props.linkKey}-clicks`, async () => {
  if (props.clicks === undefined) {
    const res = await $fetch(`/api/links/${props.linkKey}/stats/clicks`, {
      params: {
        interval: 'all'
      }
    })
    return res
  } else {
    return props.clicks
  }
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
    <span v-else class="w-3 text-center">{{ clicks }} </span>
    clicks
  </UButton>
</template>
