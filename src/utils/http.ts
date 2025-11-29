export async function getJson<T>(url: string, headers?: Record<string, string>): Promise<T> {
  const res = await (globalThis.fetch as any)(url, { headers })
  if (!res.ok) throw new Error(`http ${res.status}`)
  return await res.json()
}