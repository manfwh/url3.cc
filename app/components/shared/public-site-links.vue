<script setup lang="ts">
withDefaults(defineProps<{
  includeHome?: boolean
}>(), {
  includeHome: true
})

const localePath = useLocalePath()
const homeHref = computed(() => localePath('/'))
const featuresHref = computed(() => `${localePath('/')}#features`)
const faqHref = computed(() => `${localePath('/')}#faq`)
const loginHref = computed(() => localePath('/login'))
</script>

<template>
  <nav aria-label="URL3.cc" class="flex flex-wrap items-center gap-x-5 gap-y-2">
    <NuxtLink v-if="includeHome" class="hover:text-primary transition-colors" :to="homeHref">
      URL3.cc
    </NuxtLink>
    <NuxtLink class="hover:text-primary transition-colors" :to="featuresHref">
      {{ $t('features.features') }}
    </NuxtLink>
    <NuxtLink class="hover:text-primary transition-colors" :to="faqHref">
      {{ $t('questions.questions') }}
    </NuxtLink>
    <NuxtLink class="hover:text-primary transition-colors" :to="loginHref">
      {{ $t('common.SignIn') }}
    </NuxtLink>
  </nav>
</template>
