<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'admin'
})

type GuestLink = {
  key: string
  url: string | null
  created_at: string
  expires_at: string | null
  last_visited_at: string | null
  clicks: number
  expired: boolean
  visitor_id: string | null
  visitor_ip: string | null
}

type GuestList = {
  links: GuestLink[]
  page: number
  pageSize: number
  total: number
  query: string
}

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const q = ref(typeof route.query.q === 'string' ? route.query.q : '')
watch(() => route.query.q, (value) => {
  q.value = typeof value === 'string' ? value : ''
})

const page = computed({
  get () {
    const value = Number(route.query.page)
    return Number.isInteger(value) && value > 0 ? value : 1
  },
  set (value: number) {
    const query: Record<string, string> = {}
    if (typeof route.query.q === 'string' && route.query.q) {
      query.q = route.query.q
    }
    if (value > 1) { query.page = String(value) }
    router.push({ query })
  }
})

const { data, pending, error } = await useFetch<GuestList>('/api/admin/links', {
  query: computed(() => ({
    page: page.value,
    q: typeof route.query.q === 'string' ? route.query.q : ''
  }))
})

function search () {
  const query: Record<string, string> = {}
  const term = q.value.trim()
  if (term) { query.q = term }
  router.push({ query })
}

function formatTime (value: string | null) {
  if (!value) { return '' }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) { return '' }
  return `${date.toISOString().replace('T', ' ').slice(0, 16)} UTC`
}
</script>

<template>
  <div class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20 pb-16">
    <div class="flex flex-col gap-4 py-8 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-lg">
          {{ $t('admin.title') }}
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ $t('admin.description') }}
        </p>
      </div>
      <form class="flex w-full gap-2 md:max-w-md" @submit.prevent="search">
        <UInput
          v-model="q"
          class="flex-1"
          name="q"
          :placeholder="$t('admin.search')"
          autocomplete="off"
        />
        <UButton type="submit">
          {{ $t('admin.search_action') }}
        </UButton>
      </form>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      icon="i-heroicons-exclamation-triangle"
      :title="$t('admin.load_failed')"
    />
    <div v-else-if="pending" class="text-sm text-gray-500">
      {{ $t('admin.loading') }}
    </div>
    <div v-else-if="!data?.links.length" class="text-sm text-gray-500">
      {{ $t('admin.empty') }}
    </div>
    <div v-else class="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-800">
      <table class="min-w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
          <tr>
            <th class="px-3 py-2 font-medium">
              {{ $t('admin.key') }}
            </th>
            <th class="px-3 py-2 font-medium">
              {{ $t('admin.url') }}
            </th>
            <th class="px-3 py-2 font-medium">
              {{ $t('admin.created') }}
            </th>
            <th class="px-3 py-2 font-medium">
              {{ $t('admin.last_visit') }}
            </th>
            <th class="px-3 py-2 font-medium">
              {{ $t('admin.clicks') }}
            </th>
            <th class="px-3 py-2 font-medium">
              {{ $t('admin.expires') }}
            </th>
            <th class="px-3 py-2 font-medium">
              {{ $t('admin.status') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="link in data.links"
            :key="link.key"
            class="border-t border-gray-200 dark:border-gray-800"
          >
            <td class="px-3 py-3 font-medium">
              <NuxtLink class="text-primary" :to="localePath(`/admin/links/${link.key}`)">
                {{ link.key }}
              </NuxtLink>
            </td>
            <td class="max-w-xs truncate px-3 py-3">
              <a v-if="link.url" :href="link.url" target="_blank" rel="noreferrer">{{ link.url }}</a>
            </td>
            <td class="whitespace-nowrap px-3 py-3">
              {{ formatTime(link.created_at) }}
            </td>
            <td class="whitespace-nowrap px-3 py-3">
              {{ link.last_visited_at ? formatTime(link.last_visited_at) : $t('admin.never') }}
            </td>
            <td class="px-3 py-3">
              {{ link.clicks }}
            </td>
            <td class="whitespace-nowrap px-3 py-3">
              {{ formatTime(link.expires_at) }}
            </td>
            <td class="px-3 py-3">
              <UBadge :color="link.expired ? 'error' : 'success'" variant="subtle">
                {{ link.expired ? $t('admin.expired') : $t('admin.active') }}
              </UBadge>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="data && data.total > data.pageSize" class="flex justify-end pt-8">
      <UPagination v-model:page="page" :items-per-page="data.pageSize" :total="data.total" />
    </div>
  </div>
</template>
