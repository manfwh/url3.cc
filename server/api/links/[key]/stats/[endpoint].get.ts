export default defineAuthHandler((event) => {
  const endpoint = getRouterParams(event).endpoint
  throw createError({
    statusCode: 404,
    statusMessage: endpoint ? 'Unknown stats endpoint' : 'Invalid stats request'
  })
})
