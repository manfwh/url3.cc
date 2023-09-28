<script setup lang="ts">
const items = [{
  label: 'Tab1',
  content: 'This is the content shown for Tab1'
}, {
  label: 'Tab2',
  disabled: true,
  content: 'And, this is the content for Tab2'
}, {
  label: 'Tab3',
  content: 'Finally, this is the content for Tab3'
}]
const key = inject('key')
const stats = useStats()

const { data, pending, error } = useFetch(`/api/links/${key}/stats/device`, {
  params: {
    interval: stats?.interval
  },
  lazy: true
})
</script>
<template>
  <UCard>
    <div class="flex justify-between">
      <h2>Device</h2>
      <UTabs :items="items" />
    </div>
  </UCard>
</template>
