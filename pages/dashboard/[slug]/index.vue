<script setup lang="ts">

import type { Database } from '~/types/type'

definePageMeta({
  layout: 'dashboard'
})

// import MyWorker from '~/lib/worker?worker'
// import { Database } from '~/types/database.types'
const route = useRoute()

const supabase = useSupabaseClient<Database>()

const { data: project, pending } = await useAsyncData(`/api/project/${route.params.slug}`, async () => {
  const { data } = await supabase.from('projects').select('*, owner:users(*)').eq('slug', route.params.slug).maybeSingle()

  return data
}, { lazy: true })
const projectId = computed(() => project.value?.id)
const { data: links, refresh: refreshLink, pending: linkPending, status } = await useAsyncData(
  `/api/project/${route.params.slug}/${project.value?.id}`,
  async () => {
    if (!project.value) { return null }
    const { data } = await supabase.from('links').select('*').eq('project_id', project.value?.id).order('created_at', { ascending: false }).limit(12)
    return data
  },
  { lazy: true, watch: [projectId] }
)
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
const state = useLinkAddEditModal()

const isOpen = toRef(() => state.value.isOpen)
const openAddModal = async () => {
  state.value.isOpen = true
  state.value.link = null
  state.value.projectId = project.value?.id

  await until(isOpen).toBe(false)
  if (state.value.actionStatus === 'Saved') {
    // 刷新数据
    refreshLink()
    // refresh()
  }
}

const tabItems = [
  { label: 'Links', content: 'links' },
  { label: 'Setting', content: 'Setting' }
]
</script>
<template>
  <div class="container mx-auto px-4">
    <div class="mt-8">
      <UTabs :items="tabItems" class="w-48" />
    </div>
    <div class="flex justify-between items-center">
      <h1 class="text-2xl mb-8">
        Project {{ pending ? 'Loading' : project?.name }}
      </h1>
      <UButton @click="openAddModal">
        Create Link
      </UButton>
    </div>

    <h2 class="text-xl my-4">
      Links  ({{ (status === 'pending' || status === 'idle') ? 'Loading...' : links?.length || 0 }})
    </h2>
    <LinkList v-if="links" :links="links" @refresh="refreshLink" />

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
    <!-- <div class="flex justify-between">
      <h2 class="text-xl mb-4">
        项目成员
      </h2>
      <div>邀请</div>
    </div> -->
  </div>
</template>
