<template>
  <div>
    <slot />
    <ClientOnly>
      <Toaster position="bottom-right" />
    </ClientOnly>
    <ModalContainer />
  </div>
</template>
<script lang="ts" setup>
import { Toaster } from 'vue-sonner'
</script>
