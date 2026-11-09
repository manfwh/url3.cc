<template>
  <UApp>
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
<script lang="ts" setup>
import { useUserStore } from '~/store/user'

const { t } = useI18n()
const supabaseUser = useSupabaseUser()
const { getUser } = useUserStore()
await callOnce(getUser)
watch(supabaseUser, () => {
  getUser()
})
useHead({
  title: t('site.title'),
  meta: [
    { name: 'description', content: t('site.description') }
  ]
})
</script>
