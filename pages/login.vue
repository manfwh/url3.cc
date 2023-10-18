<script setup lang="ts">
import type { Database } from '~/types/type'

const supabase = useSupabaseClient<Database>()
const url = useRequestURL()
const redirectTo = url.origin + '/confirm'
async function signInWithGitHub () {
  console.log('redirectTo', redirectTo)
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
</script>
<template>
  <div class="h-screen flex justify-center items-center">
    <UCard class="md:w-96">
      <h1 class="mb-8 text-2xl text-center">
        Login
      </h1>
      <UButton v-if="!session" type="button" block @click="signInWithGitHub">
        Github 登录
      </UButton>
      <UButton v-if="!session" type="button" block @click="signInWithOAuth">
        Google 登录
      </UButton>
    </UCard>
  </div>
</template>
