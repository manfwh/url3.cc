<script setup lang="ts">
import { Trash2Icon, MoreVertical } from 'lucide-vue-next'
import { useQRCode } from '@vueuse/integrations/useQRCode'
import type { Tables } from '~/types/type'
const props = defineProps<{
  link: Tables<'links'>
}>()
const emit = defineEmits<{
  (e: 'deleteLink', value: Tables<'links'>): void
  (e: 'editLink', value: Tables<'links'>): void
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
      emit('editLink', props.link)
    }
  }],
  [{
    label: 'Delete',
    icon: 'i-heroicons-trash-20-solid',
    shortcuts: ['D'],
    click: () => {
      emit('deleteLink', props.link)
    }
  }]
]
const qrcode = useQRCode(fullDomain + props.link.key, {
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
  anchorRef.value.download = `${props.link.key}-qrcode.png`
  anchorRef.value.click()
}

const timeAgo = useTimeAgo(new Date(props.link.created_at))
</script>
<template>
  <li>
    <UCard :ui="{body: {padding: 'sm:p-4'}}">
      <div class="flex justify-between items-center">
        <div class="flex-auto w-0 mr-4">
          <div class="flex items-center">
            <span class="text-gray-900 dark:text-gray-50 font-bold flex-shrink-0">短链接：<UIcon v-if="!!props.link.password" name="i-heroicons-lock-closed" /></span>
            <UButton variant="link" color="white" :to="fullDomain + props.link.key" target="_blank">
              {{ domain + '/' + props.link.key }}
            </UButton>
            <!-- <a class="text-primary truncate" :href="fullDomain + props.link.key" target="_blank"></a> -->
            <!-- <ExternalLink class="ml-2 text-gray-500" :size="16" /> -->
            <UTooltip text="Copy Link">
              <!-- <copy-button :text="fullDomain + props.link.key" /> -->
              <SharedCopyButton :text="fullDomain + props.link.key" />
            </UTooltip>
            <UButton variant="ghost" :ui="{ rounded: 'rounded-full' }" icon="i-heroicons-qr-code" @click="isOpenQrcode = true" />
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
          <div class="text-gray-500 text-sm mt-2 truncate">
            <span>Target：</span>
            <UButton variant="link" color="gray" :to="props.link.url" target="_blank" :ui="{variant: {link: 'hover:no-underline'}, color: {gray: {link: 'hover:no-underline'}}}">
              {{ props.link.url }}
            </UButton>
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <UTooltip :text="`clicks ${props.link.clicks}`">
            <UButton
              color="gray"
              size="xs"
              :to="`/dashboard/links/${props.link.key}`"
              variant="soft"
              icon="i-heroicons-chart-bar-solid"
              class="  text-gray-500 dark:text-gray-400"
            >
              {{ props.link.clicks || 0 }}
            </UButton>
          </UTooltip>
          <UTooltip :text="`Created ${new Date(props.link.created_at).toLocaleString()}`">
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
