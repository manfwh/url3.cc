<script setup lang="ts">

const props = withDefaults(defineProps<{text: string, ui?: any}>(), {
  ui: {
    base: 'rounded-full',
    leadingIcon: 'size-4'
  }
})
const toast = useToast()
const { copy, copied } = useClipboard({
  source: props.text,
  legacy: true
})
const handleClick = async () => {
  await copy(props.text)
  // toast.add({
  //   title: 'Successful copied!'
  // })
}
</script>
<template>
  <UButton
    variant="ghost"
    color="neutral"
    :ui="props.ui"
    class="px-1.5"
    :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
    @click="handleClick"
  />
</template>
