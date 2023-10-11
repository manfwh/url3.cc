<script setup lang="ts">
import { useQRCode } from '@vueuse/integrations/useQRCode'
import type { Tables } from '~/types/type'
const props = defineProps<{
  link?: Tables<'links'>,
  homeLink?: {url: string, key: string},
  isHome?: boolean
}>()
const emit = defineEmits<{
  (e: 'deleteLink', value: Tables<'links'> | {url: string, key: string}): void
  (e: 'editLink', value: Tables<'links'> | {url: string, key: string}): void
}>()

const domain = 'url3.cc'
const fullDomain = `https://${domain}/`

const menus = [
  [{
    label: 'Edit',
    icon: 'i-heroicons-pencil-square-20-solid',
    shortcuts: ['E'],
    click: () => {
      // isOpen.value = true
      emit('editLink', props.link || props.homeLink!)
    }
  }],
  [{
    label: 'Delete',
    icon: 'i-heroicons-trash-20-solid',
    shortcuts: ['D'],
    click: () => {
      emit('deleteLink', props.link || props.homeLink!)
    }
  }]
]
const key = computed(() => {
  return props.link?.key || props.homeLink?.key
})
const url = computed(() => {
  return props.link?.url || props.homeLink?.url
})
const qrcode = useQRCode(fullDomain + key.value, {
  color: {
    // dark: '#fff',
    // light: '#000'
  }
})
const isOpenQrcode = ref(false)
const anchorRef = ref<HTMLAnchorElement>()
const download = (url: string) => {
  if (!anchorRef.value) { return }
  anchorRef.value.href = qrcode.value
  anchorRef.value.download = `${key.value}-qrcode.png`
  anchorRef.value.click()
}

const timeAgo = props.link ? useTimeAgo(new Date(props.link?.created_at)) : null

</script>
<template>
  <li>
    <UCard :ui="{body: {padding: 'sm:p-4'}}">
      <div class="flex justify-between items-center gap-4">
        <UTooltip v-if="props.link?.type === 'url'" text="Url">
          <div class="rounded-md w-10 h-10 flex items-center justify-center bg-violet-50 dark:bg-violet-300">
            <UIcon name="i-heroicons-link" class="w-6 h-6 text-violet-600 dark:text-violet-700" />
          </div>
        </UTooltip>
        <UTooltip v-if="props.link?.type === 'image'" text="Image">
          <div class="rounded-md w-10 h-10 flex items-center justify-center bg-teal-50 dark:bg-teal-300">
            <UIcon name="i-heroicons-photo" class="w-6 h-6 text-teal-600 dark:text-teal-700" />
          </div>
        </UTooltip>

        <div class="flex-auto w-0 mr-4">
          <div class="flex items-center relative">
            <UIcon v-if="!!props.link?.password" name="i-heroicons-lock-closed" class="mr-2" />
            <nuxt-link :to="fullDomain + key" target="_blank" class="mr-4 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md px-2">
              {{ domain + '/' + key }}
            </nuxt-link>
            <!-- <a class="text-primary truncate" :href="fullDomain + props.link.key" target="_blank"></a> -->
            <!-- <ExternalLink class="ml-2 text-gray-500" :size="16" /> -->
            <UTooltip text="Copy Link">
              <!-- <copy-button :text="fullDomain + props.link.key" /> -->
              <SharedCopyButton :text="fullDomain + key" />
            </UTooltip>
            <UButton variant="ghost" :ui="{ rounded: 'rounded-full' }" size="xs" icon="i-heroicons-qr-code" @click="isOpenQrcode = true" />
            <UModal v-model="isOpenQrcode">
              <UCard>
                <template #header>
                  <div class="flex items-center justify-between">
                    <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                      QR Code
                    </h3>
                    <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isOpenQrcode = false" />
                  </div>
                </template>
                <div class="mx-auto w-40 h-40 bg-white border dark:border-gray-900 rounded overflow-hidden">
                  <img :src="qrcode" class="w-40 h-40 block" alt="">
                </div>
                <div class="md:px-12 mt-8">
                  <UButton block icon="i-heroicons-arrow-down-tray" @click="download">
                    Download
                  </UButton>
                  <a ref="anchorRef" class="hidden" />
                </div>
              </UCard>
            </UModal>
          </div>
          <div class="text-gray-500 dark:text-gray-300 text-sm mt-2 truncate items-center hover:bg-slate-100 dark:hover:bg-slate-700 inline-block rounded-md pl-1 pr-2 py-0.5">
            <template v-if="props.link?.type === 'url'">
              <UIcon name="i-heroicons-link" class="align-middle" />
              <a
                class="flex-1 truncate ml-2"
                :href="url"
                target="_blank"
              >
                {{ url }}
              </a>
            </template>
            <template v-if="props.link?.type === 'image'">
              <UIcon name="i-heroicons-photo" class="align-middle" />
              <!-- <img :src="fullDomain + key" class="w-4 h-4"> -->
              <a
                class="flex-1 truncate ml-2"
                :href="fullDomain + key"
                target="_blank"
              >
                <!-- {{ props.link.image }} -->
                img
              </a>
            </template>
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <LinkClicks :link-key="key!" :clicks="props.link?.clicks" />
          <UTooltip v-if="props.link" :text="`Created ${new Date(props.link?.created_at).toLocaleString()}`">
            <span class="text-sm  text-gray-500 dark:text-gray-400">{{ timeAgo }}</span>
          </UTooltip>
          <UDropdown :items="menus" :popper="{ placement: 'bottom' }" :ui="{ width: 'w-36'}">
            <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-vertical" />
          </UDropdown>
        </div>
      </div>
    </UCard>
  </li>
</template>
