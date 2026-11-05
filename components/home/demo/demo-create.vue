<script setup lang="ts">
import { useQRCode } from '@vueuse/integrations/useQRCode'
import { useStorage } from '@vueuse/core'
import DraggerUpload from '~/components/shared/upload/dragger-upload.vue'
import type { UploadFile } from '@/components/shared/upload/types'
import { checkUrlSafety } from '~/utils/url-safety'
import { linkErrorI18nKey } from '~/utils/link-api-error'
import { EXPIRY } from '~/utils/link-policy'
const { fullDomain } = useAppConfig()
const toast = useToast()
const user = useSupabaseUser()
const isAuthed = computed(() => !!user.value)
const errorMessage = ref('')
const formRef = ref<HTMLFormElement>()

const submitting = ref(false)

const isMounted = useMounted()
const links = useStorage<{key: string, url: string}[]>('links', [])
const createdLink = computed(() => {
  return links.value ? links.value[0] : null
})

const deleteLink = (key: string) => {
  links.value = links.value.filter(link => link.key !== key)
}

const confirmModalState = useConfirmModal()

const openDelModal = async (key: string) => {
  const res = await openConfirmModal({
    description: 'Are you sure to delete this link?'
    // confirmText: 'Delete',
  })
  if (res === 'confirm') {
    confirmModalState.value.isOpen = false
    deleteLink(key)
    toast.add({ title: 'Link deleted' })
  }
}
const { t } = useI18n()
const tabItems = [{
  label: t('common.Link'),
  type: 'link'
}, {
  label: t('common.Image'),
  type: 'image'
}]
const route = useRoute()
const router = useRouter()
const selected = computed({
  get () {
    const index = tabItems.findIndex(item => item.type === route.query.type)
    if (index === -1) {
      return 0
    }
    return index
  },
  set (value) {
    router.replace({ query: { type: tabItems[value].type } })
  }
})
const item = computed(() => tabItems[selected.value])
const image = ref('')
const handleSubmit = (e: Event) => {
  const target = e.target as HTMLFormElement
  const url = String(target?.url?.value || '').trim()
  errorMessage.value = ''

  if ((route.query.type || 'url') !== 'url') {
    errorMessage.value = t('security.unsupported_type')
    return
  }

  const safety = checkUrlSafety(url)
  if (!safety.ok) {
    errorMessage.value = t(`security.unsafe_${safety.reason}`)
    return
  }

  submitting.value = true
  $fetch(isAuthed.value ? '/api/links' : '/api/demo/links', {
    method: 'POST',
    body: {
      url,
      type: 'url',
      expiresIn: Number(selectedExpire.value)
    }
  }).then((data: { key: string, url: string }) => {
    links.value.unshift(data)
    formRef.value?.reset()
    submitting.value = false
    toast.add({ title: t('security.created'), icon: 'i-heroicons-check-circle', timeout: 3000 })
  }).catch((err: any) => {
    submitting.value = false
    errorMessage.value = t(linkErrorI18nKey(err))
    toast.add({
      title: t('security.create_failed'),
      description: errorMessage.value,
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red'
    })
  })
}

const uploadChange = (info: UploadFile) => {
  if (info.status === 'done') {
    image.value = info.result
  }
}

const qrText = computed(() => createdLink.value?.key ? fullDomain + createdLink.value.key : ' ')
const qrcode = useQRCode(qrText, {
  margin: 2,
  width: 100,
  height: 100
})
const anchorRef = ref<HTMLAnchorElement>()
const download = (url: string) => {
  if (!anchorRef.value) { return }
  anchorRef.value.href = qrcode.value
  anchorRef.value.download = `${createdLink.value?.key}-url3cc.png`
  anchorRef.value.click()
}

const expireOptions = computed(() => {
  const options = [
    { label: t('security.expiry.day'), value: String(EXPIRY.day) },
    { label: t('security.expiry.week'), value: String(EXPIRY.week) }
  ]
  if (!isAuthed.value) { return options }
  return [
    ...options,
    { label: t('security.expiry.month'), value: String(EXPIRY.month) },
    { label: t('security.expiry.quarter'), value: String(EXPIRY.quarter) },
    { label: t('security.expiry.year'), value: String(EXPIRY.year) },
    { label: t('security.expiry.never'), value: String(EXPIRY.never) }
  ]
})
const selectedExpire = ref(String(EXPIRY.week))
const expireTouched = ref(false)
const selectedExpireLabel = computed(() => expireOptions.value.find(option => option.value === selectedExpire.value)?.label)
watch(isAuthed, (authed) => {
  if (!expireTouched.value) {
    selectedExpire.value = authed ? String(EXPIRY.never) : String(EXPIRY.week)
    return
  }
  if (!expireOptions.value.some(option => option.value === selectedExpire.value)) {
    selectedExpire.value = String(EXPIRY.week)
  }
}, { immediate: true })
</script>

