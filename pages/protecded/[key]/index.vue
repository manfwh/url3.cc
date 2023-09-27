<script setup lang="ts">
import type { FormError, FormSubmitEvent, Form } from '@nuxt/ui/dist/runtime/types'
const state = ref({
  password: undefined
})
const validate = (state: any): FormError[] => {
  const errors = []
  if (!state.password) { errors.push({ path: 'password', message: 'Required' }) }
  return errors
}
const route = useRoute()
const formRef = ref<Form<typeof state>>()
const verifying = ref(false)
async function submit (event: FormSubmitEvent<any>) {
  // Do something with data
  console.log(event.data)
  verifying.value = true
  const res = await $fetch(`/api/links/${route.params.key}/verify`, {
    method: 'POST',
    body: {
      password: event.data.password
    }
  }) as { verify: boolean, url: string}
  verifying.value = false
  console.log(res)
  if (!res.verify) {
    formRef.value?.setErrors([{
      path: 'password',
      message: 'Incorrect password'
    }])
  } else {
    location.replace(res.url)
  }
}
</script>
<template>
  <div class="max-w-md mx-auto">
    <UForm
      ref="formRef"
      class="space-y-4"
      :validate="validate"
      :state="state"
      @submit="submit"
    >
      <UFormGroup label="Password" name="password">
        <UInput v-model="state.password" type="password" />
      </UFormGroup>
      <UButton type="submit" :loading="verifying">
        Submit
      </UButton>
    </UForm>
  </div>
</template>
