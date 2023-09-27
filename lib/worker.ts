import { pipeline } from '@xenova/transformers'

const generateEmbedding = (async function () {
  return await pipeline('feature-extraction', 'Supabase/gte-small')
})()

self.addEventListener('message', async (event) => {
  console.log('event msg', event)
  try {
    const output = await (await generateEmbedding)(event.data.text, {
      pooling: 'mean',
      normalize: true
    })
    console.log('output', output)

    self.postMessage({
      status: 'complete',
      output: Array.from(output.data)
    })
  } catch (error) {
    console.log('worker', error)
  }
})
