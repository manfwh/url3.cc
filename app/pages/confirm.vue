<script setup lang="ts">
import { safeInternalPath } from '~/utils/safe-redirect'

const user = useSupabaseUser()
const localePath = useLocalePath()
const url = useRequestURL()
const redirect = safeInternalPath(url.searchParams.get('redirect'))
const authError = ref(url.searchParams.get('error_description') || url.searchParams.get('error') || '')

function readHashAuthError () {
  if (!import.meta.client || window.location.hash.length < 2) { return '' }
  const hash = new URLSearchParams(window.location.hash.slice(1))
  return hash.get('error_description') || hash.get('error') || ''
}

watch(user, () => {
  if (user.value) {
    return navigateTo(redirect || localePath('/'))
  }
}, { immediate: true })

onMounted(() => {
  const hashError = readHashAuthError()
  if (hashError) { authError.value = hashError }
  window.setTimeout(() => {
    if (!user.value && !authError.value) {
      authError.value = 'Sign-in did not finish. Try again from the login page.'
    }
  }, 8000)
})
</script>

<template>
  <div class="w-screen h-screen flex items-center justify-center px-4">
    <div class="text-center max-w-md">
      <p v-if="authError" class="text-red-500 mb-4">
        {{ authError }}
      </p>
      <p v-else class="text-center">
        Redirecting...
      </p>
      <NuxtLink v-if="authError" class="text-primary underline" :to="localePath('/login')">
        Back to sign in
      </NuxtLink>
    </div>
  </div>
</template>
