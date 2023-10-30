<script setup lang="ts">
const supabase = useSupabaseClient()
const { data: { session } } = await supabase.auth.getSession()

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
  <div class="sticky inset-x-0 top-0 z-30 w-full border-b dark:border-gray-600 backdrop-blur-lg">
    <div class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20">
      <div class="flex justify-between items-center h-16">
        <h1 class="text-primary font-semibold text-sl md:text-2xl ">
          <nuxt-link to="/" class="flex items-center">
            <img src="~/assets/imgs/logo.png" alt="logo" class="w-8 h-8 md:w-10 md:h-10 mr-2 block">
            URL3.cc
          </nuxt-link>
        </h1>
        <div class="flex items-center space-x-4">
          <SharedSwitchLanguage class="hidden md:block" />
          <SharedColorModeButton class="hidden md:block" />

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
  <p class="text-center text-gray-700 dark:text-gray-300 font-[Inter]">
    {{ $t('hero.description') }}
  </p>
  <HomeDemoCreate />
  <HomeFeatures />
  <HomeQuestion />
</template>
