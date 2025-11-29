import * as fs from 'fs'
import * as path from 'path'
import { ApiItem } from '../../model/unified'
import { nameFromPathSnake } from '../../naming/namer'

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

function makeFunction(item: ApiItem): string {
  const fn = nameFromPathSnake(item)
  const url = buildUrlFromPath(item.path)
  return `export async function ${fn}(params?: any, body?: any): Promise<any> {\n  const url = \`${url}\`\n  return request<any>('${item.method}', url, body, { })\n}\n\n`
}

export function generateApis(baseDir: string, sourceName: string, items: ApiItem[]) {
  const root = path.join(baseDir, sourceName)
  ensureDir(root)
  const indexPath = path.join(root, 'index.ts')
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
    for (const it of list) {
      const fn = nameFromPathSnake(it)
      if (hasExportedFunction(contents, fn)) continue
      const code = makeFunction(it)
      contents = contents + code
    }
    fs.writeFileSync(serviceFile, contents, 'utf8')
    const exportLine = `export * from './${g}.service'\n`
    const idx = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : ''
    if (!idx.includes(exportLine)) fs.writeFileSync(indexPath, idx + exportLine, 'utf8')
  }
}