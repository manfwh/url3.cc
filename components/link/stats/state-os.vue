<script setup lang="ts">
import VChart from 'vue-echarts'

import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import type { ComposeOption } from 'echarts/core'
import type { PieSeriesOption } from 'echarts/charts'
import type {
  TitleComponentOption,
  TooltipComponentOption
} from 'echarts/components'

use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  PieChart,
  SVGRenderer
])

type EChartsOption = ComposeOption<
  | TitleComponentOption
  | TooltipComponentOption
  | PieSeriesOption
>
const key = inject('key')
const stats = useStats()

const { data, pending, error } = useFetch(`/api/links/${key}/stats/os`, {
  params: {
    interval: stats?.interval
  },
  lazy: true
})
const colorMode = useColorMode()

const option = computed<EChartsOption>(() => {
  return {
    title: {
      text: 'Os',
      left: 'left'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      bottom: '5%',
      left: 'center'
    },
    backgroundColor: 'transparent',
    series: [
      {
        name: 'Os',
        type: 'pie',
        radius: ['55%', '70%'],

        itemStyle: {
          borderColor: colorMode.value === 'dark' ? '#000' : '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        labelLine: {
          show: false
        },
        height: 300,

        data: data.value ? data.value.map((item: any) => ({ name: item.os, value: item.clicks })) : []
      }
    ]
  }
})
</script>
<template>
  <UCard :ui="{base: 'overflow-visible'}">
    <v-chart class="h-[350px]" :option="option" :loading="pending" />
  </UCard>
</template>
