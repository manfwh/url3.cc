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
const key = inject('key')
const json: any = await $fetch('/data/world.geo.json')
registerMap('world', json)
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
    grid: { right: '45%', left: '0%', bottom: '5%' },
    backgroundColor: 'transparent',
    visualMap: {
      left: 'right',
      min: Math.min.apply(null, chartData.map((d: any) => d.value)),
      max: Math.max.apply(null, chartData.map((d: any) => d.value)),
      inRange: {
        // prettier-ignore
        color: ['#dcfce7', '#22c55e']
      },
      text: ['High', 'Low'],
      calculable: true
    },
    color: ['#22c55e'],
    yAxis: {
      type: 'category',
      data: chartData.map((item: any) => item.name)
    },
    xAxis: { gridIndex: 0, max: chartData.reduce((max: number, item: any) => max + item.value, 0) },
    series: [
      {
        type: 'bar',
        right: 300,
        label: {
          show: true,
          formatter: '{b}: {@score}',
          position: 'insideBottomLeft'
        },
        data: chartData,
        itemStyle: {
          color: 'red',
          borderRadius: [0, 5, 5, 0]
        },
        barWidth: 30
      },
      {
        id: 'population',
        type: 'map',
        map: 'world',
        roam: true,
        seriesLayoutBy: 'row',
        itemStyle: {
          areaColor: '#f8fafc',
          borderColor: '#64748b'
        },
        left: '55%',
        emphasis: {
          itemStyle: {
            areaColor: '#22c55e'
          },
          label: {
            color: '#fff'
          }
        },
        layoutCenter: ['75%', '50%'],
        // 如果宽高比大于 1 则宽度为 100，如果小于 1 则高度为 100，保证了不超过 100x100 的区域
        layoutSize: 500,
        data: chartData
      }
    ]
  }
})
// onMounted(() => {
//   $fetch('/data/world.geo.json')
//     .then((json: any) => {
//       registerMap('world', json)
//       // chart.value?.setOption()
//       if (data.value) {

//       }
//     })
// })
// const option: EChartsOption =
</script>
<template>
  <UCard>
    <v-chart ref="chart" :option="option" class="h-[400px]" :loading="pending " />
  </UCard>
</template>
