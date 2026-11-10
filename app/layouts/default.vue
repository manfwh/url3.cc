<script lang="ts" setup>
import { isLocalizedHome } from '~/utils/public-seo'

const route = useRoute()
const { t, locale } = useI18n()
const head = useLocaleHead({
  dir: true,
  lang: true,
  seo: true
})

const title = computed(() => {
  void locale.value
  return t('site.title')
})
const localizedHome = computed(() => isLocalizedHome(route.path))
const seoLinks = computed(() => {
  if (!localizedHome.value) { return [] }
  return (head.value.link ?? []).map(link => ({
    id: link.id,
    rel: link.rel,
    href: link.href,
    hreflang: 'hreflang' in link ? link.hreflang : undefined
  }))
})
const seoMeta = computed(() => localizedHome.value ? head.value.meta ?? [] : [])
</script>
<template>
  <Html :lang="head.htmlAttrs?.lang" :dir="head.htmlAttrs?.dir">
    <Head>
      <Title>{{ title }}</Title>
      <template v-for="link in seoLinks" :key="link.id || `${link.rel}-${link.href}`">
        <Link :id="link.id" :rel="link.rel" :href="link.href" :hreflang="link.hreflang" />
      </template>
      <template v-for="meta in seoMeta" :key="meta.id || `${meta.property}-${meta.content}`">
        <Meta :id="meta.id" :property="meta.property" :content="meta.content == null ? undefined : String(meta.content)" />
      </template>
    </Head>
    <Body>
      <HeaderLayout />
      <slot />
      <footer class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20 text-slate-700 dark:text-slate-300 py-4 text-sm">
        © 2026 URL3.CC. All rights reserved.
      </footer>
      <ModalContainer />
      <Background />
    </Body>
  </Html>
</template>
