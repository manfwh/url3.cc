<script lang="ts" setup>
const user = useSupabaseUser()
const supabase = useSupabase()
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

// const { data: projects } = await useAsyncData('projects', async () => {
//   return await supabase.from('projects').select('*')
// }, {
//   lazy: true
// })
const route = useRoute()
const localePath = useLocalePath()
</script>

<template>
  <div>
    <div class="sticky left-0 right-0 top-0 z-20 bg-white dark:bg-black border-b  border-gray-200 dark:border-gray-700 ">
      <div class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20">
        <div class="flex justify-between items-center h-16">
          <div class="flex">
            <h1 class="text-primary font-semibold text-sl md:text-2xl ">
              <nuxt-link :to="localePath('/')" class="flex items-center">
                <img src="~/assets/imgs/logo.png" alt="logo" class="w-8 h-8 md:w-10 md:h-10 mr-2 block">
                URL3.cc
              </nuxt-link>
            </h1>
            <!-- <div v-if="user">
              <UPopover
                :ui="{popper: {
                  placement: 'bottom-start'
                }}"
              >
                <template #default>
                  <UButton color="gray" variant="ghost" label="open">
                    <template #leading>
                      <UAvatar :src="user.user_metadata.avatar_url" size="xs" />
                    </template>
                    <div class="ml-1 mr-2">
                      <span>
                        {{ user.user_metadata.user_name }}
                      </span>
                    </div>
                    <template #trailing>
                      <UIcon name="i-heroicons-chevron-up-down-20-solid" class="w-4 h-4" />
                    </template>
                  </UButton>
                </template>

                <template #panel="{close}">
                  <div class="p-2">
                    <div class="w-48">
                      <div class="p-2 text-xs text-gray-500">
                        Personal Account
                      </div>
                      <UButton
                        to="/dashboard"
                        color="gray"
                        variant="ghost"
                        class="w-full relative"
                        size="md"
                        @click="close"
                      >
                        <template #leading>
                          <UAvatar :src="user.user_metadata.avatar_url" size="sm" />
                        </template>
                        <div class="space-x-3">
                          <span>
                            {{ user.user_metadata.user_name }}
                          </span>
                        </div>
                        <template v-if="route.path === '/dashboard'" #trailing>
                          <span class="absolute inset-y-0 right-0 flex items-center pr-3">
                            <UIcon name="i-heroicons-check" class="w-5 h-5" />
                          </span>
                        </template>
                      </UButton>
                      <div class="p-2 text-xs text-gray-500">
                        Personal Account
                      </div>
                      <UButton
                        v-for="item in projects?.data"
                        :key="item.id"
                        :to="`/dashboard/${item.slug}`"
                        color="gray"
                        variant="ghost"
                        class="w-full relative"
                        size="md"
                        @click="close"
                      >
                        <template #leading>
                          <UAvatar :src="user.user_metadata.avatar_url" size="sm" />
                        </template>
                        <div class="space-x-3">
                          <span>
                            {{ item.name }}
                          </span>
                        </div>
                        <template v-if="route.path === '/dashboard/' + item.slug" #trailing>
                          <span class="absolute inset-y-0 right-0 flex items-center pr-3">
                            <UIcon name="i-heroicons-check" class="w-5 h-5" />
                          </span>
                        </template>
                      </UButton>
                    </div>
                  </div>
                </template>
              </UPopover>
            </div> -->
          </div>

          <div v-if="user" class="flex items-center space-x-3">
            <SharedColorModeButton />
            <UDropdown
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
    <slot />

    <ModalContainer />
  </div>
</template>
