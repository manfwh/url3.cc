<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'noauth'
})
</script>
<template>
  <div class="text-center min-h-[calc(100vh-64px)] flex flex-col justify-center">
    <h1 class="text-2xl mb-8 flex items-center justify-center">
      <UIcon name="i-heroicons-envelope" class="mr-4" />
      Check your email
    </h1>
    <p>A sign in link has been sent to your email address.</p>
  </div>
</template>
