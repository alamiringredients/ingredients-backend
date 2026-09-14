export async function limitRequestBody(request: Request, maxBytes: number): Promise<Request | null> {
  const declared = request.headers.get('content-length')
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) return null
  if (!request.body) return request
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const {done, value} = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) {await reader.cancel(); return null}
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  return new Request(request.url, {method: request.method, headers: request.headers, body: Buffer.concat(chunks), signal: request.signal})
}
