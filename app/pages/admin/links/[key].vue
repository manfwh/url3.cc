<script setup lang="ts">
import { THEME_KEY, LOADING_OPTIONS_KEY } from 'vue-echarts'
import { STATS_KEY } from '~/composables/use-stats'
import { INTERVALS } from '~/lib/stats'

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
  banned: boolean
  banned_at: string | null
  visitor_id: string | null
  visitor_ip: string | null
}

type AdminAction = 'delete' | 'ban' | 'unban'

const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()
const colorMode = useColorMode()
const appConfig = useAppConfig()
const selected = ref(INTERVALS[0].slug)
const linkKey = computed(() => {
  const value = route.params.key
  return Array.isArray(value) ? value[0] || '' : value || ''
})

provide('key', linkKey)
provide('statsApiBase', '/api/admin/links')
provide(THEME_KEY, colorMode)
provide(LOADING_OPTIONS_KEY, computed(() => ({
  color: 'rgb(var(--color-primary-DEFAULT))',
  textColor: 'rgb(var(--color-primary-DEFAULT))',
  maskColor: 'rgba(255, 255, 255, 0)'
})))
provide(STATS_KEY, { interval: selected })

const { data: link, error, refresh } = await useFetch<GuestLink>(() => `/api/admin/links/${encodeURIComponent(linkKey.value)}`)

const pending = ref<AdminAction | null>(null)
const acting = ref(false)
const actionError = ref('')
const confirmOpen = computed({
  get: () => pending.value !== null,
  set (open: boolean) {
    if (!open && !acting.value) { pending.value = null }
  }
})
const confirmCopy = computed(() => {
  if (pending.value === 'ban') {
    return { title: t('admin.ban_title'), description: t('admin.ban_description') }
  }
  if (pending.value === 'unban') {
    return { title: t('admin.unban_title'), description: t('admin.unban_description') }
  }
  return { title: t('admin.delete_title'), description: t('admin.delete_description') }
})

function ask (action: AdminAction) {
  actionError.value = ''
  pending.value = action
}

async function confirmAction () {
  if (!pending.value || !link.value) { return }
  const action = pending.value
  acting.value = true
  actionError.value = ''
  try {
    const path = `/api/admin/links/${encodeURIComponent(link.value.key)}`
    if (action === 'delete') {
      await $fetch(path, { method: 'DELETE' })
      pending.value = null
      await navigateTo(localePath('/admin'))
      return
    }
    await $fetch(`${path}/${action}`, { method: 'POST' })
    pending.value = null
    await refresh()
  } catch {
    actionError.value = t('admin.action_failed')
  } finally {
    acting.value = false
  }
}

function formatTime (value: string | null | undefined) {
  if (!value) { return '' }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) { return '' }
  return `${date.toISOString().replace('T', ' ').slice(0, 16)} UTC`
}
</script>

