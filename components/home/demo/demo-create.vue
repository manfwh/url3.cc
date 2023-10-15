<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import DraggerUpload from '~/components/shared/upload/dragger-upload.vue'
import type { UploadFile } from '@/components/shared/upload/types'
const { fullDomain } = useAppConfig()
const toast = useToast()
const formRef = ref<HTMLFormElement>()

const submitting = ref(false)
const createdLink = ref<{url: string; key: string} | null>()

const isMounted = useMounted()
const links = useStorage<{key: string, url: string}[]>('links', [])
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
const tabItems = [{
  label: 'Link',
  type: 'link'
}, {
  label: 'Image',
  type: 'image'
}]
function onEnter (el: any, done: any) {
  el.style.height = '0'
  // eslint-disable-next-line no-unused-expressions
  el.offsetHeight // Trigger a reflow, flushing the CSS changes
  el.style.height = el.scrollHeight + 'px'

  el.addEventListener('transitionend', done, { once: true })
}

function onBeforeLeave (el: any) {
  el.style.height = el.scrollHeight + 'px'
  // eslint-disable-next-line no-unused-expressions
  el.offsetHeight // Trigger a reflow, flushing the CSS changes
}

function onAfterEnter (el: Element) {
  (el as HTMLElement).style.height = 'auto'
}

function onLeave (el: any, done: any) {
  el.style.height = '0'

  el.addEventListener('transitionend', done, { once: true })
}
const route = useRoute()
const router = useRouter()
const selected = computed({
  get () {
    const index = tabItems.findIndex(item => item.type === route.query.type)
    console.log('index', index)
    if (index === -1) {
      return 0
    }
    return index
  },
  set (value) {
    router.replace({ query: { type: tabItems[value].type } })
  }
})
const image = ref('')
const handleSubmit = (e: Event) => {
  const target = e.target as HTMLFormElement
  submitting.value = true

  if (route.query.type === 'image') {
    // TODO: Image
  }
  $fetch('/api/demo/links', {
    method: 'POST',
    body: { url: target?.url?.value, type: route.query.type || 'link', image: image.value }
  }).then((data) => {
    createdLink.value = data
    links.value.unshift(data)
    formRef.value?.reset()
    submitting.value = false
    toast.add({ title: 'Link Created' })
  }).catch((err: any) => {
    submitting.value = false
    toast.add({ title: err?.data?.message })
  })
}

const uploadChange = (info: UploadFile) => {
  if (info.status === 'done') {
    image.value = info.result
  }
}
</script>

<template>
  <div class="mx-auto max-w-lg mt-16 h-[2000px]">
    <UTabs v-model="selected" :items="tabItems">
      <template #item="{item}">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-md dark:divide-gray-600">
          <form ref="formRef" class="mb-4" @submit.prevent="handleSubmit">
            <label
              class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              for="url"
            >{{ item.label === 'Image' ?'Select your Image to get started' : 'Enter your long URL to get started' }}
            </label>
            <div class="relative mt-4">
              <DraggerUpload v-if="item.label === 'Image'" @change="uploadChange" @remove="image = ''" />
              <UInput
                v-else
                type="url"
                autocomplete="off"
                name="url"
                required
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
            <UButton type="submit" block size="md" class="mt-4" :loading="submitting">
              {{ item.label === 'Image' ? 'Generate Image Link' : 'Generate Short Link' }}
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
                  <!-- <copy-button :text="fullDomain + props.link.key" /> -->
                  <SharedCopyButton :text="fullDomain + createdLink.key" :ui="{rounded: 'rounded-md'}" />
                </UTooltip>
              </p>
              <p class="text-xs text-slate-600 dark:text-slate-400">
                Public links will be automatically-deleted after 30 minutes. Create a free account to keep your links forever.
              </p>
            </div>
          </Transition>
        </div>
      </template>
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
    </UTabs>

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
