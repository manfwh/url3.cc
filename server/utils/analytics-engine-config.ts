import { useRuntimeConfig } from '#imports'

function configuredValue (...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

export function readAnalyticsEngineConfig () {
  const config = useRuntimeConfig()
  return {
    accountId: configuredValue(
      process.env.CF_ACCOUNT_ID,
      process.env.NUXT_CF_ACCOUNT_ID,
      config.cfAccountId
    ),
    apiToken: configuredValue(
      process.env.CF_ANALYTICS_API_TOKEN,
      process.env.NUXT_CF_ANALYTICS_API_TOKEN,
      config.cfAnalyticsApiToken
    ),
    dataset: configuredValue(
      process.env.CF_ANALYTICS_DATASET,
      process.env.NUXT_CF_ANALYTICS_DATASET,
      config.cfAnalyticsDataset
    )
  }
}
