<script setup lang="ts">
import { Trash2Icon, MoreVertical } from 'lucide-vue-next'
import copyButton from '~/components/shared/copy-button.vue'
const props = defineProps<{
  link: {key: string, url: string}
}>()
const emit = defineEmits<{
  (e: 'deleteLink', value: string): void
}>()

const domain = 'url3.cc'
const fullDomain = `https://${domain}/`
const isOpen = ref(false)

const menus = [
  [{
    label: '编辑',
    icon: 'i-heroicons-pencil-square-20-solid',
    shortcuts: ['E'],
    click: () => {
      isOpen.value = true
    }
  }],
  [{
    label: '删除',
    icon: 'i-heroicons-trash-20-solid',
    shortcuts: ['D'],
    click: () => {
      emit('deleteLink', props.link.key)
    }
  }]
]

const linkUpdate = (e: Event) => {
  const target = e.target as HTMLFormElement
  console.log(target.password.value)
  $fetch(`/api/links/${props.link.key}`, {
    method: 'PUT'
  })
}
</script>
<template>
  <li
    class="py-4 shadow my-4 px-4 bg-white dark:bg-slate-900 rounded flex justify-between items-center"
  >
    <div class="flex-auto w-0 mr-4">
      <div class="flex items-center">
        <!-- <span class="text-slate-900 dark:text-gray-100 font-bold flex-shrink-0">短链接：</span> -->
        <a class="text-blue-400 hover:text-blue-500 truncate" :href="fullDomain + props.link.key" target="_blank">{{ domain + props.link.key }}</a>
        <UTooltip text="复制链接">
          <copy-button :text="fullDomain + props.link.key" />
        </UTooltip>
      </div>
      <div class="text-gray-500 text-sm mt-2 truncate">
        <!-- <span>原始链接：</span> -->
        <span>{{ props.link.url }}</span>
      </div>
    </div>
    <UDropdown :items="menus" :popper="{ placement: 'bottom' }" :ui="{ width: 'w-36'}">
      <button
        type="button"
        class="flex-0 flex-shrink-0 p-2 rounded-full text-gray-500 hover:bg-slate-100 hover:text-slate-700 active:bg-slate-200 transition-colors"
      >
        <MoreVertical class="w-4 h-4" />
      </button>
    </UDropdown>
    <UModal v-model="isOpen">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              {{ props.link.key }}
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="isOpen = false"
            />
          </div>
        </template>
        <div>
          <form @submit.prevent="linkUpdate">
            <div>
              <span>密码：</span>
              <div>
                <input type="password" name="password" placeholder="请输入密码">
              </div>
            </div>
            <div>
              <UButton type="submit">
                保 存
              </UButton>
            </div>
          </form>
        </div>
        <div />
      </UCard>
    </UModal>
  </li>
</template>
