<script setup lang="ts">
const { t } = useI18n()
const features = [
  {
    emoji: '📈',
    title: t('features.analysis'),
    description: t('features.analysis_description')
  },
  {
    emoji: '📱',
    title: t('features.devices_target'),
    description: t('features.devices_target_description')
  },
  {
    emoji: '✨',
    title: t('features.custom'),
    description: t('features.custom_description')
  }
]
</script>
<template>
  <div class="py-24 sm:py-32">
    <div class="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl gap-16 sm:gap-y-24 flex flex-col">
      <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl text-center">
        {{ $t('features.features') }}
      </h2>
      <div class="grid grid-cols-3 gap-8">
        <UCard v-for="item in features" :key="item.emoji">
          <div class="w-10 h-10 rounded bg-slate-100 dark:bg-slate-700 flex justify-center items-center">
            {{ item.emoji }}
          </div>
          <h3 class="text-lg mt-4">
            {{ item.title }}
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mt-2">
            {{ item.description }}
          </p>
        </UCard>
      </div>
    </div>
  </div>
</template>