<template>
  <div class="bg-slate-50 dark:bg-gray-950 pt-2 pb-28">
    <div class="w-full max-w-screen-xl px-2.5 lg:px-20 mx-auto">
      <div class="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
        <div class="flex items-center gap-2">
          <UButton
            class="rounded-full"
            icon="i-heroicons-arrow-small-left"
            color="neutral"
            variant="ghost"
            :to="localePath('/admin')"
          />
          <div>
            <p class="text-sm text-gray-500">
              {{ $t('admin.back') }}
            </p>
            <UButton
              v-if="link"
              color="neutral"
              variant="ghost"
              :to="`${appConfig.fullDomain}${link.key}`"
              target="_blank"
            >
              {{ appConfig.domain }}/{{ link.key }}
            </UButton>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <template v-if="link">
            <UButton
              v-if="link.banned"
              color="primary"
              variant="soft"
              @click="ask('unban')"
            >
              {{ $t('admin.unban') }}
            </UButton>
            <UButton
              v-else
              color="warning"
              variant="soft"
              @click="ask('ban')"
            >
              {{ $t('admin.ban') }}
            </UButton>
            <UButton color="error" variant="soft" @click="ask('delete')">
              {{ $t('admin.delete') }}
            </UButton>
          </template>
          <div class="w-44">
            <USelectMenu
              v-model="selected"
              :search-input="false"
              :items="INTERVALS"
              label-key="display"
              value-key="slug"
            >
              <template #leading>
                <UIcon name="i-heroicons-calendar-days" />
              </template>
            </USelectMenu>
          </div>
        </div>
      </div>

      <UAlert
        v-if="error"
        class="mb-6"
        color="error"
        variant="subtle"
        icon="i-heroicons-exclamation-triangle"
        :title="$t('admin.load_failed')"
      />

      <dl v-if="link" class="mb-8 grid gap-4 rounded-md bg-white p-4 text-sm dark:bg-gray-900 md:grid-cols-2">
        <div>
          <dt class="text-gray-500">
            {{ $t('admin.url') }}
          </dt>
          <dd class="break-all">
            <a v-if="link.url" :href="link.url" target="_blank" rel="noreferrer">{{ link.url }}</a>
          </dd>
        </div>
        <div>
          <dt class="text-gray-500">
            {{ $t('admin.status') }}
          </dt>
          <dd class="flex flex-wrap gap-1">
            <UBadge v-if="link.banned" color="error" variant="subtle">
              {{ $t('admin.banned') }}
            </UBadge>
            <UBadge v-if="link.expired" color="warning" variant="subtle">
              {{ $t('admin.expired') }}
            </UBadge>
            <UBadge v-if="!link.banned && !link.expired" color="success" variant="subtle">
              {{ $t('admin.active') }}
            </UBadge>
          </dd>
        </div>
        <div>
          <dt class="text-gray-500">
            {{ $t('admin.created') }}
          </dt>
          <dd>{{ formatTime(link.created_at) }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">
            {{ $t('admin.expires') }}
          </dt>
          <dd>{{ formatTime(link.expires_at) }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">
            {{ $t('admin.last_visit') }}
          </dt>
          <dd>{{ link.last_visited_at ? formatTime(link.last_visited_at) : $t('admin.never') }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">
            {{ $t('admin.clicks') }}
          </dt>
          <dd>{{ link.clicks }}</dd>
        </div>
        <div>
          <dt class="text-gray-500">
            {{ $t('admin.visitor_id') }}
          </dt>
          <dd class="break-all font-mono text-xs">
            {{ link.visitor_id || $t('admin.never') }}
          </dd>
        </div>
        <div>
          <dt class="text-gray-500">
            {{ $t('admin.visitor_ip') }}
          </dt>
          <dd class="font-mono text-xs">
            {{ link.visitor_ip || $t('admin.never') }}
          </dd>
        </div>
      </dl>

      <ClientOnly>
        <div class="space-y-12">
          <LinkStatsStatTimeserirs />
          <LinkStatsStatLocation />
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LinkStatsStatDevice />
            <LinkStatsStateBrowser />
            <LinkStatsStateOs />
          </div>
        </div>
        <template #fallback>
          <UIcon name="i-lucide-loader" class="animate-spin" />
        </template>
      </ClientOnly>
    </div>
    <UModal v-model:open="confirmOpen" :dismissible="false">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                {{ confirmCopy.title }}
              </h3>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-x-mark-20-solid"
                class="-my-1"
                :disabled="acting"
                @click="confirmOpen = false"
              />
            </div>
          </template>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            {{ confirmCopy.description }}
          </p>
          <UAlert
            v-if="actionError"
            class="mt-4"
            color="error"
            variant="subtle"
            icon="i-heroicons-exclamation-triangle"
            :title="actionError"
          />
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton color="neutral" variant="ghost" :disabled="acting" @click="confirmOpen = false">
                {{ $t('admin.cancel') }}
              </UButton>
              <UButton
                :color="pending === 'unban' ? 'primary' : 'error'"
                :loading="acting"
                @click="confirmAction"
              >
                {{ $t('admin.confirm') }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
