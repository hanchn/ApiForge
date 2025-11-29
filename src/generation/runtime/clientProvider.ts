import { ClientAdapter, RequestOptions } from './clientAdapter'
import { fetchAdapter } from './fetchAdapter'

let adapter: ClientAdapter | undefined

export function setClient(a: ClientAdapter) { adapter = a }
export function getClient(): ClientAdapter { return adapter || fetchAdapter }

export async function request<T>(method: 'GET'|'POST'|'PUT'|'PATCH'|'DELETE', url: string, body?: any, options?: RequestOptions): Promise<T> {
  const c = getClient()
  switch (method) {
    case 'GET': return c.get<T>(url, options)
    case 'POST': return c.post<T>(url, body, options)
    case 'PUT': return c.put<T>(url, body, options)
    case 'PATCH': return c.patch<T>(url, body, options)
    case 'DELETE': return c.delete<T>(url, options)
  }
}