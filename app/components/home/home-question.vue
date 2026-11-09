<script setup lang="ts">
const { t } = useI18n()
useHead(() => ({
  script: [
    {
      key: 'ld-faq',
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [1, 2, 3, 4].map(index => ({
          '@type': 'Question',
          name: t(`questions.q${index}`),
          acceptedAnswer: {
            '@type': 'Answer',
            text: t(`questions.a${index}`)
          }
        }))
      })
    }
  ]
}))
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
    <UAccordion
      type="multiple"
      :unmount-on-hide="false"
      :items="items"
      :ui="{ item: 'last:border-b' }"
    >
      <template #default="{ item, index }">
        {{ index + 1 }}. {{ item.label }}
      </template>
      <template #trailing="{ open }">
        <UIcon
          name="i-lucide-chevron-down"
          class="size-5 ms-auto shrink-0 transition-transform duration-200"
          :class="open && 'rotate-180'"
        />
      </template>
    </UAccordion>
  </div>
</template>
