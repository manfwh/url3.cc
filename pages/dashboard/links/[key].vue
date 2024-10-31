<script setup lang="ts">
import { THEME_KEY, LOADING_OPTIONS_KEY } from 'vue-echarts'
import { STATS_KEY } from '~/composables/use-stats'
import { INTERVALS } from '~/lib/stats'
const colorMode = useColorMode()
const appConfig = useAppConfig()
definePageMeta({
  layout: 'dashboard',
  meta: {
    title: 'Stats'
  }
})

const route = useRoute()
const loadingOptions = computed(() => {
  return {
    color: 'rgb(var(--color-primary-DEFAULT))',
    textColor: 'rgb(var(--color-primary-DEFAULT))',
    maskColor: 'rgba(255, 255, 255, 0)'
  }
})
const selected = ref(INTERVALS[0].slug)
const current = computed(() => INTERVALS.find(item => item.slug === selected.value))
provide('key', route.params.key)
provide(THEME_KEY, colorMode)
provide(LOADING_OPTIONS_KEY, loadingOptions)
provide(STATS_KEY, {
  interval: selected
})
const { y } = useWindowScroll()
const router = useRouter()
const backRoute = () => {
  router.back()
}
</script>
<template>
  <div class="bg-slate-50 dark:bg-gray-950 pt-2 pb-28">
    <div
      class="sticky top-[65px] bg-slate-50 dark:bg-gray-950 dark:shadow-slate-800 z-10 mb-2"
      :class="{'shadow-sm': y > 50 }"
    >
      <div class="w-full max-w-screen-xl px-2.5 lg:px-20 mx-auto flex items-center justify-between h-16 transition-all duration-100 ">
        <h1 class="flex items-center">
          <UButton
            :ui="{ rounded: 'rounded-full' }"
            icon="i-heroicons-arrow-small-left"
            color="gray"
            variant="ghost"
            @click="backRoute"
          />
          <UButton color="gray" variant="ghost" :to="`${appConfig.fullDomain}${route.params.key}`" target="_blank">
            {{ appConfig.domain }}/{{ route.params.key }}
          </UButton>
        </h1>
        <div class="w-44">
          <USelectMenu v-model="selected" :options="INTERVALS" option-attribute="display" value-attribute="slug">
            <template #label>
              <UIcon name="i-heroicons-calendar-days" />
              {{ current?.display }}
            </template>
          </USelectMenu>
        </div>
      </div>
    </div>
    <div class="w-full max-w-screen-xl px-2.5 lg:px-20 mx-auto min-h-screen">
      <ClientOnly>
        <div class="space-y-12">
          <LinkStatsStatTimeserirs />
          <LinkStatsStatLocation />
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LinkStatsStatDevice />
            <LinkStatsStateBrowser />
            <LinkStatsStateOs />
          </div>
        </div>
        <template #fallback>
          <UIcon name="i-lucide-loader" class="animate-spin" />
        </template>
      </ClientOnly>
    </div>
  </div>
</template>
