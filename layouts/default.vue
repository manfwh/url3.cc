<template>
  <div>
    <slot />
    <ClientOnly>
      <Toaster position="bottom-right" />
    </ClientOnly>
    <ModalContainer />
    <footer class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20 text-slate-700 dark:text-slate-300 py-4 text-sm">
      © 2023 URL3.CC. All rights reserved.
    </footer>
  </div>
</template>
<script lang="ts" setup>
import { Toaster } from 'vue-sonner'
</script>
