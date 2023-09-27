// @ts-nocheck
import pdf from 'pdf-parse/lib/pdf-parse'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const { key } = await readValidatedBody(event, (body: any) => {
    if (!body.key) {
    // return createError({ statusCode: 400, statusMessage: 'Invalid URL' })
      throw new Error('Invalid key')
    }
    return body
  }) as { key: string }
  const supabase = await serverSupabaseClient(event)

  const { data, error } = await supabase
    .storage
    .from('shortLink')
    .download(key)
  console.log('error', error)
  const arrayBuffer = await data?.arrayBuffer()
  if (!arrayBuffer) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }
  const buffer = Buffer.from(arrayBuffer)
  const pdfData = await pdf(buffer)
  return {
    key,
    text: pdfData.text
  }
})
