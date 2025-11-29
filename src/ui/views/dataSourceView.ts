import * as vscode from 'vscode'
import { SettingsManager } from '../../config/settingsManager'

class SourceItem extends vscode.TreeItem {
  constructor(public readonly label: string, public readonly description?: string) {
    super(label)
    this.tooltip = description
  }
}

export class DataSourceView implements vscode.TreeDataProvider<SourceItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<SourceItem | undefined | void> = new vscode.EventEmitter<SourceItem | undefined | void>()
  readonly onDidChangeTreeData: vscode.Event<SourceItem | undefined | void> = this._onDidChangeTreeData.event
  constructor(private settings: SettingsManager) {}
  refresh(): void { this._onDidChangeTreeData.fire() }
  getTreeItem(element: SourceItem): vscode.TreeItem { return element }
  getChildren(element?: SourceItem): Thenable<SourceItem[]> {
    if (element) return Promise.resolve([])
    const cfg = this.settings.getConfig()
    const srcs = (cfg.sources || [])
    const items = srcs.map((s: any) => new SourceItem(s.sourceName || s.type, s.type))
    return Promise.resolve(items)
  }
}

export function registerDataSourceView(settings: SettingsManager): vscode.Disposable {
  const provider = new DataSourceView(settings)
  const view = vscode.window.createTreeView('apiForgeView', { treeDataProvider: provider })
  return view
}