<script setup lang="ts">
const state = useConfirmModal()

const handleClose = () => {
  state.value = {
    ...state.value,
    confirmLoading: false,
    choice: 'cancel',
    isOpen: false
  }
}
const handleConfirm = () => {
  state.value = {
    ...state.value,
    choice: 'confirm'
  }
}
</script>
<template>
  <UModal v-model="state.isOpen" prevent-close>
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800', header: { padding: 'py-4'} }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">
            {{ state.label.title || 'Alert' }}
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="handleClose" />
        </div>
      </template>
      <p v-if="state.label.description">
        {{ state.label.description }}
      </p>
      <template #footer>
        <div class="space-x-4 flex justify-end items-center">
          <UButton color="gray" variant="ghost" :disabled="state.confirmLoading" @click="handleClose">
            取 消
          </UButton>
          <UButton :loading="state.confirmLoading" @click="handleConfirm">
            确 认
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
