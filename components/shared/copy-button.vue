<script setup lang="ts">
import { CopyIcon, Check } from 'lucide-vue-next'
const props = defineProps<{
  text: string
}>()
const { $toast } = useNuxtApp()
const { copy, copied } = useClipboard({
  source: props.text,
  legacy: true
})
const handleClick = async () => {
  await copy(props.text)
  $toast.success('Successful copied!')
}
</script>
<template>
  <UButton variant="ghost" :ui="{ rounded: 'rounded-full' }" class="px-1.5" @click="handleClick">
    <Check v-if="copied" :size="16" />
    <CopyIcon v-else :size="16" />
  </UButton>
</template>
