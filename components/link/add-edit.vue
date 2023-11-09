<script setup lang="ts">
// import { fileTypeFromFile } from 'file-type'
import type { FormError, FormSubmitEvent } from '@nuxt/ui/dist/runtime/types'
import DraggerUpload from '@/components/shared/upload/dragger-upload.vue'
import type { UploadFile, UploadedFile } from '@/components/shared/upload/types'
import { getFilename } from '@/utils'
import type { Enums } from '~/types/type'
const toast = useToast()
// const { fullDomain } = useAppConfig()
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
  type: editLink.value?.type || 'url',
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
// const fetchKeyLoading = ref(false)
// function setRandomKey () {
//   fetchKeyLoading.value = true
//   $fetch('/api/links/_random')
//     .then((key) => {
//       fetchKeyLoading.value = false
//       state.value.key = key
//     }).catch(() => {
//       fetchKeyLoading.value = false
//     })
// }
const submit = async (event: FormSubmitEvent<typeof state.value>) => {
  // if (fetchKeyLoading.value) { return }
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
    toast.add({
      title: editLink.value?.id ? 'Link updated' : 'Link created'
    })
    submitting.value = false
    addEditState.value.actionStatus = 'Saved'
    addEditState.value.isOpen = false
  } catch (error: any) {
    submitting.value = false

    toast.add({
      title: 'Create Failed',
      description: error?.data?.message || '',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red'
    })
  }
}

const showPassword = ref(false)

// watchDebounced(() => state.value.url, () => {
//   if (state.value.key || fetchKeyLoading.value) { return }
//   setRandomKey()
// }, { debounce: 500 })

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
      url: `https://url3.cc/assets/${state.value[field]}`,
      name: (field === 'image' ? state.value.title : state.value[field]) || '',
      status: 'done'
    }
    return [imageFile]
  }
  return []
})

const validate = (state: State): FormError[] => {
  const errors = []
  if (state.type === 'image') {
    if (!state.image) { errors.push({ path: 'image', message: 'You must select an image!' }) }
  }
  return errors
}
</script>
<template>
  <div class="px-4">
    <UForm
      :state="state"
      :validate="validate"
      class="space-y-4"
      @submit="submit"
    >
      <UFormGroup label="Type" name="type">
        <USelectMenu v-model="state.type" :options="['url', 'image']" color="gray" variant="outline" />
      </UFormGroup>
      <UFormGroup v-if="state.type === 'url'" label="Target" name="url">
        <UInput
          v-model="state.url"
          icon="i-heroicons-link"
          type="url"
          placeholder="https://expmale-long.com"
          required
          autofocus
          color="gray"
          variant="outline"
        />
      </UFormGroup>
      <template v-else-if="state.type === 'image'">
        <UFormGroup label="Image File" name="image">
          <DraggerUpload
            v-if="state.type === 'image'"
            :default-file-list="genUploadedFile('image')"
            accept="image/*"
            :max-count="1"
            @change="uploadChange($event, 'image')"
            @remove="state.image = ''"
          />
        </UFormGroup>
        <UFormGroup label="Title" name="title" hint="Optional">
          <UInput v-model="state.title" type="text" placeholder="Title" color="gray" variant="outline" />
        </UFormGroup>
        <UFormGroup label="Description" name="description" hint="Optional">
          <UInput v-model="state.description" type="text" color="gray" variant="outline" />
        </UFormGroup>
      </template>

      <!-- <UFormGroup label="Shrot Link" name="key" :ui="{container: 'flex'}">
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
      </UFormGroup> -->
      <UFormGroup label="Password" name="password" hint="Optional">
        <UInput v-model="state.password" icon="i-heroicons-lock-closed" :type="showPassword ? 'text' : 'password'" color="gray" variant="outline" />
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
      <UFormGroup label="Android Targeting" :name="state.type === 'url' ? 'android' : 'android_image'" hint="Optional">
        <UInput v-if="state.type === 'url'" v-model="state.android" type="url" color="gray" variant="outline" />
        <DraggerUpload
          v-if="state.type === 'image'"
          accept="image/*"
          :default-file-list="genUploadedFile('android_image')"
          :max-count="1"
          @change="uploadChange($event, 'android_image')"
          @remove="state.android_image = ''"
        />
      </UFormGroup>
      <UFormGroup label="Ios Targeting" hint="Optional" :name="state.type === 'url' ? 'ios' : 'ios_image'">
        <UInput v-if="state.type === 'url'" v-model="state.ios" type="url" color="gray" variant="outline" />
        <DraggerUpload
          v-if="state.type === 'image'"
          accept="image/*"
          :default-file-list="genUploadedFile('ios_image')"
          :max-count="1"
          @change="uploadChange($event, 'ios_image')"
          @remove="state.ios_image = ''"
        />
      </UFormGroup>
      <div class="text-right">
        <UButton type="submit" :loading="submitting">
          {{ submitting ? 'Submitting' : 'Submit' }}
        </UButton>
      </div>
    </UForm>
  </div>
</template>
