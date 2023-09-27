import { toast } from 'vue-sonner'

export default defineNuxtPlugin(() => {
  // nuxtApp.vueApp.component('Toaster', Toaster)

  return {
    provide: {
      toast
    }
  }
})
