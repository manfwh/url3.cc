<script setup lang="ts">
import type { LocaleObject } from '@nuxtjs/i18n'
import languageNativeNames from '@/locales/languageNativeNames'

const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
</script>
<template>
  <UPopover :content="{ side: 'bottom', align: 'end' }">
    <UButton color="neutral" variant="ghost" icon="i-heroicons-language" />
    <template #content>
      <div class="p-2 w-36">
        <div>
          <UButton
            v-for="item in (locales as LocaleObject[])"
            :key="item.code"
            :to="switchLocalePath(item.code)"
            color="neutral"
            variant="ghost"
            class="w-full relative"
            :aria-label="locale === item.code ? `Currently selected language is ${languageNativeNames[locale as keyof typeof languageNativeNames]}` : `Switch language to {{ languageNativeNames[item.code as keyof typeof languageNativeNames] }}`"
            size="md"
          >
            <div class="space-x-3">
              <span>
                {{ languageNativeNames[item.code as keyof typeof languageNativeNames] }}
              </span>
            </div>
          </UButton>
        </div>
      </div>
    </template>
  </UPopover>
</template>
