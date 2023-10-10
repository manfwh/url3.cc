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
const selected = ref(INTERVALS[3].slug)
const current = computed(() => INTERVALS.find(item => item.slug === selected.value))
provide('key', route.params.key)
provide(THEME_KEY, colorMode)
provide(LOADING_OPTIONS_KEY, loadingOptions)
provide(STATS_KEY, {
  interval: selected
})
const { y } = useWindowScroll()

</script>
<template>
  <div class="bg-slate-50 dark:bg-gray-950 pt-2 h-[2000px]">
    <div class="sticky top-[65px] bg-slate-50 dark:bg-gray-950 dark:shadow-slate-800 z-10 mb-2" :class="{'shadow-sm': y > 50 }">
      <div class="container mx-auto flex items-center justify-between h-16 transition-all duration-100 ">
        <h1>
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
    <div class="container mx-auto">
      <ClientOnly>
        <div class="h-[2000px] space-y-12">
          <LinkStatsStatTimeserirs />
          <LinkStatsStatLocation />
          <div class="grid grid-cols-3 gap-4">
            <LinkStatsStatDevice />
            <LinkStatsStateBrowser />
            <LinkStatsStateOs />
          </div>
        </div>
      </ClientOnly>
    </div>
  </div>
</template>
