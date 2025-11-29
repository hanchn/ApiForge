import * as fs from 'fs'
import * as path from 'path'
import { ApiItem } from '../../model/unified'
import { nameFromPathSnake } from '../../naming/namer'
import { MetaStore } from '../../meta/metaStore'
import { RenameStore } from '../../naming/renameStore'
import { hashString } from '../../utils/checksum'
import { generateTypes } from '../types/typeGenerator'

function ensureDir(p: string) { fs.mkdirSync(p, { recursive: true }) }

function groupKey(item: ApiItem): string {
  const tag = (item.tags && item.tags[0]) || item.path.split('/').filter(Boolean)[0] || 'api'
  return tag.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase()
}

function buildUrlFromPath(pathTmpl: string, paramsVar: string = 'params'): string {
  return pathTmpl.replace(/\{([^}]+)\}/g, (_m, p1) => '${encodeURIComponent(' + paramsVar + '.' + p1 + ')}')
}

function hasExportedFunction(contents: string, name: string): boolean {
  const re = new RegExp(`export\\s+async\\s+function\\s+${name}\\s*\(`)
  return re.test(contents)
}

function appendFunction(filePath: string, funcCode: string) {
  if (fs.existsSync(filePath)) {
    const cur = fs.readFileSync(filePath, 'utf8')
    const next = cur.endsWith('\n') ? cur + funcCode : cur + '\n' + funcCode
    fs.writeFileSync(filePath, next, 'utf8')
  } else {
    fs.writeFileSync(filePath, funcCode, 'utf8')
  }
}

function serviceHeader(): string {
  return `import { request } from '../runtime/clientProvider'\n\n`
}

function extractPathParams(pathTmpl: string): string[] {
  const out: string[] = []
  pathTmpl.replace(/\{([^}]+)\}/g, (_m, p1) => { out.push(String(p1)); return '' })
  return out
}

function makeFunction(item: ApiItem, finalName: string): string {
  const url = buildUrlFromPath(item.path)
  const params = extractPathParams(item.path)
  const paramsType = params.length ? `{ ${params.map(p => `${p}: string`).join('; ')} }` : 'Record<string, any>'
  return `export async function ${finalName}(params?: ${paramsType}, body?: any): Promise<any> {\n  const url = \`${url}\`\n  return request<any>('${item.method}', url, body, { })\n}\n\n`
}

export function generateApis(baseDir: string, sourceName: string, items: ApiItem[]) {
  const root = path.join(baseDir, sourceName)
  ensureDir(root)
  const indexPath = path.join(root, 'index.ts')
  const meta = new MetaStore(baseDir, sourceName)
  const rename = new RenameStore(baseDir, sourceName)
  const renameMap = rename.read()
  const typeInputs: { item: ApiItem; exportName: string }[] = []
  const groups: Record<string, ApiItem[]> = {}
  for (const it of items) {
    const g = groupKey(it)
    if (!groups[g]) groups[g] = []
    groups[g].push(it)
  }
  for (const [g, list] of Object.entries(groups)) {
    const serviceFile = path.join(root, `${g}.service.ts`)
    let contents = fs.existsSync(serviceFile) ? fs.readFileSync(serviceFile, 'utf8') : ''
    if (!contents) contents = serviceHeader()
    const typeNames: Set<string> = new Set()
    for (const it of list) {
      const suggested = nameFromPathSnake(it)
      const finalName = renameMap[it.id]?.name || suggested
      if (hasExportedFunction(contents, finalName)) { continue }
      const code = makeFunction(it, finalName)
      contents = contents + code
      const checksum = hashString(code)
      meta.upsert({ id: it.id, file: path.relative(root, serviceFile), exportName: finalName, method: it.method, path: it.path, checksum })
      typeInputs.push({ item: it, exportName: finalName })
      const pas = finalName.replace(/(^|_|-|\s)([a-z])/g, (_m, _p, c) => c.toUpperCase()).replace(/[_-\s]/g, '')
      typeNames.add(`${pas}Params`)
      typeNames.add(`${pas}Response`)
    }
    if (typeNames.size) {
      const importLine = `import type { ${Array.from(typeNames).join(', ')} } from './types'\n\n`
      if (!contents.includes("import type {")) contents = importLine + contents
    }
    fs.writeFileSync(serviceFile, contents, 'utf8')
    const exportLine = `export * from './${g}.service'\n`
    const idx = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : ''
    if (!idx.includes(exportLine)) fs.writeFileSync(indexPath, idx + exportLine, 'utf8')
  }
  if (typeInputs.length) generateTypes(baseDir, sourceName, typeInputs)
}