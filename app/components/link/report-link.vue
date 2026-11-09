<script setup lang="ts">
import { linkErrorI18nKey } from '~/utils/link-api-error'

const props = defineProps<{
  linkKey?: string
}>()

const { t } = useI18n()
const open = ref(false)
const reason = ref('phishing')
const details = ref('')
const pasted = ref('')
const submitting = ref(false)
const done = ref(false)
const errorMessage = ref('')

const reasons = computed(() => [
  { label: t('security.report.phishing'), value: 'phishing' },
  { label: t('security.report.malware'), value: 'malware' },
  { label: t('security.report.spam'), value: 'spam' },
  { label: t('security.report.other'), value: 'other' }
])

function openReport () {
  done.value = false
  errorMessage.value = ''
  details.value = ''
  pasted.value = ''
  reason.value = 'phishing'
  open.value = true
}

function parseKey (input: string) {
  const trimmed = input.trim()
  if (/^[A-Za-z0-9_-]{1,128}$/.test(trimmed)) { return trimmed }
  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
    const key = url.pathname.split('/').filter(Boolean).pop() || ''
    if (/^[A-Za-z0-9_-]{1,128}$/.test(key)) { return key }
  } catch {
    return ''
  }
  return ''
}

async function submit () {
  const key = props.linkKey || parseKey(pasted.value)
  if (!key) {
    errorMessage.value = t('security.report.invalid_link')
    return
  }
  submitting.value = true
  errorMessage.value = ''
  try {
    await $fetch(`/api/links/${key}/report`, {
      method: 'POST',
      body: {
        reason: reason.value,
        details: details.value
      }
    })
    done.value = true
  } catch (error) {
    const messageKey = linkErrorI18nKey(error)
    errorMessage.value = messageKey === 'security.create_failed' ? t('security.report.failed') : t(messageKey)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <UButton color="neutral" variant="ghost" icon="i-heroicons-flag" @click="openReport">
      {{ linkKey ? $t('security.report.button') : $t('security.report.site_button') }}
    </UButton>
    <UModal v-model:open="open">
      <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ $t('security.report.title') }}
            </h3>
            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="open = false" />
          </div>
        </template>
        <p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
          {{ $t('security.report.description') }}
        </p>
        <UAlert
          v-if="done"
          color="success"
          variant="subtle"
          icon="i-heroicons-check-circle"
          :title="$t('security.report.success')"
        />
        <form v-else class="space-y-4" @submit.prevent="submit">
          <UFormField v-if="!linkKey" :label="$t('security.report.link_label')" name="link">
            <UInput v-model="pasted" :placeholder="$t('security.report.link_placeholder')" required />
          </UFormField>
          <UFormField :label="$t('security.report.reason')" name="reason">
            <USelectMenu
              v-model="reason"
              :search-input="false"
              :items="reasons"
              value-key="value"
              label-key="label"
            />
          </UFormField>
          <UFormField :label="$t('security.report.details')" name="details">
            <UTextarea
              v-model="details"
              :maxlength="500"
              :placeholder="$t('security.report.details_placeholder')"
            />
          </UFormField>
          <UAlert
            v-if="errorMessage"
            color="error"
            variant="subtle"
            icon="i-heroicons-exclamation-triangle"
            :title="errorMessage"
          />
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" type="button" @click="open = false">
              {{ $t('security.report.cancel') }}
            </UButton>
            <UButton type="submit" :loading="submitting">
              {{ $t('security.report.submit') }}
            </UButton>
          </div>
        </form>
      </UCard>
          </template>
    </UModal>
  </div>
</template>
