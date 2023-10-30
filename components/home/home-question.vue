<script setup lang="ts">
const { t } = useI18n()
const items = [
  {
    label: t('questions.q1'),
    content: t('questions.a1')
  },
  {
    label: t('questions.q2'),
    content: t('questions.a2')
  },
  {
    label: t('questions.q3'),
    content: t('questions.a3')
  },
  {
    label: t('questions.q4'),
    content: t('questions.a4')
  }

]
</script>

<template>
  <div class="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pb-20">
    <h2 class="text-3xl font-bold mb-8 tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl text-center">
      {{ $t('questions.questions') }}
    </h2>
    <UAccordion :items="items" multiple>
      <template #default="{ item, index, open }">
        <UButton color="gray" variant="ghost" class="border-b border-gray-200 dark:border-gray-700" :ui="{ rounded :'rounded-none', padding: { sm:'p-3' } }">
          <span class="truncate">{{ index + 1 }}. {{ item.label }}</span>
          <template #trailing>
            <UIcon
              name="i-heroicons-chevron-right-20-solid"
              class="w-5 h-5 ms-auto transform transition-transform duration-200"
              :class="[open && 'rotate-90']"
            />
          </template>
        </UButton>
      </template>
    </UAccordion>
  </div>
</template>
