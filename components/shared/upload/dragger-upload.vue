<script lang="ts" setup>
import { nanoid } from 'nanoid'
import { Loader } from 'lucide-vue-next'
import type { UploadFile, UploadedFile } from './types'
import { fileToBase64 } from '@/utils'
const props = defineProps<{
  accept?: string;
  name?: string;
  action?: string;
  maxCount?: number;
  defaultFileList?: UploadedFile[];
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
const fileList = ref<Record<string, UploadFile>>(
  props.defaultFileList
    ? Object.fromEntries(props.defaultFileList.map((file) => {
      const uid = nanoid()
      return [uid, {
        uid,
        ...file
      }]
    }))
    : {}
)
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
      class="w-full relative flex items-center justify-center p-0 mb-2 h-32 disabled:cursor-not-allowed disabled:opacity-75 rounded-md border border-dashed
       bg-gray-50 dark:placeholder-gray-500 text-sm shadow-sm dark:bg-gray-900 text-gray-900 dark:text-white transition-colors border-gray-300 dark:border-gray-700 hover:border-primary-400 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none"
      @click="openDialog"
    >
      <!-- Upload File -->
      <!-- <img  src="thumb" alt=""> -->
      <template v-for="item in fileList" :key="item.uid">
        <img :src="item.thumb || item.url" :alt="item.name" class="h-full block">
        <span v-if="item.status === 'uploading'" class="absolute inset-0 flex items-center justify-center bg-slate-700/60 dark:bg-slate-500/60"> <Loader v-if="item.status === 'uploading'" class="h-4 w-4 animate-spin" /> </span>
      </template>
      <div v-if="Object.keys(fileList).length === 0" class="absolute inset-0 flex flex-col items-center justify-center group transition-colors text-slate-700 dark:text-slate-300 hover:text-slate-800 hover:dark:text-slate-200">
        <UIcon name="i-heroicons-cloud-arrow-up" class="w-8 h-8 group-hover:scale-90" />
        <span>Drag and Drop or click to upload.</span>
      </div>
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
