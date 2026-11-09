const SITE_URL = 'https://app.url3.cc'
const OG_IMAGE = `${SITE_URL}/og.png`

export function useSiteSeo () {
  const { t } = useI18n()
  const route = useRoute()
  const title = computed(() => t('site.title'))
  const description = computed(() => t('site.description'))
  const pageUrl = computed(() => new URL(route.path || '/', SITE_URL).href)

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogUrl: pageUrl,
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
          url: SITE_URL,
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
