<script setup lang="ts">
import { useLinkAddEditModal } from '~/composables/modal'
const state = useLinkAddEditModal()

function handleClose () {
  state.value.isOpen = false
  state.value.actionStatus = 'Canceled'
  // state.value.link = null
}
</script>
<template>
  <UModal v-model:open="state.isOpen" :dismissible="false">
      <template #content>
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">
            {{ state.link ? $t('Edit_Link') : $t('Create_Link') }}
          </h3>
          <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="handleClose" />
        </div>
      </template>
      <LinkAddEdit />
    </UCard>
        </template>
    </UModal>
  <ModalConfirm />
</template>
