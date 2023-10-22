import type { Tables } from '~/types/type'

type LinkAddModal = {
  isOpen: boolean
  link: Tables<'links'> | null,
  actionStatus: 'Saved' | 'Canceled' | '',
  projectId?: Tables<'projects'>['id']
}
export const useLinkAddEditModal = () => useState<LinkAddModal>('link-add-edit', () => ({
  isOpen: false,
  link: null,
  actionStatus: ''
  // projectId: ''
}))
export type ConfirmModalLabel = {
  title?: string,
  description?: string
  confirm?: string
  cancel?: string
}
export type ConfirmModalChoice = 'confirm' | 'cancel' | undefined
type ConfirmModalState = {
  isOpen: boolean,
  choice: ConfirmModalChoice,
  label: ConfirmModalLabel,
  confirmLoading: boolean
}
export const useConfirmModal = () => useState<ConfirmModalState>('confirm-modal', () => ({
  isOpen: false,
  choice: undefined,
  confirmLoading: false,
  label: {
    title: '提示'
  }
}))

export const openConfirmModal = async (label: ConfirmModalLabel | string): Promise<ConfirmModalChoice> => {
  const state = useConfirmModal()
  state.value.label = typeof label === 'string' ? { description: label, title: '提示' } : label
  state.value.choice = undefined
  state.value.isOpen = true
  const choice = computed(() => state.value.choice)
  await until(choice).changed()
  return state.value.choice
}
