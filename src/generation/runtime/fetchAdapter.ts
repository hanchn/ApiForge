import { ClientAdapter, RequestOptions } from './clientAdapter'

function buildURL(url: string, options?: RequestOptions): string {
  const base = options?.baseURL ? options.baseURL.replace(/\/$/, '') + (url.startsWith('/') ? url : '/' + url) : url
  const q = options?.query || {}
  const qs = Object.keys(q).length ? '?' + new URLSearchParams(Object.entries(q).reduce((acc, [k, v]) => { acc[k] = String(v); return acc }, {} as Record<string, string>)).toString() : ''
  return base + qs
}

async function core<T>(method: string, url: string, body?: any, options?: RequestOptions): Promise<T> {
  const finalURL = buildURL(url, options)
  const headers = Object.assign({ 'Content-Type': 'application/json' }, options?.headers || {})
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined
  const id = options?.timeout && controller ? setTimeout(() => controller.abort(), options.timeout) : undefined
  const res = await (globalThis.fetch as any)(finalURL, { method, headers, body: body != null ? JSON.stringify(body) : undefined, signal: controller?.signal })
  if (id) clearTimeout(id as any)
  if (!res.ok) throw new Error(`request failed ${res.status}`)
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return await res.json()
  const text = await res.text()
  return text as any
}

export const fetchAdapter: ClientAdapter = {
  async get<T>(url: string, options?: RequestOptions): Promise<T> { return core<T>('GET', url, undefined, options) },
  async post<T>(url: string, body?: any, options?: RequestOptions): Promise<T> { return core<T>('POST', url, body, options) },
  async put<T>(url: string, body?: any, options?: RequestOptions): Promise<T> { return core<T>('PUT', url, body, options) },
  async patch<T>(url: string, body?: any, options?: RequestOptions): Promise<T> { return core<T>('PATCH', url, body, options) },
  async delete<T>(url: string, options?: RequestOptions): Promise<T> { return core<T>('DELETE', url, undefined, options) }
}