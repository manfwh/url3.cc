<script setup lang="ts">
import VChart from 'vue-echarts'
import { use, registerMap } from 'echarts/core'
import { BarChart, MapChart } from 'echarts/charts'
import { VisualMapComponent, GeoComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import type { ComposeOption } from 'echarts/core'
import type { MapSeriesOption, BarSeriesOption } from 'echarts/charts'
import type {
  TitleComponentOption,
  VisualMapComponentOption,
  TooltipComponentOption,
  GeoComponentOption
} from 'echarts/components'
import COUNTRIES from '~/constants/countries'

use([
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  GeoComponent,
  MapChart,
  BarChart,
  SVGRenderer
])

type EChartsOption = ComposeOption<
  | TitleComponentOption
  | TooltipComponentOption
  | VisualMapComponentOption
  | GeoComponentOption
  | MapSeriesOption
  |BarSeriesOption
>
const json: any = await $fetch('/data/world.geo.json')
registerMap('world', json)
const key = inject('key')
const stats = useStats()
const { data, pending, error } = useFetch(`/api/links/${key}/stats/country`, {
  params: {
    interval: stats?.interval
  },
  lazy: true
})
const option = computed<EChartsOption>(() => {
  console.log('data.value ', data.value)
  const chartData = data.value ? data.value.sort((a: any, b: any) => a.clicks - b.clicks).map((item: any) => ({ name: COUNTRIES[item.country], value: item.clicks })) : []
  return {
    title: {
      text: 'LOCATION',
      left: 'left'
    },
    tooltip: {
    },
    grid: { left: '0%' },
    backgroundColor: 'transparent',
    visualMap: [{
      left: 'right',
      min: Math.min.apply(null, chartData.map((d: any) => d.value)),
      max: Math.max.apply(null, chartData.map((d: any) => d.value)),
      inRange: {
        // prettier-ignore
        color: ['#dcfce7', '#22c55e']
      },
      text: ['High', 'Low'],
      calculable: true
    }],
    color: ['#22c55e'],

    series: [
      {
        id: 'population',
        type: 'map',
        map: 'world',
        name: 'clicks',
        // roam: true,
        seriesLayoutBy: 'row',
        itemStyle: {
          areaColor: '#fff',
          borderColor: '#ccc'
        },
        emphasis: {
          itemStyle: {
            areaColor: '#22c55e'
          },
          label: {
            color: '#fff'
          }
        },
        // 如果宽高比大于 1 则宽度为 100，如果小于 1 则高度为 100，保证了不超过 100x100 的区域
        data: chartData
      }
    ]
  }
})
const page = ref(1)
const pageCount = 6
const tableRows = computed(() => {
  return data.value ? [...data.value].sort((a: any, b: any) => b.clicks - a.clicks).map((item: any) => ({ country: COUNTRIES[item.country], clicks: item.clicks })) : []
})
const rows = computed(() => {
  return tableRows.value.slice((page.value - 1) * pageCount, (page.value) * pageCount)
})
</script>
<template>
  <UCard>
    <div class="grid grid-cols-2 gap-8">
      <v-chart ref="chart" :option="option" class="h-[400px]" :loading="pending " />
      <div>
        <div class="min-h-[365px]">
          <UTable :rows="rows" />
        </div>
        <div class="flex justify-end px-3 py-3.5">
          <UPagination v-model="page" :loading="pending" :page-count="pageCount" :total="tableRows.length" :loading-state="{ icon: 'i-heroicons-arrow-path-20-solid', label: 'Loading...' }" />
        </div>
      </div>
    </div>
  </UCard>
</template>
