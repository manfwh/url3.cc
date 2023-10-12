<script setup lang="ts">
import { nanoid } from 'nanoid'
// import { fileTypeFromFile } from 'file-type'
import type { FormSubmitEvent } from '@nuxt/ui/dist/runtime/types'
import DraggerUpload from '@/components/shared/upload/dragger-upload.vue'
import type { UploadFile, UploadedFile } from '@/components/shared/upload/types'
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
  android_image?: string;
  ios_image?: string;
}
const state = ref<State>({
  type: editLink.value?.type || 'image',
  image: editLink.value?.image || '',
  url: editLink.value?.url || '',
  password: editLink.value?.password || '',
  key: editLink.value?.key || '',
  // project_id: editLink.value?.project_id || addEditState.value.projectId || null,
  ios: editLink.value?.ios || '',
  android: editLink.value?.android || '',
  title: editLink.value?.title || '',
  description: editLink.value?.description || '',
  android_image: editLink.value?.android_image || '',
  ios_image: editLink.value?.ios_image || ''
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
    $toast.error(error?.data?.message || 'Create Error!')
  }
}

const showPassword = ref(false)

watchDebounced(() => state.value.url, () => {
  if (state.value.key || fetchKeyLoading.value) { return }
  setRandomKey()
}, { debounce: 500 })

const uploadChange = (info: UploadFile, field: keyof typeof state.value) => {
  console.log('info', info)
  if (info.status === 'done') {
    state.value[field] = info.result
  }
  if (field === 'image') {
    state.value.title = getFilename(info.name)
  }
}

const genUploadedFile = computed(() => (field: keyof typeof state.value) => {
  if (state.value.type === 'image') {
    if (!state.value[field]) { return [] }
    const imageFile: UploadedFile = {
      url: `https://file.url3.cc/${state.value[field]}`,
      name: (field === 'image' ? state.value.title : state.value[field]) || '',
      status: 'done'
    }
    return [imageFile]
  }
  return []
})
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
          <DraggerUpload
            v-if="state.type === 'image'"
            :default-file-list="genUploadedFile('image')"
            accept="image/*"
            :max-count="1"
            @change="uploadChange($event, 'image')"
            @remove="state.image = ''"
          />
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
      <UFormGroup label="Android Targeting" name="android" hint="可选">
        <UInput v-if="state.type === 'url'" v-model="state.android" type="url" />
        <DraggerUpload
          v-if="state.type === 'image'"
          accept="image/*"
          :default-file-list="genUploadedFile('android_image')"
          :max-count="1"
          @change="uploadChange($event, 'android_image')"
          @remove="state.android_image = ''"
        />
      </UFormGroup>
      <UFormGroup label="Ios Targeting" name="ios" hint="可选">
        <UInput v-if="state.type === 'url'" v-model="state.ios" type="url" />
        <DraggerUpload
          v-if="state.type === 'image'"
          accept="image/*"
          :default-file-list="genUploadedFile('ios_image')"
          :max-count="1"
          @change="uploadChange($event, 'ios_image')"
          @remove="state.ios_image = ''"
        />
      </UFormGroup>

      <UButton type="submit" :loading="submitting" :disabled="fetchKeyLoading">
        Submit
      </UButton>
    </UForm>
  </div>
</template>
