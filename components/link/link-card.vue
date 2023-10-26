<script setup lang="ts">
import { useQRCode } from '@vueuse/integrations/useQRCode'
import type { Tables } from '~/types/type'
const props = defineProps<{
  link?: Tables<'links'>,
  homeLink?: {url: string, key: string},
  isHome?: boolean
}>()
const emit = defineEmits<{
  (e: 'deleteLink', key: string, link?: Tables<'links'>): void
  (e: 'editLink', key: string, link?: Tables<'links'>): void
}>()

const domain = 'url3.cc'
const fullDomain = `https://${domain}/`

const key = computed(() => {
  return props.link?.key || props.homeLink?.key
})
const menus = computed(() => {
  return [
    [{
      label: 'Edit',
      icon: 'i-heroicons-pencil-square-20-solid',
      shortcuts: ['E'],
      click: () => {
      // isOpen.value = true
        console.log('edit', key.value, props.link)
        emit('editLink', key.value!, props.link)
      }
    }],
    [{
      label: 'Delete',
      icon: 'i-heroicons-trash-20-solid',
      shortcuts: ['D'],
      click: () => {
        console.log('props.link', props.link)
        emit('deleteLink', key.value!, props.link)
      }
    }]
  ]
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
    <UCard
      :ui="{
        body: {padding: 'sm:px-4 sm:py-2'},
        ring: 'ring-1 ring-gray-200 dark:ring-gray-800 hover:ring-gray-300 dark:hover:ring-gray-700'
      }"
    >
      <div class="flex justify-between items-center gap-4">
        <UTooltip v-if="props.link?.type === 'url'" text="Url">
          <div class="rounded-full w-10 h-10 flex items-center justify-center bg-violet-50 dark:bg-violet-300">
            <UIcon name="i-heroicons-link" class="w-6 h-6 text-violet-600 dark:text-violet-700" />
          </div>
        </UTooltip>
        <UTooltip v-if="props.link?.type === 'image'" text="Image">
          <div class="rounded-full w-10 h-10 flex items-center justify-center bg-teal-50 dark:bg-teal-300">
            <UIcon name="i-heroicons-photo" class="w-6 h-6 text-teal-600 dark:text-teal-700" />
          </div>
        </UTooltip>

        <div class="flex-auto w-0 mr-4">
          <div class="flex items-center relative">
            <nuxt-link :to="fullDomain + key" target="_blank" class="mr-4 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md px-2 flex items-center">
              <UIcon v-if="!!props.link?.password" name="i-heroicons-lock-closed mr-1" />
              {{ domain + '/' + key }}
            </nuxt-link>
            <!-- <a class="text-primary truncate" :href="fullDomain + props.link.key" target="_blank"></a> -->
            <!-- <ExternalLink class="ml-2 text-gray-500" :size="16" /> -->
            <UTooltip text="Copy Link">
              <!-- <copy-button :text="fullDomain + props.link.key" /> -->
              <SharedCopyButton :text="fullDomain + key" />
            </UTooltip>
            <UButton
              variant="ghost"
              color="gray"
              :ui="{ rounded: 'rounded-full' }"
              size="xs"
              icon="i-heroicons-qr-code"
              @click="isOpenQrcode = true"
            />
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
          <div class="text-gray-500 dark:text-gray-400 text-sm max-w-full truncate items-center hover:bg-slate-100 dark:hover:bg-slate-700 inline-block rounded-md pl-2 pr-2 py-0.5">
            <template v-if="props.link?.type === 'url'">
              <a
                class="flex-1 truncate"
                :href="url"
                target="_blank"
              >
                <UIcon name="i-heroicons-link" class="align-middle" />
                {{ url }}
              </a>
            </template>
            <template v-if="props.link?.type === 'image'">
              <!-- <img :src="fullDomain + key" class="w-4 h-4"> -->
              <a
                v-if="props.link.title"
                class="flex-1 truncate"
                :href="fullDomain + key"
                target="_blank"
              >
                <UIcon name="i-heroicons-photo" class="align-middle" />
                {{ props.link.title }}
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
