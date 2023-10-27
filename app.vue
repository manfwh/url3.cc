<template>
  <NuxtLayout>
    <NuxtLoadingIndicator />
    <NuxtPage />
    <UNotifications :ui="{ position: 'top-0 right-0' }" :timeout="0" />
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
