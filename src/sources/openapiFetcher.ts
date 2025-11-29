import { getJson } from '../utils/http'
import { ApiItem, HttpMethod } from '../model/unified'
import { hashString } from '../utils/checksum'

export interface OpenAPISource {
  type: 'openapi'
  sourceName: string
  url: string
  headers?: Record<string, string>
  specFormat?: 'json'|'yaml'
}

export async function fetchAllFromOpenAPI(source: OpenAPISource): Promise<ApiItem[]> {
  const doc: any = await getJson<any>(source.url, source.headers)
  const paths = doc.paths || {}
  const out: ApiItem[] = []
  for (const p of Object.keys(paths)) {
    const node = paths[p]
    for (const m of ['get','post','put','patch','delete']) {
      const op = node[m]
      if (!op) continue
      const method = m.toUpperCase() as HttpMethod
      const id = String(op.operationId || hashString(method + ' ' + p))
      const name = op.operationId || op.summary || ''
      const tags = op.tags || []
      out.push({ id, name, method, path: p, summary: op.summary, description: op.description, tags, reqSchema: op.requestBody, resSchema: op.responses })
    }
  }
  return out
}