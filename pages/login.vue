<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui/dist/runtime/types'
import type { Database } from '~/types/type'
import { safeInternalPath } from '~/utils/safe-redirect'
definePageMeta({
  layout: 'default',
  middleware: 'auth'
})
const supabase = useSupabaseClient<Database>()
const localePath = useLocalePath()
const url = useRequestURL()
const redirectTarget = safeInternalPath(url.searchParams.get('redirect'))
const redirectTo = redirectTarget
  ? `${url.origin}/confirm?redirect=${encodeURIComponent(redirectTarget)}`
  : `${url.origin}/confirm`

const {
  data: { session }
} = await supabase.auth.getSession()

const submitting = ref(false)
const oauthSubmitting = ref(false)
const errorMessage = ref('')

async function signInWithGitHub () {
  errorMessage.value = ''
  oauthSubmitting.value = true
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo
      }
    })
    if (error) {
      errorMessage.value = error.message
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Sign in failed'
  } finally {
    oauthSubmitting.value = false
  }
}
const signInWithOAuth = async () => {
  errorMessage.value = ''
  oauthSubmitting.value = true
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
    if (error) {
      errorMessage.value = error.message
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Sign in failed'
  } finally {
    oauthSubmitting.value = false
  }
}

const state = ref({
  email: ''
})

async function submit (event: FormSubmitEvent<{ email: string }>) {
  errorMessage.value = ''
  submitting.value = true
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: event.data.email,
      options: {
        emailRedirectTo: redirectTo
      }
    })
    if (error) {
      errorMessage.value = error.message
      return
    }
    if (data.session) {
      await navigateTo(redirectTarget || localePath('/'))
      return
    }
    await navigateTo(localePath('/auth/verify-request'))
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Sign in failed'
  } finally {
    submitting.value = false
  }
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

          <UAlert
            v-if="errorMessage"
            color="red"
            variant="subtle"
            icon="i-heroicons-exclamation-triangle"
            :title="errorMessage"
          />

          <UButton type="submit" block :loading="submitting">
            Continue with email
          </UButton>
        </UForm>
      </div>
      <div class="flex justify-between gap-4 border-t border-gray-300 dark:border-gray-800 mt-8 pt-4">
        <!-- <UButton v-if="!session" class="flex-1" color="gray" :ui="{base: 'justify-center', rounded: 'rounded-sm'}" @click="signInWithGitHub">
          <SharedBrandIcons provider="github" />
        </UButton> -->
        <UButton
          v-if="!session"
          class="flex-1"
          color="gray"
          :loading="oauthSubmitting"
          :ui="{base: 'justify-center', rounded: 'rounded-sm'}"
          @click="signInWithOAuth"
        >
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
