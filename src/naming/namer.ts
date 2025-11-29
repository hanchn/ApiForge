import { ApiItem, HttpMethod } from '../model/unified'

export type NamingScheme = 'resourceVerbCamel'|'pathSnake'

export function verbOf(method: HttpMethod): string {
  switch (method) {
    case 'GET': return 'get'
    case 'POST': return 'create'
    case 'PUT': return 'update'
    case 'PATCH': return 'patch'
    case 'DELETE': return 'remove'
  }
}

export function toSnake(s: string): string {
  return s.replace(/[-\s]+/g, '_').replace(/_+/g, '_')
}

export function nameFromPathSnake(item: ApiItem, removePrefixes: string[] = []): string {
  const verb = verbOf(item.method)
  const segments = item.path.split('/').filter(Boolean)
  const staticSegs: string[] = []
  const params: string[] = []
  for (const seg of segments) {
    const m = seg.match(/^\{(.+)\}$/)
    if (m) params.push(m[1])
    else staticSegs.push(seg)
  }
  const filtered = staticSegs.filter(x => !removePrefixes.includes(x))
  const body = filtered.map(toSnake).join('_')
  const paramPart = params.length ? `_by_${params.map(p => toSnake(p)).join('_and_')}` : ''
  let name = `${verb}${body ? '_' + body : ''}${paramPart}`
  if (/^[0-9]/.test(name)) name = `api_${name}`
  return name
}