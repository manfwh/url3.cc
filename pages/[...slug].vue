<script setup lang="ts">
const route = useRoute()
const { data: page } = await useAsyncData(route.path, () => queryContent(route.path).findOne())
console.log('page', page.value)
</script>
<template>
  <UContainer :ui="{ constrained: 'max-w-4xl' }">
    <div class="prose dark:prose-invert">
      <ContentRenderer v-if="page && page.body" :value="page" />
    </div>
  </UContainer>
</template>
