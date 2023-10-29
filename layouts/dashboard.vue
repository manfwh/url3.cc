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
