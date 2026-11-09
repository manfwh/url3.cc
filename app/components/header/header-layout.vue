<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useUserStore } from '~/store/user'

const userStore = useUserStore()
const { user: userInfo } = storeToRefs(userStore)
const localePath = useLocalePath()
const items = computed(() => [
  [{
    label: userInfo.value?.email || '-',
    slot: 'account',
    disabled: true
  }],
  [{
    label: 'Sign out',
    icon: 'i-heroicons-arrow-left-on-rectangle',
    onSelect: async () => {
      await userStore.signOut()
      location.reload()
    }
  }]
])
</script>
<template>
  <div class="sticky inset-x-0 top-0 z-30 w-full border-b dark:border-gray-600 backdrop-blur-lg">
    <div class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20">
      <div class="flex justify-between items-center h-16">
        <h1 class="text-primary font-semibold text-sl md:text-2xl ">
          <nuxt-link :to="localePath('/')" class="flex items-center">
            <img src="~/assets/imgs/logo.png" alt="logo" class="w-8 h-8 md:w-10 md:h-10 mr-2 block">
            URL3.cc
          </nuxt-link>
        </h1>
        <div class="flex items-center space-x-4">
          <div class="flex">
            <SharedSwitchLanguage class="hidden md:block" />
            <SharedColorModeButton class="hidden md:block" />
          </div>

          <UButton v-if="!userInfo" variant="outline" :to="localePath('/login')">
            {{ $t('common.SignIn') }}
          </UButton>
          <UButton v-else :to="localePath('/dashboard')" variant="outline">
            {{ $t('common.Dashboard') }}
          </UButton>
          <UDropdownMenu
            v-if="userInfo"
            :items="items"
            :content="{ side: 'bottom', align: 'end' }"
          >
            <UAvatar :src="userInfo?.avatar" />
            <template #account="{ item }">
              <div class="text-left">
                <p class="truncate font-medium text-gray-900 dark:text-white">
                  {{ item.label }}
                </p>
              </div>
            </template>
          </UDropdownMenu>
        </div>
      </div>
    </div>
  </div>
</template>
