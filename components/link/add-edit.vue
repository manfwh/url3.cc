<script setup lang="ts">
import { nanoid } from 'nanoid'
// import { fileTypeFromFile } from 'file-type'
import type { FormSubmitEvent } from '@nuxt/ui/dist/runtime/types'
import DraggerUpload from '@/components/shared/upload/dragger-upload.vue'
import type { UploadFile } from '@/components/shared/upload/types'
import { getFilename } from '@/utils'
import { Tables, Enums } from '~/types/type'
const { $toast } = useNuxtApp()
const { fullDomain } = useAppConfig()
const addEditState = useLinkAddEditModal()
const submitting = ref(false)

const editLink = computed(() => addEditState.value.link)

type State = {
  type: Enums<'link_type'>;
  image?: string;
  url?: string;
  password?: string;
  key: string;
  project_id?: string | null;
  ios?: string;
  android?: string;
  title?: string;
  description?: string;
}
const state = ref<State>({
  type: editLink.value?.type || 'image',
  image: editLink.value?.image || '',
  url: editLink.value?.url || '',
  password: editLink.value?.password || '',
  key: editLink.value?.key || '',
  // project_id: editLink.value?.project_id || addEditState.value.projectId || null,
  ios: editLink.value?.ios || '',
  android: editLink.value?.android || ''
})

// 是否正在获取key中
const fetchKeyLoading = ref(false)
function setRandomKey () {
  fetchKeyLoading.value = true
  $fetch('/api/links/_random')
    .then((key) => {
      fetchKeyLoading.value = false
      state.value.key = key
    }).catch(() => {
      fetchKeyLoading.value = false
    })
}

const submit = async (event: FormSubmitEvent<typeof state.value>) => {
  if (fetchKeyLoading.value) { return }
  try {
    submitting.value = true
    if (editLink.value?.id) {
      // delete editLink.value.project
      await $fetch(`/api/links/${editLink.value.key}`, {
        method: 'PUT',
        body: {
          id: editLink.value.id,
          ...state.value
        }
      })
    } else {
      await $fetch('/api/links', {
        method: 'POST',
        body: {
          ...state.value
        }
      })
    }

    $toast.success(editLink.value?.id ? 'Link updated' : 'Link created')
    submitting.value = false
    addEditState.value.actionStatus = 'Saved'
    addEditState.value.isOpen = false
  } catch (error: any) {
    submitting.value = false
    $toast.error(error.message)
  }
}

const showPassword = ref(false)

watchDebounced(() => state.value.url, () => {
  if (state.value.key || fetchKeyLoading.value) { return }
  setRandomKey()
}, { debounce: 500 })

const { files, open, reset, onChange } = useFileDialog({
  accept: 'image/*' // Set to accept only image files
})
const openDialog = () => open()
const uploadStatus = ref<'INIT' | 'UPLOADING' | 'DONE' | 'ERROR'>('INIT')
onChange(async (files) => {
  console.log(files)
  if (!files) { return }
  const id = nanoid()
  const file = files[0]
  const suffix = getFileSuffix(file.name)
  const ext = suffix ? `.${suffix}` : ''
  uploadStatus.value = 'UPLOADING'
  const { url, key } = await $fetch(`/api/uploads/${id}${ext}`)
  // await fetch(url, {
  //   method: 'PUT',
  //   body: file
  // })
  state.value.image = key
  uploadStatus.value = 'DONE'
  if (!state.value.key || !fetchKeyLoading.value) { setRandomKey() }
  const xhr = new XMLHttpRequest()
  xhr.open('PUT', url)
  xhr.send(file)
  xhr.upload.addEventListener('progress', (event) => {
    console.log('event', event)
    if (event.lengthComputable) {
      const percentComplete = (event.loaded / event.total) * 100
      console.log(`Progress: ${Math.round(percentComplete)}%`)
    }
  })
})

const uploadChange = (info: UploadFile, field: keyof typeof state.value) => {
  if (info.status === 'done') {
    state.value[field] = info.result
  }
  if (field === 'image') {
    state.value.title = getFilename(info.name)
  }
}
</script>
<template>
  <div class="px-4">
    <UForm
      :state="state"
      class="space-y-4"
      @submit="submit"
    >
      <UFormGroup label="Type" name="type">
        <USelectMenu v-model="state.type" :options="['url', 'image']" color="gray" variant="outline" />
      </UFormGroup>
      <UFormGroup v-if="state.type === 'url'" label="Target" name="url">
        <UInput v-model="state.url" icon="i-heroicons-link" type="url" placeholder="https://baidu.com" required />
      </UFormGroup>
      <template v-else-if="state.type === 'image'">
        <UFormGroup label="Image File" name="type">
          <DraggerUpload v-if="state.type === 'image'" accept="image/*" :max-count="1" @change="uploadChange($event, 'image')" @remove="state.image = ''" />
          <!-- <input type="file"> -->
          <!-- <button
            type="button"
            class="w-full h-32 relative block bg-gray-50  disabled:cursor-not-allowed disabled:opacity-75   rounded-md   dark:placeholder-gray-500 text-sm px-2.5 py-1.5 shadow-sm dark:bg-gray-900 text-gray-900 dark:text-white transition-colors border border-dashed border-gray-300 dark:border-gray-700 hover:border-primary-400 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none"
            @click="openDialog"
          >
            Upload File
          </button>
          <div v-if="state.image">
            {{ state.image }}
          </div> -->
        </UFormGroup>
        <UFormGroup label="Title" name="title" hint="O">
          <UInput v-model="state.title" type="text" placeholder="Title" color="gray" variant="outline" />
        </UFormGroup>
        <UFormGroup label="Description" name="description">
          <UInput v-model="state.description" type="text" color="gray" variant="outline" />
        </UFormGroup>
      </template>

      <UFormGroup label="Shrot Link" name="key" :ui="{container: 'flex'}">
        <span
          class="py-1.5  text-sm rounded-l-md px-2.5 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 truncate"
        >{{ fullDomain }}</span>

        <UInput v-model="state.key" type="text" :disabled="fetchKeyLoading || !state.key" required :ui="{rounded: 'rounded-l-none', wrapper: 'flex-1 -ml-[1px]'}" />
        <UButton
          class="absolute bottom-full right-0 mb-1"
          size="xs"
          color="gray"
          variant="ghost"
          :disabled="fetchKeyLoading || !state.url"
          @click="setRandomKey"
        >
          {{ fetchKeyLoading ? 'Fetching...' : 'Set Random Key' }}
        </UButton>
      </UFormGroup>
      <UFormGroup label="访问密码" name="password" hint="可选">
        <UInput v-model="state.password" icon="i-heroicons-lock-closed" :type="showPassword ? 'text' : 'password'" />
        <div class="absolute inset-y-0 flex items-center justify-center right-2">
          <UButton
            :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
            size="2xs"
            color="gray"
            variant="ghost"
            @click="showPassword = !showPassword"
          />
        </div>
      </UFormGroup>
      <UFormGroup label="android" name="android" hint="可选">
        <UInput v-if="state.type === 'url'" v-model="state.android" type="url" />
        <DraggerUpload v-if="state.type === 'image'" accept="image/*" :max-count="1" @change="uploadChange($event, 'android')" @remove="state.android = ''" />
      </UFormGroup>
      <UFormGroup label="ios" name="ios" hint="可选">
        <UInput v-model="state.ios" type="url" />
      </UFormGroup>

      <UButton type="submit" :loading="submitting" :disabled="fetchKeyLoading">
        Submit
      </UButton>
    </UForm>
  </div>
</template>
