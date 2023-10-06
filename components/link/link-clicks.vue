<script setup lang="ts">
const props = defineProps<{
  linkKey: string,
  clicks?: number | null
}>()
const { data: clicks } = useAsyncData(`link-${props.linkKey}-clicks`, async () => {
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
</script>
<template>
  <UTooltip :text="`clicks ${clicks}`">
    <UButton
      color="gray"
      size="xs"
      :to="`/dashboard/links/${linkKey}`"
      variant="soft"
      icon="i-heroicons-chart-bar-solid"
      class="  text-gray-500 dark:text-gray-400"
    >
      {{ clicks }}
    </UButton>
  </UTooltip>
</template>
