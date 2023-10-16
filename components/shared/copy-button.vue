<script setup lang="ts">

const props = withDefaults(defineProps<{text: string, ui?: any}>(), {
  ui: {
    rounded: 'rounded-full',
    icon: {
      size: {
        sm: 'h-4 w-4'
      }
    }
  }
})
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
  <UButton
    variant="ghost"
    color="gray"
    :ui="props.ui"
    class="px-1.5"
    :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
    @click="handleClick"
  />
</template>
