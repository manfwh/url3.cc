<template>
  <NuxtLoadingIndicator />
  <NuxtLayout>
    <NuxtPage />
    <UNotifications :timeout="0" />
  </NuxtLayout>
</template>
<script lang="ts" setup>
import { useUserStore } from '~/store/user'

const { t } = useI18n()
const { getUser } = useUserStore()
await callOnce(getUser)
useHead({
  title: t('site.title'),
  meta: [
    { name: 'description', content: t('site.description') }
  ]
})
</script>
