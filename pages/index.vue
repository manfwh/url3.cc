<script setup lang="ts">
import languageNativeNames from '@/locales/languageNativeNames'
const supabase = useSupabaseClient()
const { data: { session } } = await supabase.auth.getSession()

const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const localePath = useLocalePath()
const user = useSupabaseUser()

const items = [
  [{
    label: user.value?.email || '-',
    slot: 'account',
    disabled: true
  }],
  [{
    label: 'Sign out',
    icon: 'i-heroicons-arrow-left-on-rectangle',
    click: async () => {
      await supabase.auth.signOut()
      location.reload()
    }
  }]
]

</script>
<template>
  <div>
    <div class="sticky inset-x-0 top-0 z-30 w-full border-b dark:border-gray-600 backdrop-blur-lg">
      <div class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20">
        <div class="flex justify-between items-center h-16">
          <div>
            <h1 class="text-primary font-semibold text-2xl">
              <nuxt-link to="/">
                URL3.cc
              </nuxt-link>
            </h1>
          </div>
          <div class="flex items-center space-x-4">
            <UPopover
              :ui="{popper: {
                placement: 'bottom-end'
              }}"
            >
              <template #default>
                <UButton color="gray" variant="ghost" icon="i-heroicons-language" />
              </template>
              <template #panel>
                <div class="p-2 w-36">
                  <div>
                    <UButton
                      v-for="item in (locales as string[])"
                      :key="item"
                      :to="switchLocalePath(item as string)"
                      color="gray"
                      variant="ghost"
                      class="w-full relative"
                      :aria-label="locale === item ? `Currently selected language is ${languageNativeNames[locale as keyof typeof languageNativeNames]}` : `Switch language to {{ languageNativeNames[item as keyof typeof languageNativeNames] }}`"
                      size="md"
                    >
                      <div class="space-x-3">
                        <span>
                          {{ languageNativeNames[item as keyof typeof languageNativeNames] }}
                        </span>
                      </div>
                    </UButton>
                  </div>
                </div>
              </template>
            </UPopover>
            <SharedColorModeButton />

            <UButton v-if="!session" variant="outline" :to="localePath('/login')">
              {{ $t('common.SignIn') }}
            </UButton>
            <UButton v-else :to="localePath('/dashboard')" variant="outline">
              {{ $t('common.Dashboard') }}
            </UButton>
            <UDropdown
              v-if="user"
              :items="items"
              :ui="{ item: { disabled: 'cursor-text select-text' } }"
              :popper="{ placement: 'bottom-end' }"
            >
              <UAvatar :src="user.user_metadata.avatar_url" />
              <template #account="{ item }">
                <div class="text-left">
                  <p class="truncate font-medium text-gray-900 dark:text-white">
                    {{ item.label }}
                  </p>
                </div>
              </template>
            </UDropdown>
          </div>
        </div>
      </div>
    </div>
    <h1 class="text-6xl text-center text-gray-800 dark:text-gray-100 mt-24 font-bold mb-8">
      {{ $t('hero.title.part_1') }}
      <span class="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-400">{{ $t('hero.title.part_2') }}</span> {{ $t('hero.title.part_3') }}
    </h1>
    <p class="text-center text-gray-700 dark:text-gray-300">
      {{ $t('hero.description') }}
    </p>
    <HomeDemoCreate />
    <div class="py-24 sm:py-32">
      <div class="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl gap-16 sm:gap-y-24 flex flex-col">
        <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl text-center">
          Features
        </h2>
        <div class="grid grid-cols-3">
          <UCard>
            d1
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>
