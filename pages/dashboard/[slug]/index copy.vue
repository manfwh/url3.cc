<script setup lang="ts">
// import * as pdfjs from 'pdfjs-dist'
// import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?worker'
// import { TextItem } from 'pdfjs-dist/types/src/display/api'
import type { Database } from '~/types/type'

import { getFileMd5, getFileSuffix, fileToArrayBuffer } from '~/utils'
// import MyWorker from '~/lib/worker?worker'
// import { Database } from '~/types/database.types'
const route = useRoute()

const supabase = useSupabaseClient<Database>()

// const body = '我喜欢变形金刚'
// const worker = ref<Worker>()
// onMounted(() => {
//   worker.value = new MyWorker()
//   worker.value.addEventListener('message', (e) => {
//     console.log('e', e)
//   })
//   worker.value.addEventListener('error', (e) => {
//     console.log('err', e)
//   })
//   // setTimeout(() => {
//   //   worker.postMessage({ text: body })
//   // }, 3000)
// })

// onMounted(() => {
//   // @ts-ignore
//   window.pdfjsWorker = pdfjsWorker
//   pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`
//   // pdfjs.getDocument(file)
// })

const { data: project } = await useAsyncData(`/api/project/${route.params.slug}`, async () => {
  const { data } = await supabase.from('projects').select('*, owner:users(*)').eq('slug', route.params.slug).single()

  return data
})
const { data: links, refresh: refreshLink } = await useAsyncData(`/api/project/${route.params.slug}/${project.value?.id}`, async () => {
  if (!project.value) { return [] }
  const { data } = await supabase.from('links').select('*').eq('project_id', project.value?.id).order('created_at', { ascending: false }).limit(12)
  return data
})
const submitting = ref(false)
const linkFormRef = ref<HTMLFormElement>()
const { $toast } = useNuxtApp()
const handleSubmit = async (e: Event) => {
  const target = e.target as HTMLFormElement
  try {
    submitting.value = true
    await $fetch('/api/links', {
      method: 'POST',
      body: {
        url: target.url.value,
        slug: project.value?.slug
      }
    })
    linkFormRef.value?.reset()
    refreshLink()
    $toast.success('创建成功')
  } catch (error: any) {
    $toast.error('创建失败')
  }
  submitting.value = false
}
const deleteLink = async (link: {id: number}) => {
  await supabase.from('links').delete().eq('id', link.id)
  refreshLink()
  $toast.success('删除成功')
}

// 处理消息提示
// const tips = ref()
// function splitTextIntoSegments (text: string) {
//   const segments = []
//   let currentSegment = ''

//   const paragraphs = text.split(/(?:\n|\r\n|\r)+/) // 根据换行符分段

//   for (const paragraph of paragraphs) {
//     if (currentSegment.length + paragraph.length <= 256) {
//       currentSegment += paragraph + '\n' // 将段落添加到当前段落中
//     } else {
//       segments.push(currentSegment.trim()) // 添加当前段落到segments，并清空currentSegment
//       currentSegment = paragraph + '\n' // 创建新的段落
//     }
//   }

//   if (currentSegment) {
//     segments.push(currentSegment.trim()) // 处理剩余的段落
//   }

//   return segments
// }
// const submitUpload = async (e: Event) => {
//   const target = e.target as HTMLFormElement
//   const file = target.file.files[0]
//   const md5 = await getFileMd5(file)
//   tips.value = '正在读取文件内容...'
//   const arrayBuffer = await fileToArrayBuffer(file)
//   tips.value = '正在解析PDF文件...'
//   const pdfDocument = await pdfjs.getDocument(arrayBuffer).promise
//   console.log('pdfDocument.numPages', pdfDocument.numPages)
//   let input = ''
//   for (let i = 1; i <= pdfDocument.numPages; i++) {
//     tips.value = `正在解析第${i}页...`
//     const pdfPage = await pdfDocument.getPage(i)
//     const textContent = await pdfPage.getTextContent()
//     const str = textContent.items.map(item => (item as TextItem).str).join('')
//     console.log('textContent', textContent)
//     // input += str.replace(/\n/g, ' ')
//     input += str
//   }
//   // const textSegments = splitTextIntoSegments(input)
//   // for (const segment of textSegments) {
//   //   console.log('segment', segment)
//   // }
//   console.log('input', input)
//   // worker.value?.postMessage({ text: input })
//   tips.value = '处理完成'

//   // const suffix = getFileSuffix(file.name)
//   // await supabase.storage.from('shortLink').upload(`${md5}.${suffix}`, file)
// }

const embedding = () => {
  $fetch('/api/embedding', {
    method: 'POST',
    body: {
      key: 'file.pdf'
    }
  })
}
</script>
<template>
  <div class="max-w-md mx-auto shadow py-24 px-4">
    <h1 class="text-2xl mb-8">
      project {{ project?.name }}
    </h1>
    <h2 class="text-xl mb-4">
      创建链接
    </h2>
    <form ref="linkFormRef" @submit.prevent="handleSubmit">
      <div>
        <span class="text-slate-700 text-sm">域名:</span>
        <input type="url" name="url" class="border text-sm rounded ml-2 focus:outline-none hover:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 px-4 py-1" placeholder="链接">
      </div>
      <div class="mt-4">
        <button
          class="btn btn-primary btn-sm"
          type="submit"
          :disabled="submitting"
          :class="{
            'btn-disabled': submitting
          }"
        >
          <span v-if="submitting" class="loading loading-spinner loading-sm" />
          创 建
        </button>
      </div>
    </form>
    <h2 class="text-xl my-4">
      我的链接({{ links?.length || 0 }})
    </h2>
    <ul>
      <li v-for="link in links" :key="link.id">
        <div>{{ link.url }} : {{ link.key }}</div>
        <button class="btn btn-sm btn-warning" @click="deleteLink(link)">
          删 除
        </button>
      </li>
    </ul>
    <!-- <h2 class="text-xl mb-4">
      上传文件
    </h2>
    <div>
      <form @submit.prevent="submitUpload">
        <input type="file" name="file">
        <button class="btn btn-sm btn-primary" type="submit">
          上 传
        </button>
      </form>
    </div>
    <div>{{ tips }}</div>
    <div>
      <button class="btn btn-primary" type="button" @click="embedding">
        向 量
      </button>
    </div> -->
    <div class="flex justify-between">
      <h2 class="text-xl mb-4">
        项目成员
      </h2>
      <div>邀请</div>
    </div>
  </div>
</template>
