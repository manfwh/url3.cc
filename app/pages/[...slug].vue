<script setup lang="ts">
const route = useRoute()
const { data: page } = await useAsyncData(route.path, () => queryCollection('content').path(route.path).first())
</script>
<template>
  <UContainer class="max-w-4xl">
    <div class="prose dark:prose-invert">
      <ContentRenderer v-if="page" :value="page" />
    </div>
  </UContainer>
</template>
