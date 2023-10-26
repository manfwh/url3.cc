<script setup lang="ts">
import { openConfirmModal, useLinkAddEditModal } from '~/composables/modal'
import type { Database, Tables } from '~/types/type'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const state = useLinkAddEditModal()
const supabase = useSupabaseClient<Database>()
const toast = useToast()
const route = useRoute()
const page = ref(route.query.page ? Number(route.query.page) : 1)
const pageSize = 10
const { data: links, refresh, pending } = await useAsyncData(
  'user-links',
  async () => await supabase
    .from('links')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page.value - 1) * pageSize, (page.value - 1) * pageSize + (pageSize - 1))
  ,
  {
    watch: [page]
  }
)
const isOpen = toRef(() => state.value.isOpen)
const openAddModal = async () => {
  state.value.isOpen = true
  state.value.link = null

  await until(isOpen).toBe(false)
  if (state.value.actionStatus === 'Saved') {
    // 刷新数据
    refresh()
  }
}
const openEditModal = async (key?: string, link?: Tables<'links'>) => {
  const editLink = list.value?.find(item => item.id === link?.id)
  if (editLink) {
    state.value = {
      ...state.value,
      isOpen: true,
      link: editLink
    }
  }
  await until(isOpen).toBe(false)
  if (state.value.actionStatus === 'Saved') {
    // 刷新数据
    refresh()
  }
}
const list = computed(() => links.value?.data)
const confirmModalState = useConfirmModal()
const openDelModal = async (key: string, link?: Tables<'links'>) => {
  const res = await openConfirmModal({
    description: 'Are you sure to delete this link?'
  })
  if (res === 'confirm') {
    confirmModalState.value.confirmLoading = true
    $fetch(`/api/links/${key}`, {
      method: 'DELETE'
    }).then(() => {
      refresh()
      toast.add({ title: 'Link deleted' })
      confirmModalState.value.confirmLoading = false
      confirmModalState.value.isOpen = false
    })
      .catch(() => {
        toast.add({ title: 'Link not deleted' })
        confirmModalState.value.confirmLoading = false
      })
    // setTimeout(() => {
    //   confirmModalState.value.isOpen = false
    //   confirmModalState.value.confirmLoading = false
    // }, 3000)
  }
}
const isCreateProjectOpen = ref(false)
defineShortcuts({
  c: {
    usingInput: true,
    handler: () => {
      openAddModal()
    }
  }
})
</script>
<template>
  <UContainer>
    <div class="h-36 flex justify-between items-center">
      <div>
        <h1 class="text-lg">
          Links
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Manage your links
        </p>
      </div>
      <UButton variant="outline" @click="openAddModal">
        Create Link <UKbd>C</UKbd>
      </UButton>
    </div>
    <div class="grid grid-cols-10 gap-8">
      <div v-if="pending">
        Loading
      </div>
      <div class="col-span-10">
        <ul v-if="links" class="space-y-4">
          <LinkCard v-for="link in list" :key="link.id" :link="link" @delete-link="openDelModal" @edit-link="openEditModal" />
        </ul>
        <div class="flex justify-end pt-8 pb-8">
          <UPagination v-model="page" :page-count="pageSize" :total="links ? links?.count! : 0" />
        </div>
      </div>
    </div>
    <ModalAddEditProject v-model="isCreateProjectOpen" />
  </UContainer>
</template>
