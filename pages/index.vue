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
            <SharedSwitchLanguage />
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
        <div class="grid grid-cols-3 gap-8">
          <UCard>
            <div class="w-10 h-10 rounded bg-slate-100 flex justify-center items-center">
              📊
            </div>
            <h3 class="text-lg mt-4">
              Analysis
            </h3>
            <p class="text-gray-600 mt-2">
              轻松查看您的短网址的点击量和访问来源，帮助您更好地了解您的目标受众。
            </p>
          </UCard>
          <UCard>
            <div class="w-10 h-10 rounded bg-slate-100 flex justify-center items-center">
              📱
            </div>
            <h3 class="text-lg mt-4">
              设备类型跳转
            </h3>
            <p class="text-gray-600 mt-2">
              根据访问者的设备类型（如手机、平板或电脑），智能跳转至最适合的页面，提供更好的用户体验。
            </p>
          </UCard>
          <UCard>
            <div class="w-10 h-10 rounded bg-slate-100 flex justify-center items-center">
              ✨
            </div>
            <h3 class="text-lg mt-4">
              自定义链接
            </h3>
            <p class="text-gray-600 mt-2">
              随心所欲地为您的长网址创建有趣的短网址，使分享变得更简单、更有趣！
            </p>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>
