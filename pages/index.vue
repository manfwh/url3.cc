<script setup lang="ts">
import languageNativeNames from '@/locales/languageNativeNames'
const supabase = useSupabaseClient()
// const links = useStorage<{key: string, url: string}[]>('links', [])

// const deleteLink = (key: string) => {
//   links.value = links.value.filter(link => link.key !== key)
// }
const { data: { session } } = await supabase.auth.getSession()
const signInWithGitHub = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      // redirectTo: 'http://localhost:3000/confirm'
    }
  })
}
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
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
                      v-for="item in locales"
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
            <button v-if="!session" type="button" @click="signInWithGitHub">
              Github 登录
            </button>
            <UButton v-else to="/dashboard" variant="outline">
              Dashboard
            </UButton>
          </div>
        </div>
      </div>
    </div>
    <h1 class="text-6xl text-center text-gray-800 dark:text-gray-100 mt-24 font-bold mb-8">
      {{ $t('hero.title.part_1') }} <span class="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-400">{{ $t('hero.title.part_2') }}</span> {{ $t('hero.title.part_3') }}
    </h1>
    <p class="text-center text-gray-700 dark:text-gray-300">
      {{ $t('hero.description') }}
    </p>
    <HomeDemoCreate />
    <Background />
  </div>
</template>
