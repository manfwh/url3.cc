<script lang="ts" setup>
// const route = useRoute()
const { t } = useI18n()
const head = useLocaleHead({
  addDirAttribute: true,
  identifierAttribute: 'id',
  addSeoAttributes: true
})
const title = computed(() => t('site.title'))
</script>
<template>
  <div class="aaa">
    <Head>
      <Title>{{ title }}</Title>
      <template v-for="link in head.link" :key="link.id">
        <Link :id="link.id" :rel="link.rel" :href="link.href" :hreflang="link.hreflang" />
      </template>
      <template v-for="meta in head.meta" :key="meta.id">
        <Meta :id="meta.id" :property="meta.property" :content="meta.content" />
      </template>
    </Head>
    <Body>
      <slot />
      <ModalContainer />
      <footer class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20 text-slate-700 dark:text-slate-300 py-4 text-sm">
        © 2023 URL3.CC. All rights reserved.
      </footer>
    </Body>
  </div>
</template>
