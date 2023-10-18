<template>
  <NuxtLayout>
    <NuxtLoadingIndicator />
    <NuxtPage />
    <UNotifications />
  </NuxtLayout>
</template>
<script lang="ts" setup>
const { t } = useI18n()
useHead({
  title: t('site.title'),
  meta: [
    { name: 'description', content: t('site.description') }
  ]
})
</script>
