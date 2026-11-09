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

const supabaseUser = useSupabaseUser()
const { getUser } = useUserStore()
await callOnce(getUser)
watch(supabaseUser, () => {
  getUser()
})
useSiteSeo()
</script>
