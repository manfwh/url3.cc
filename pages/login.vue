<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui/dist/runtime/types'
import type { Database } from '~/types/type'
definePageMeta({
  layout: 'default',
  middleware: 'auth'
})
const supabase = useSupabaseClient<Database>()
const url = useRequestURL()
const redirect = url.searchParams.get('redirect')
let redirectTo = url.origin + '/confirm'
if (redirect) {
  redirectTo = redirectTo + '?redirect=' + encodeURIComponent(redirect)
}
async function signInWithGitHub () {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo
    }
  })
  console.log(data, error)
}
const {
  data: { session }
} = await supabase.auth.getSession()

const submitting = ref(false)
// const router = useRouter()
const signInWithOAuth = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  })
  console.log('data', data)
  console.log('error', error)
}

const state = ref({
  email: undefined
})
const localePath = useLocalePath()

async function submit (event: FormSubmitEvent<any>) {
  // Do something with data
  console.log(event.data)
  submitting.value = true
  const { data, error } = await supabase.auth.signInWithOtp({
    email: event.data.email,
    options: {
      // emailRedirectTo: 'https://example.com/welcome',
    }
  })
  submitting.value = false
  navigateTo('/auth/verify-request')
}

</script>
<template>
  <div class="min-h-[calc(100vh-52px)] flex flex-col justify-center items-center">
    <NuxtLink :to="localePath('/')" class="md:w-96 mb-4 flex items-center">
      <UIcon name="i-heroicons-arrow-left" />
      <span class="ml-2 text-sm">Back Home</span>
    </NuxtLink>
    <UCard class="md:w-96">
      <div class="flex flex-col items-center">
        <NuxtLink :to="localePath('/')" class=" mb-2">
          <img src="~/assets/imgs/logo.png" alt="logo" class="w-10 h-10 block ">
        </NuxtLink>
        <h1 class="mb-8 text-2xl ">
          Sign in to <NuxtLink class="text-primary" :to="localePath('/')">
            Url3.cc
          </NuxtLink>
        </h1>
      </div>

      <div>
        <UForm
          :state="state"
          class="space-y-6"
          @submit="submit"
        >
          <UFormGroup label="Email" name="email">
            <UInput v-model="state.email" color="gray" type="email" placeholder="your email" required />
          </UFormGroup>

          <UButton type="submit" block :loading="submitting">
            {{ !submitting ? 'Continue with email' : '' }}
          </UButton>
        </UForm>
      </div>
      <div class="flex justify-between gap-4 border-t border-gray-300 dark:border-gray-800 mt-8 pt-4">
        <!-- <UButton v-if="!session" class="flex-1" color="gray" :ui="{base: 'justify-center', rounded: 'rounded-sm'}" @click="signInWithGitHub">
          <SharedBrandIcons provider="github" />
        </UButton> -->
        <UButton v-if="!session" class="flex-1" color="gray" :ui="{base: 'justify-center', rounded: 'rounded-sm'}" @click="signInWithOAuth">
          <SharedBrandIcons provider="google" />
          Google
        </UButton>
        <!-- <UButton v-if="!session" class="flex-1" color="gray" :ui="{base: 'justify-center', rounded: 'rounded-sm'}" @click="signInWithOAuth">
          <SharedBrandIcons provider="facebook" />
        </UButton> -->
      </div>
    </UCard>
  </div>
</template>
