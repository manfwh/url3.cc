<template>
  <div>
    <!-- color="repeating-linear-gradient(to right,var(--c-primary) 0%,var(--c-primary-active) 100%)" -->
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UNotifications />
  </div>
</template>
<script lang="ts" setup>
useHead({
  title: 'URL Shortener Tool - Url3.cc',
  meta: [
    { name: 'description', content: "Effortlessly shorten your links for improved sharing efficiency. Customize your short URLs, track click data, and gain insights into your links' performance." }
  ]
})
</script>
