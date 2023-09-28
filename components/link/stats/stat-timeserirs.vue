<script setup lang="ts">
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent
} from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import type { ComposeOption } from 'echarts/core'
import type { LineSeriesOption } from 'echarts/charts'
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption
} from 'echarts/components'

use([TitleComponent, TooltipComponent, GridComponent, LineChart, SVGRenderer])

type EChartsOption = ComposeOption<
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LineSeriesOption
>

const key = inject('key')
const stats = useStats()
const { data, pending, error } = useFetch(`/api/links/${key}/stats/timeserirs`, {
  params: {
    interval: stats?.interval
  },
  lazy: true
})
const formatTimestamp = (e: Date) => {
  switch (stats?.interval.value) {
    case '1h':
      return new Date(e).toLocaleTimeString('en-us', {
        hour: 'numeric',
        minute: 'numeric'
      })
    case '24h':
      return new Date(e)
        .toLocaleDateString('en-us', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric'
        })
        .replace(',', ' ')
    case '90d':
    case 'all':
      return new Date(e).toLocaleDateString('en-us', {
        month: 'short',
        year: 'numeric'
      })
    default:
      return new Date(e).toLocaleDateString('en-us', {
        month: 'short',
        day: 'numeric'
      })
  }
}
const colorMode = useColorMode()
const option = computed<EChartsOption>(() => {
  let values = data.value?.map((item: any) => ({ value: item.clicks, name: 'clicks' })) || []
  let xAxisData = data.value?.map((item: any) => formatTimestamp(new Date(item.start))) || []
  if (pending.value) {
    values = []
    xAxisData = []
  }
  return {
    title: {
      text: 'TOTAL CLICKS',
      // subtext: 'CLICKS',
      left: 'left'
    },
    tooltip: {
      trigger: 'axis'
    },
    backgroundColor: 'transparent',
    grid: {
      left: '2%',
      right: '2%'
    },
    color: ['#22c55e'],
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisTick: {
        show: false
      },
      axisLine: {
        show: false
      }

    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      min: 0

      // max: Math.max.apply(null, values.map((item: any) => item.value)) + 4
    },
    series: [
      {
        name: 'clicks',
        type: 'line',
        data: values,
        showSymbol: false,
        smooth: true,
        areaStyle: {
          opacity: 0.5,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: '#22c55e' // 0% 处的颜色
            }, {
              offset: 1, color: colorMode.value === 'dark' ? '#052e16' : '#ecfdf5' // 100% 处的颜色
            }],
            global: false // 缺省为 false
          }
        }

      }
    ]
  }
})
</script>
<template>
  <UCard>
    <v-chart class="h-[400px]" :option="option" :loading="pending" />
  </UCard>
</template>
<style>
.a {
  color: #f0fdf4;
}
</style>
