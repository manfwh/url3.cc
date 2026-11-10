<script setup lang="ts">

</script>
<template>
  <h1 class="text-6xl text-center text-gray-800 dark:text-gray-100 mt-24 font-bold mb-8">
    {{ $t('hero.title.part_1') }}
    <span class="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-400">{{ $t('hero.title.part_2') }}</span> {{ $t('hero.title.part_3') }}
  </h1>
  <p class="text-center text-gray-700 dark:text-gray-300 font-[Inter]">
    {{ $t('hero.description') }}
  </p>
  <HomeDemoCreate />
  <HomeFeatures />
  <HomeQuestion />
</template>
