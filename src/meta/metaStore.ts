import * as fs from 'fs'
import * as path from 'path'

export interface MetaEntry { id: string; file: string; exportName: string; method: string; path: string; typeNames?: string[]; checksum?: string }

export class MetaStore {
  private metaPath: string
  constructor(baseDir: string, sourceName: string) { this.metaPath = path.join(baseDir, sourceName, '_apiForge.meta.json') }
  read(): MetaEntry[] {
    try {
      if (fs.existsSync(this.metaPath)) return JSON.parse(fs.readFileSync(this.metaPath, 'utf8'))
    } catch {}
    return []
  }
  write(entries: MetaEntry[]) {
    fs.mkdirSync(path.dirname(this.metaPath), { recursive: true })
    fs.writeFileSync(this.metaPath, JSON.stringify(entries, null, 2), 'utf8')
  }
  upsert(entry: MetaEntry) {
    const all = this.read()
    const i = all.findIndex(e => e.id === entry.id)
    if (i >= 0) all[i] = entry
    else all.push(entry)
    this.write(all)
  }
}