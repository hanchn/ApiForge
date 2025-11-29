export type HttpMethod = 'GET'|'POST'|'PUT'|'PATCH'|'DELETE'

export interface ApiItem {
  id: string
  name: string
  method: HttpMethod
  path: string
  summary?: string
  description?: string
  tags?: string[]
  reqSchema?: any
  resSchema?: any
}