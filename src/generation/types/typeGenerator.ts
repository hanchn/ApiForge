import * as fs from 'fs'
import * as path from 'path'
import { ApiItem } from '../../model/unified'

function pascalCase(s: string): string {
  return s.replace(/(^|_|-|\s)([a-z])/g, (_m, _p, c) => c.toUpperCase()).replace(/[_-\s]/g, '')
}

function extractPathParams(pathTmpl: string): string[] {
  const out: string[] = []
  pathTmpl.replace(/\{([^}]+)\}/g, (_m, p1) => { out.push(String(p1)); return '' })
  return out
}

function schemaPropToTs(prop: any): string {
  const t = prop?.type
  if (t === 'integer' || t === 'number') return 'number'
  if (t === 'string') return 'string'
  if (t === 'boolean') return 'boolean'
  if (t === 'array') {
    const it = schemaPropToTs(prop.items || {})
    return `${it}[]`
  }
  if (t === 'object') return 'Record<string, any>'
  return 'any'
}

function schemaToInterface(name: string, schema: any): string {
  const props = schema?.properties || {}
  const required: string[] = schema?.required || []
  const lines: string[] = []
  for (const k of Object.keys(props)) {
    const tsType = schemaPropToTs(props[k])
    const opt = required.includes(k) ? '' : '?'
    lines.push(`  ${k}${opt}: ${tsType}`)
  }
  return `export interface ${name} {\n${lines.join('\n')}\n}\n\n`
}

function pickReqSchema(item: ApiItem): any {
  const rb = (item as any).reqSchema
  const content = rb?.content || {}
  const json = content['application/json'] || content['application/x-www-form-urlencoded']
  return json?.schema || rb?.schema || null
}

function pickResSchema(item: ApiItem): any {
  const res = (item as any).resSchema || {}
  const ok = res['200'] || res['201'] || res['default']
  const content = ok?.content || {}
  const json = content['application/json']
  return json?.schema || ok?.schema || null
}

export function generateTypes(baseDir: string, sourceName: string, items: { item: ApiItem; exportName: string }[]) {
  const root = path.join(baseDir, sourceName)
  const typesPath = path.join(root, 'types.ts')
  let contents = ''
  for (const { item, exportName } of items) {
    const fnPascal = pascalCase(exportName)
    const paramsName = `${fnPascal}Params`
    const respName = `${fnPascal}Response`
    const pathParams = extractPathParams(item.path)
    if (pathParams.length) {
      contents += `export interface ${paramsName} { ${pathParams.map(p => `${p}: string`).join('; ')} }\n\n`
    } else {
      contents += `export type ${paramsName} = Record<string, any>\n\n`
    }
    const reqSchema = pickReqSchema(item)
    const resSchema = pickResSchema(item)
    if (reqSchema && reqSchema.properties) contents += schemaToInterface(paramsName, reqSchema)
    if (resSchema && resSchema.properties) contents += schemaToInterface(respName, resSchema)
    else contents += `export type ${respName} = any\n\n`
  }
  fs.mkdirSync(root, { recursive: true })
  fs.writeFileSync(typesPath, contents, 'utf8')
}