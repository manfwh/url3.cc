<script setup lang="ts">
</script>
<template>
  <div class="py-24 sm:py-32">
    <div class="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl gap-16 sm:gap-y-24 flex flex-col">
      <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl text-center">
        Features
      </h2>
      <div class="grid grid-cols-3 gap-8">
        <UCard>
          <div class="w-10 h-10 rounded bg-slate-100 flex justify-center items-center">
            📊
          </div>
          <h3 class="text-lg mt-4">
            Analysis
          </h3>
          <p class="text-gray-600 mt-2">
            轻松查看您的短网址的点击量和访问来源，帮助您更好地了解您的目标受众。
          </p>
        </UCard>
        <UCard>
          <div class="w-10 h-10 rounded bg-slate-100 flex justify-center items-center">
            📱
          </div>
          <h3 class="text-lg mt-4">
            设备类型跳转
          </h3>
          <p class="text-gray-600 mt-2">
            根据访问者的设备类型（如手机、平板或电脑），智能跳转至最适合的页面，提供更好的用户体验。
          </p>
        </UCard>
        <UCard>
          <div class="w-10 h-10 rounded bg-slate-100 flex justify-center items-center">
            ✨
          </div>
          <h3 class="text-lg mt-4">
            自定义链接
          </h3>
          <p class="text-gray-600 mt-2">
            随心所欲地为您的长网址创建有趣的短网址，使分享变得更简单、更有趣！
          </p>
        </UCard>
      </div>
    </div>
  </div>
</template>
