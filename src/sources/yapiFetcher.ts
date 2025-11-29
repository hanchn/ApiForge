import { getJson } from '../utils/http'
import { ApiItem, HttpMethod } from '../model/unified'

export interface YApiSource {
  type: 'yapi'
  sourceName: string
  url: string
  projectId?: string
  token?: string
}

function mapItem(raw: any): ApiItem | undefined {
  const id = String(raw.id ?? raw._id ?? raw._id?.$oid ?? '')
  const path = String(raw.path ?? raw.url ?? '')
  const method = String((raw.method ?? 'GET')).toUpperCase() as HttpMethod
  if (!id || !path) return undefined
  const name = raw.title || raw.summary || ''
  return { id, name, method, path, summary: raw.title || raw.summary, tags: raw.tag || raw.tags || [] }
}

export async function fetchByProjectId(source: YApiSource, projectId: string): Promise<ApiItem[]> {
  const u = new URL(source.url)
  u.searchParams.set('project_id', projectId)
  if (source.token) u.searchParams.set('token', source.token)
  const data = await getJson<any>(u.toString())
  const list = Array.isArray(data) ? data : (data?.list || data?.data || [])
  return list.map(mapItem).filter(Boolean) as ApiItem[]
}

export async function fetchByCatId(source: YApiSource, catId: string): Promise<ApiItem[]> {
  const u = new URL(source.url)
  u.searchParams.set('catid', catId)
  if (source.token) u.searchParams.set('token', source.token)
  const data = await getJson<any>(u.toString())
  const list = Array.isArray(data) ? data : (data?.list || data?.data || [])
  return list.map(mapItem).filter(Boolean) as ApiItem[]
}

export async function fetchById(source: YApiSource, id: string): Promise<ApiItem[]> {
  const u = new URL(source.url)
  u.searchParams.set('id', id)
  if (source.token) u.searchParams.set('token', source.token)
  const data = await getJson<any>(u.toString())
  const item = mapItem(Array.isArray(data) ? data[0] : (data?.data || data))
  return item ? [item] : []
}