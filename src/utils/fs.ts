import * as fs from 'fs'
import * as path from 'path'

export function findOrCreateApisDir(workspaceRoot: string): string {
  const target = path.join(workspaceRoot, 'Apis')
  if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true })
  return target
}