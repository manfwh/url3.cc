<script setup lang="ts">
import type { Tables } from '~/types/type'

const props = defineProps<{
  links: Tables<'links'>[]
}>()
const emit = defineEmits<{
  (event: 'refresh'): void
}>()
const state = useLinkAddEditModal()
const isOpen = toRef(() => state.value.isOpen)
const toast = useToast()
const openEditModal = async (key: string, link?: Tables<'links'>) => {
  console.log('edit2')
  const editLink = props.links?.find(item => item.id === link?.id)
  console.log('editLink', editLink)
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
    emit('refresh')
    // refresh()
  }
}
const confirmModalState = useConfirmModal()
const openDelModal = async (key: string, link?: Tables<'links'>) => {
  const res = await openConfirmModal({
    description: 'Are you sure to delete this link?'
    // confirmText: 'Delete',
  })
  console.log('link2', link)
  if (res === 'confirm') {
    confirmModalState.value.confirmLoading = true
    $fetch(`/api/links/${link?.key}`, {
      method: 'DELETE'
    }).then(() => {
      emit('refresh')
      toast.add({ title: 'Link deleted' })
      confirmModalState.value.confirmLoading = false
      confirmModalState.value.isOpen = false
    })
      .catch(() => {
        toast.add({ title: 'Link not deleted' })
        confirmModalState.value.confirmLoading = false
      })
  }
}
</script>
<template>
  <ul v-if="links" class="col-span-8 space-y-4">
    <LinkCard v-for="link in props.links" :key="link.id" :link="link" @delete-link="openDelModal" @edit-link="openEditModal" />
  </ul>
</template>
