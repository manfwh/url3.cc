<script setup lang="ts">
import { absoluteUrl } from '~/utils/public-seo'

const route = useRoute()
const { data: page } = await useAsyncData(route.path, () => queryCollection('content').path(route.path).first())
const robots = useRobotsRule()
if (!page.value) {
  robots.value = { noindex: true, nofollow: true }
}

useHead(() => {
  if (!page.value) {
    return {
      meta: [{ key: 'robots', name: 'robots', content: 'noindex, nofollow' }]
    }
  }
  return {
    link: [{ key: 'canonical', rel: 'canonical', href: absoluteUrl(route.path) }]
  }
})
</script>
<template>
  <UContainer class="max-w-4xl">
    <div class="prose dark:prose-invert">
      <ContentRenderer v-if="page" :value="page" />
    </div>
  </UContainer>
</template>
