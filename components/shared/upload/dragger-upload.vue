<script lang="ts" setup>
import { nanoid } from 'nanoid'
import { Loader } from 'lucide-vue-next'
import type { UploadFile } from './types'
import { fileToBase64 } from '@/utils'
const props = defineProps<{
  accept?: string;
  name?: string;
  action?: string;
  maxCount?: number;
  defaultFileList?: UploadFile[];
}>()
const emit = defineEmits<{
  (eventName: 'change', file: UploadFile): void;
  (eventName: 'remove', file: UploadFile): void;
}>()
const { files, open, reset, onChange } = useFileDialog({
  accept: props.accept,
  multiple: !!props.maxCount
})
const openDialog = () => {
  open()
}
const fileList = ref<Record<string, UploadFile>>(props.defaultFileList ? Object.fromEntries(props.defaultFileList.map(file => [nanoid(), file])) : {})
onChange(async (files) => {
  if (!files) { return }
  if (props.maxCount) {
    if (props.maxCount === 1) {
      fileList.value = {}
    }
    if (files.length + Object.keys(fileList.value).length > props.maxCount) {
      // TODO: multiple Upload
      return
    }
  }
  const file = files[0]
  const id = nanoid()
  const suffix = getFileSuffix(file.name)
  const ext = suffix ? `.${suffix}` : ''
  // uploadStatus.value = 'UPLOADING'
  const uploadFile: UploadFile = { file, status: 'uploading', uid: id, name: file.name, size: file.size, thumb: (await fileToBase64(file)) as any }
  // fileList.value.push(uploadFile)
  fileList.value[id] = uploadFile
  emit('change', uploadFile)
  const { url, key } = await $fetch(`/api/uploads/${id}${ext}`)
  // await fetch(url, {
  //   method: 'PUT',
  //   body: file
  // })
  // state.value.image = key
  fileList.value[id].result = key
  emit('change', fileList.value[id])

  // if (!state.value.key || !fetchKeyLoading.value) { setRandomKey() }
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
  xhr.onload = () => {
    console.log('xhr.onload', xhr.status)
    if (xhr.status === 200) {
      fileList.value[id].result = key
      fileList.value[id].status = 'done'
      emit('change', fileList.value[id])
    }
  }
  xhr.onerror = () => {
    console.log('xhr.onerror')
    fileList.value[id].status = 'error'
    emit('change', fileList.value[id])
  }
})

const remove = (uid: string) => {
  emit('remove', fileList.value[uid])
  delete fileList.value[uid]
}
</script>
<template>
  <div>
    <button
      type="button"
      class="w-full flex items-center justify-center p-0 mb-2 h-32 disabled:cursor-not-allowed disabled:opacity-75 rounded-md border border-dashed
       bg-gray-50 dark:placeholder-gray-500 text-sm shadow-sm dark:bg-gray-900 text-gray-900 dark:text-white transition-colors border-gray-300 dark:border-gray-700 hover:border-primary-400 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none"
      @click="openDialog"
    >
      <!-- Upload File -->
      <!-- <img  src="thumb" alt=""> -->
      <img v-for="item in fileList" :key="item.uid" :src="item.thumb" :alt="item.name" class="h-full block">
      <span v-if="Object.keys(fileList).length === 0">Choose Image</span>
    </button>
    <ul v-for="item in fileList" :key="item.uid" class="space-y-2">
      <li class="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors rounded-md px-1 py-0.5 text-sm  flex justify-between items-center">
        <div class="flex items-center truncate">
          <Loader v-if="item.status === 'uploading'" class="h-4 w-4 animate-spin flex-shrink-0" />
          <UIcon v-if="item.status === 'done'" name="i-heroicons-check" class="h-4 w-4 text-primary flex-shrink-0" />
          <UIcon v-if="item.status === 'error'" name="i-heroicons-question-mark-circle" class="h-4 w-4 flex-shrink-0 text-red-500" />
          <span class="ml-1 text-slate-700 dark:text-slate-50 truncate">{{ item.name }}
            <!-- {{ item.status }} -->
          </span>
        </div>
        <UTooltip text="Delete">
          <UButton
            size="2xs"
            icon="i-heroicons-trash"
            color="gray"
            variant="ghost"
            class="ml-auto"
            @click="remove(item.uid)"
          />
        </UTooltip>
        <!-- <UIcon name="i-heroicons-x-mark" class="self-end" /> -->
      </li>
    </ul>
  </div>
</template>
