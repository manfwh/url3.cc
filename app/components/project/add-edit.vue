<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const state = ref({
  name: undefined,
  slug: undefined
})

const validate = (state: any): FormError[] => {
  const errors = []
  if (!state.name) { errors.push({ name: 'name', message: 'Required' }) }
  if (!state.slug) { errors.push({ name: 'slug', message: 'Required' }) }
  return errors
}

const supabase = useSupabase()
const user = useSupabaseUser()
const toast = useToast()
const submitting = ref(false)

async function submit (event: FormSubmitEvent<any>) {
  // Do something with data
  console.log(event.data)
  submitting.value = true
  const res = await supabase.from('projects').insert({
    owner_id: user.value?.id,
    name: event.data.name,
    slug: event.data.slug
  })
  submitting.value = false
  if (!res.error) {
    toast.add({ duration: 0, title: 'Project created successfully' })
    // isOpen.value = false
    emit('success')
    return
  }
  if (res.status === 403) {
    toast.add({ duration: 0, title: 'You are not authorized to create a project' })
    return
  }
  toast.add({ duration: 0, title: res.error.message })

  console.log('res', res)
}
</script>
<template>
  <UForm
    :validate="validate"
    :state="state"
    class="space-y-4"
    @submit="submit"
  >
    <UFormField label="Pronect Name" name="name" required>
      <UInput v-model="state.name" />
    </UFormField>
    <UFormField label="Pronect Slug" name="slug" required>
      <UInput v-model="state.slug" />
    </UFormField>
    <UButton type="submit" :loading="submitting">
      Submit
    </UButton>
  </UForm>
</template>
