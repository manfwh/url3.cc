<script setup lang="ts">
import { openConfirmModal, useLinkAddEditModal } from '~/composables/modal'
import { Database, Tables } from '~/types/type'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const state = useLinkAddEditModal()
const supabase = useSupabaseClient<Database>()
const { $toast } = useNuxtApp()

const { data: links, refresh } = await useAsyncData(
  'user-links',
  async () => await supabase
    .from('links')
    .select('*')
    .order('created_at', { ascending: false })
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
const openEditModal = async (link: Tables<'links'>) => {
  const editLink = list.value?.find(item => item.id === link.id)
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
const openDelModal = async (link: Tables<'links'>) => {
  console.log('link', link)
  const res = await openConfirmModal({
    description: '确认要删除吗？'
  })
  console.log('res', res)

  if (res === 'confirm') {
    console.log('删除')
    confirmModalState.value.confirmLoading = true
    $fetch(`/api/links/${link.key}`, {
      method: 'DELETE'
    }).then(() => {
      refresh()
      $toast.success('Link deleted')
      confirmModalState.value.confirmLoading = false
      confirmModalState.value.isOpen = false
    })
      .catch(() => {
        $toast.error('Link not deleted')
        confirmModalState.value.confirmLoading = false
      })
    // setTimeout(() => {
    //   confirmModalState.value.isOpen = false
    //   confirmModalState.value.confirmLoading = false
    // }, 3000)
  }
}
const isCreateProjectOpen = ref(false)

</script>
<template>
  <UContainer>
    <div class="h-36 flex justify-between items-center">
      <h1 class="text-lg">
        My Links
      </h1>
      <UButton @click="openAddModal">
        Create Link
      </UButton>
    </div>
    <div class="grid grid-cols-10 gap-8">
      <ul v-if="links" class="col-span-10 space-y-4">
        <LinkCard v-for="link in list" :key="link.id" :link="link" @delete-link="openDelModal" @edit-link="openEditModal" />
      </ul>
    </div>
    <ModalAddEditProject v-model="isCreateProjectOpen" />
  </UContainer>
</template>
