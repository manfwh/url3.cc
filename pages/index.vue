<script setup lang="ts">
import { Link2, CornerDownLeft, Loader, Ghost } from 'lucide-vue-next'
import { useStorage } from '@vueuse/core'
import HomeLinkCard from '~/components/home/home-link-card.vue'

const { $toast } = useNuxtApp()
const supabase = useSupabaseClient()

const submitting = ref(false)
const formRef = ref<HTMLFormElement>()
const links = useStorage<{key: string, url: string}[]>('links', [])
const handleSubmit = (e: Event) => {
  const target = e.target as HTMLFormElement
  submitting.value = true
  $fetch('/api/demo/links', {
    method: 'POST',
    body: { url: target.url.value }
  }).then((data) => {
    if ('url' in data) {
      links.value.unshift(data)
    }
    formRef.value?.reset()
    submitting.value = false
    $toast.success('创建成功')
  }).catch(() => {
    submitting.value = false
    $toast.error('创建失败')
  })
}
const isMounted = useMounted()
const deleteLink = (key: string) => {
  links.value = links.value.filter(link => link.key !== key)
}
const { data: { session } } = await supabase.auth.getSession()
const signInWithGitHub = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      // redirectTo: 'http://localhost:3000/confirm'
    }
  })
}
console.log('session', session)
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
    <h1 class="text-6xl text-center text-gray-800 dark:text-gray-100 mt-24 font-bold ">
      Create Your <span class="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-400">Short Links</span>
    </h1>
    <p class="text-center text-gray-700 dark:text-gray-300 mt-4">
      Shrink those lengthy URLs for quick content sharing.
    </p>
    <div class="mx-auto max-w-md pt-24">
      <form ref="formRef" class="mb-8" @submit.prevent="handleSubmit">
        <div class="relative">
          <UInput
            icon="i-heroicons-link"
            variant="outline"
            color="primary"
            type="url"
            autocomplete="off"
            name="url"
            input-class="pr-14"
            required
            size="xl"
            :disabled="submitting"
            placeholder="Enter a Link"
            :ui="{
              variant: {
                outline: 'bg-white dark:bg-slate-800'
              }
            }"
          />
          <div class="absolute right-4 inset-y-0 flex items-center">
            <UButton color="primary" variant="ghost" type="submit" :disabled="submitting">
              <Loader v-if="submitting" class="h-4 w-4 animate-spin" />
              <CornerDownLeft v-else class="h-4 w-4" />
            </UButton>
          </div>
        </div>
        <!-- <div class="relative flex items-center">
          <Link2
            class="absolute inset-y-0 left-0 my-2 ml-3 w-5 text-gray-400"
          />
          <input
            type="url"
            autocomplete="off"
            name="url"
            required
            placeholder="Enter a URL"
            class="block border rounded-md focus:outline-none py-2 pl-10 pr-12 w-full sm:text-sm hover:border-primary focus:ring-primary focus:border-primary"
          >
          <button
            type="submit"
            :disabled="submitting"
            :class="
              submitting
                ? 'cursor-not-allowed bg-gray-50'
                : 'hover:border-gray-700 hover:text-gray-700'
            "
            class="absolute inset-y-0 right-0 my-1.5 mr-1.5 flex w-10 items-center justify-center rounded border border-gray-200 font-sans text-sm font-medium text-gray-400"
          >
            <Loader v-if="submitting" class="h-4 w-4 animate-spin" />
            <template v-else>
              <CornerDownLeft class="h-4 w-4" />
            </template>
          </button>
        </div> -->
      </form>
      <TransitionGroup
        v-if="isMounted"
        tag="ul"
        class="relative space-y-4"
        appear
        move-class="transition-all duration-500"
        enter-active-class="transition-opacity duration-500"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-500 absolute w-full"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <template v-for="item in links" :key="item.key">
          <!-- <HomeLinkCard :link="item" @delete-link="deleteLink" /> -->
          <LinkCard :link="item" />
        </template>
      </TransitionGroup>
    </div>
    <Background />
  </div>
</template>
