<script setup lang="ts">
import { CornerDownLeft, Loader } from 'lucide-vue-next'
import { useStorage } from '@vueuse/core'
const toast = useToast()
const formRef = ref<HTMLFormElement>()

const submitting = ref(false)
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
    toast.add({ title: 'Link Created' })
  }).catch(() => {
    submitting.value = false
    toast.add({ title: 'Link Create Error' })
  })
}
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
  slot: 'link'
}, {
  label: 'Image',
  slot: 'image'
}]
</script>
<template>
  <div class="mx-auto max-w-lg mt-16">
    <UTabs :items="tabItems">
      <template #link>
        <div class="bg-white dark:bg-gray-800 p-6 rounded-md divide-y divide-slate-200 dark:divide-gray-600">
          <form ref="formRef" @submit.prevent="handleSubmit">
            <label
              class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              for="url"
            >Enter your long URL to get started</label>
            <div class="relative mt-4">
              <UInput
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
              <!-- <div class="absolute right-4 inset-y-0 flex items-center">
                <UButton color="primary" variant="ghost" type="submit" :disabled="submitting">
                  <Loader v-if="submitting" class="h-4 w-4 animate-spin" />
                  <CornerDownLeft v-else class="h-4 w-4" />
                </UButton>
              </div> -->
            </div>
            <UButton block size="md" class="mt-4">
              Generate Short Link
            </UButton>
          </form>
          <div class="mt-4 pt-4">
            <span class="font-semibold">Your Short Link:</span>
            <p class="bg-slate-100 dark:bg-gray-700 rounded p-2 mt-2">
              https://short.ly/abc123
            </p>
          </div>
        </div>
      </template>
      <template #image="{ item }">
        {{ item.label }}
      </template>
    </UTabs>

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
        <LinkCard :home-link="item" @delete-link="openDelModal" />
      </template>
    </TransitionGroup>
    <UAlert
      v-if="links && links.length > 0"
      class="mt-8"
      icon="i-heroicons-information-circle"
      color="amber"
      variant="subtle"
      title="Note"
      description="Public links will be automatically-deleted after 30 minutes. Create a free account to keep your links forever."
    />
  </div>
</template>
