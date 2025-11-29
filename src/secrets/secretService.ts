import * as vscode from 'vscode'

export class SecretService {
  private storage: vscode.SecretStorage
  constructor(storage: vscode.SecretStorage) { this.storage = storage }
  async get(key: string): Promise<string | undefined> { return await this.storage.get(key) }
  async set(key: string, value: string) { await this.storage.store(key, value) }
  async delete(key: string) { await this.storage.delete(key) }
  async resolveValue(value: string | undefined): Promise<string | undefined> {
    if (!value) return value
    const m = value.match(/^\$\{secret:(.+)\}$/)
    if (m) return await this.get(m[1])
    return value
  }
}