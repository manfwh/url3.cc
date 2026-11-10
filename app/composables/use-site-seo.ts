import { absoluteUrl, isLocalizedHome, SITE_ORIGIN } from '~/utils/public-seo'

const OG_IMAGE = `${SITE_ORIGIN}/og.png`

export function useSiteSeo () {
  const { t, locale } = useI18n()
  const route = useRoute()
  const title = computed(() => {
    void locale.value
    return t('site.title')
  })
  const description = computed(() => {
    void locale.value
    return t('site.description')
  })

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    // Homepage og:url is the i18n self-canonical so it stays aligned with hreflang.
    ogUrl: () => isLocalizedHome(route.path) ? undefined : absoluteUrl(route.path),
    ogType: 'website',
    ogImage: OG_IMAGE,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: title,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: OG_IMAGE,
    twitterImageAlt: title
  })

  useHead(() => ({
    script: [
      {
        key: 'ld-webapp',
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: title.value,
          url: SITE_ORIGIN,
          description: description.value,
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Web',
          image: OG_IMAGE,
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
          }
        })
      }
    ]
  }))
}
