<script setup lang="ts">
const supabase = useSupabaseClient()
// const links = useStorage<{key: string, url: string}[]>('links', [])

// const deleteLink = (key: string) => {
//   links.value = links.value.filter(link => link.key !== key)
// }
const { data: { session } } = await supabase.auth.getSession()
const signInWithGitHub = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      // redirectTo: 'http://localhost:3000/confirm'
    }
  })
}
</script>
<template>
  <div>
    <div class="sticky inset-x-0 top-0 z-30 w-full border-b dark:border-gray-600 backdrop-blur-lg">
      <div class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20">
        <div class="flex justify-between items-center h-16">
          <div>
            <h1 class="text-primary font-semibold text-2xl">
              <nuxt-link to="/">
                URL3.cc
              </nuxt-link>
            </h1>
          </div>
          <div class="flex items-center space-x-4">
            <SharedColorModeButton />
            <button v-if="!session" type="button" @click="signInWithGitHub">
              Github 登录
            </button>
            <UButton v-else to="/dashboard" variant="outline">
              Dashboard
            </UButton>
          </div>
        </div>
      </div>
    </div>
    <h1 class="text-6xl text-center text-gray-800 dark:text-gray-100 mt-24 font-bold mb-8">
      Welcome to <span class="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-400">Short Link</span> Generator!
    </h1>
    <p class="text-center text-gray-700 dark:text-gray-300">
      Convert your lengthy URLs into short and simple links in just a single click. Get started now!
    </p>
    <HomeDemoCreate />
    <Background />
  </div>
</template>
