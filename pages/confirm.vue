<script setup lang="ts">
const user = useSupabaseUser()
const url = useRequestURL()
const redirect = url.searchParams.get('redirect')

watch(user, () => {
  if (user.value) {
    if (redirect) {
      return navigateTo(decodeURIComponent(redirect))
    }
    return navigateTo('/')
  }
}, { immediate: true })
</script>

<template>
  <div class="w-screen h-screen flex items-center justify-center">
    <p class="text-center">
      Redirecting...
    </p>
  </div>
</template>