<template>
  <div class="mx-4 md:mx-auto max-w-lg mt-16 font-[Inter]">
    <!-- <UTabs v-model="selected" :items="tabItems">
    </UTabs> -->

    <!-- <template #item="{item}">

      </template> -->
    <!-- <template #image>
        <div class="bg-white dark:bg-gray-800 p-6 rounded-md dark:divide-gray-600">
          <form ref="formRef" class="mb-4" @submit.prevent="handleSubmit">
            <label
              class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              for="url"
            >Select your Image to get started</label>
            <div class="relative mt-4">
              <DraggerUpload />
            </div>
            <UButton type="submit" block size="md" class="mt-4" :loading="submitting">
              Generate Image Link
            </UButton>
          </form>
          <Transition
            appear
            enter-active-class="overflow-hidden transition-[height] duration-200 ease-out"

            leave-active-class="overflow-hidden transition-[height] duration-200 ease-out"
            @enter="onEnter"
            @after-enter="onAfterEnter"
            @before-leave="onBeforeLeave"
            @leave="onLeave"
          >
            <div v-if="createdLink" class="pt-4 box-content border-t border-gray-300">
              <span class="font-semibold" @click="createdLink = null">Your Short Link:</span>
              <p class="bg-slate-100 dark:bg-gray-700 rounded p-2 mt-2 mb-4 flex justify-between items-center">
                {{ fullDomain + createdLink.key }}
                <UTooltip text="Copy Link">
                  <SharedCopyButton :text="fullDomain + createdLink.key" :ui="{rounded: 'rounded-md'}" />
                </UTooltip>
              </p>
              <p class="text-xs text-slate-600 dark:text-slate-400">
                Public links will be automatically-deleted after 30 minutes. Create a free account to keep your links forever.
              </p>
            </div>
          </Transition>
        </div>
      </template> -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-md">
      <form ref="formRef" class="mb-4" @submit.prevent="handleSubmit">
        <label
          class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          for="url"
        >{{ item.type === 'image' ? $t('demo.label.image') : $t('demo.label.link') }}
        </label>
        <div class="relative mt-4">
          <DraggerUpload v-if="item.type === 'image'" @change="uploadChange" @remove="image = ''" />
          <UInput
            v-else
            type="url"
            autocomplete="off"
            name="url"
            required
            autofocus
            size="md"
            :disabled="submitting"
            placeholder="https://example.com"
            :ui="{
              variant: {
                outline: 'bg-white dark:bg-slate-800'
              }
            }"
          />
        </div>
        <div class="mt-4">
          <label class="text-sm font-medium" for="expires">{{ $t('security.expiry.label') }}</label>
          <USelectMenu
            v-model="selectedExpire"
            class="mt-2"
            :options="expireOptions"
            value-attribute="value"
            option-attribute="label"
            size="md"
            @update:model-value="expireTouched = true"
          >
            <template #label>
              {{ selectedExpireLabel }}
            </template>
          </USelectMenu>
          <p v-if="!isAuthed" class="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {{ $t('security.sign_in_longer') }}
          </p>
        </div>
        <p class="mt-3 text-xs text-slate-600 dark:text-slate-400">
          {{ isAuthed ? $t('security.limits_user') : $t('security.limits_guest') }}
        </p>
        <UAlert
          v-if="errorMessage"
          class="mt-4"
          color="red"
          variant="subtle"
          icon="i-heroicons-exclamation-triangle"
          :title="errorMessage"
        />
        <!-- <div class="mt-4 grid grid-cols-2 gap-4">
          <USelectMenu
            v-model="selectedExpire"
            :options="expireOptions"
            placeholder="expire time"
            value-attribute="value"
            option-attribute="label"
            size="md"
          >
            <template #label>
              {{ expire?.label }}
            </template>
          </USelectMenu>
          <UInput type="text" size="md" placeholder="password" />
        </div> -->
        <UButton type="submit" block size="md" class="mt-4" :loading="submitting">
          {{ item.type === 'image' ? $t('demo.submit.image') : $t('demo.submit.link') }}
        </UButton>
      </form>
    </div>
    <div class="min-h-[230px] mt-4">
      <ClientOnly>
        <SharedTransitionHeight>
          <div v-if="createdLink && !submitting" class="md:flex bg-white dark:bg-gray-800 rounded-md px-6 py-4 gap-6">
            <div class="flex-shrink-0 text-center">
              <img :src="qrcode" class="w-24 h-24 block" alt="">
              <UButton
                class="mt-2"
                block
                size="xs"
                @click="download"
              >
                {{ $t('common.download') }}
              </UButton>
              <a ref="anchorRef" class="hidden" />
            </div>
            <div>
              <span class="font-semibold">{{ $t('demo.your_short_link') }}</span>
              <div class="bg-slate-100 dark:bg-gray-700 rounded p-2 mt-2 mb-4 flex justify-between items-center">
                <a :href="fullDomain + createdLink.key" target="_blank">{{ fullDomain + createdLink.key }}</a>
                <div class="flex items-center gap-1">
                  <LinkClicks :key="createdLink.key!" :link-key="createdLink.key!" />
                  <UTooltip text="Copy Link">
                    <!-- <copy-button :text="fullDomain + props.link.key" /> -->
                    <SharedCopyButton
                      :text="fullDomain + createdLink.key"
                      :ui="{rounded: 'rounded-md', icon: {
                        size: {
                          sm: 'h-4 w-4'
                        }
                      }}"
                    />
                  </UTooltip>
                </div>
              </div>
              <p class="text-xs text-slate-600 dark:text-slate-400">
                {{ $t('demo.warn') }}
              </p>
              <div class="mt-3">
                <LinkReportLink :link-key="createdLink.key" />
              </div>
            </div>
          </div>
        </SharedTransitionHeight>
      </ClientOnly>
    </div>

    <!-- <UAlert
      v-if="links && links.length > 0"
      class="mt-8"
      icon="i-heroicons-information-circle"
      color="amber"
      variant="subtle"
      title="Note"
      description="Public links will be automatically-deleted after 30 minutes. Create a free account to keep your links forever."
    /> -->
  </div>
</template>
