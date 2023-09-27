<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui/dist/runtime/types'
import { Tables } from '~/types/type'
const { $toast } = useNuxtApp()
const { fullDomain } = useAppConfig()
const addEditState = useLinkAddEditModal()
const submitting = ref(false)

const editLink = computed(() => addEditState.value.link)

const state = ref({
  url: editLink.value?.url || '',
  password: editLink.value?.password || '',
  key: editLink.value?.key || '',
  project_id: editLink.value?.project_id || addEditState.value.projectId,
  ios: editLink.value?.ios || '',
  android: editLink.value?.android || ''
})

// 是否正在获取key中
const fetchKeyLoading = ref(false)
function setRandomKey () {
  fetchKeyLoading.value = true
  $fetch('/api/links/_random')
    .then((key) => {
      fetchKeyLoading.value = false
      state.value.key = key
    }).catch(() => {
      fetchKeyLoading.value = false
    })
}

const submit = async (event: FormSubmitEvent<typeof state.value>) => {
  if (fetchKeyLoading.value) { return }
  try {
    submitting.value = true
    if (editLink.value?.id) {
      // delete editLink.value.project
      await $fetch(`/api/links/${editLink.value.key}`, {
        method: 'PUT',
        body: {
          id: editLink.value.id,
          ...state.value
        }
      })
    } else {
      await $fetch('/api/links', {
        method: 'POST',
        body: {
          ...state.value
        }
      })
    }

    $toast.success(editLink.value?.id ? 'Link updated' : 'Link created')
    submitting.value = false
    addEditState.value.actionStatus = 'Saved'
    addEditState.value.isOpen = false
  } catch (error: any) {
    submitting.value = false
    $toast.error(error.message)
  }
}

const showPassword = ref(false)

watchDebounced(() => state.value.url, () => {
  if (state.value.key || fetchKeyLoading.value) { return }
  setRandomKey()
}, { debounce: 500 })
</script>
<template>
  <div class="px-4">
    <UForm
      :state="state"
      class="space-y-4"
      @submit="submit"
    >
      <UFormGroup label="Target" name="url">
        <UInput v-model="state.url" icon="i-heroicons-link" type="url" placeholder="https://baidu.com" required />
      </UFormGroup>
      <UFormGroup label="Shrot Link" name="key" :ui="{container: 'flex'}">
        <UTooltip :text="fullDomain" class="w-1/2 ">
          <span
            class="py-1.5   text-sm rounded-l-md px-2.5 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 truncate"
          >{{ fullDomain }}</span>
        </UTooltip>

        <UInput v-model="state.key" type="text" :disabled="fetchKeyLoading || !state.key" required :ui="{rounded: 'rounded-l-none', wrapper: 'flex-1 -ml-[1px]'}" />
        <UButton
          class="absolute bottom-full right-0 mb-1"
          size="xs"
          color="gray"
          variant="ghost"
          :disabled="fetchKeyLoading || !state.url"
          @click="setRandomKey"
        >
          {{ fetchKeyLoading ? 'Fetching...' : 'Set Random Key' }}
        </UButton>
      </UFormGroup>
      <UFormGroup label="访问密码" name="password" hint="可选">
        <UInput v-model="state.password" icon="i-heroicons-lock-closed" :type="showPassword ? 'text' : 'password'" />
        <div class="absolute inset-y-0 flex items-center justify-center right-2">
          <UButton
            :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
            size="2xs"
            color="gray"
            variant="ghost"
            @click="showPassword = !showPassword"
          />
        </div>
      </UFormGroup>
      <UFormGroup label="android" name="android" hint="可选">
        <UInput v-model="state.android" type="url" />
      </UFormGroup>
      <UFormGroup label="ios" name="ios" hint="可选">
        <UInput v-model="state.ios" type="url" />
      </UFormGroup>

      <UButton type="submit" :loading="submitting" :disabled="fetchKeyLoading">
        Submit
      </UButton>
    </UForm>
  </div>
</template>
