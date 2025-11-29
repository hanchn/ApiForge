import * as fs from 'fs'
import * as path from 'path'

export interface RenameEntry { name: string; alias?: string[]; updatedAt: string }

export class RenameStore {
  private mapPath: string
  constructor(baseDir: string, sourceName: string) {
    this.mapPath = path.join(baseDir, sourceName, '_rename.map.json')
  }
  read(): Record<string, RenameEntry> {
    try {
      if (fs.existsSync(this.mapPath)) return JSON.parse(fs.readFileSync(this.mapPath, 'utf8'))
    } catch {}
    return {}
  }
  write(data: Record<string, RenameEntry>) {
    fs.mkdirSync(path.dirname(this.mapPath), { recursive: true })
    fs.writeFileSync(this.mapPath, JSON.stringify(data, null, 2), 'utf8')
  }
}