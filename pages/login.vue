<script setup lang="ts">
import type { Database } from '~/types/type'
const supabase = useSupabaseClient<Database>()
const redirectTo = 'http://localhost:8888/confirm'
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
    </UCard>
  </div>
</template>
