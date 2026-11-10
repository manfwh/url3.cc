<script setup lang="ts">
const { t, locale } = useI18n()
const items = computed(() => {
  void locale.value
  return [1, 2, 3, 4].map(index => ({
    label: t(`questions.q${index}`),
    content: t(`questions.a${index}`)
  }))
})
useHead(() => ({
  script: [
    {
      key: 'ld-faq',
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.value.map(item => ({
          '@type': 'Question',
          name: item.label,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.content
          }
        }))
      })
    }
  ]
}))
</script>

<template>
  <div id="faq" class="scroll-mt-24 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pb-20">
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
