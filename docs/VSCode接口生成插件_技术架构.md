# VSCode 接口代码生成插件 技术架构文档

## 一、架构总览
- 目标：以模块化、可插拔的方式在 VSCode 中完成接口拉取、筛选与前端代码生成，支持 AST 增量合并与运行时注入/回退。
- 原则：职责单一、依赖清晰、稳定标识驱动（`id`/`method+path`/命名策略）、默认安全与可观测。

## 二、目录结构（建议）
```
src/
  extension.ts                 # 入口：注册命令/视图/输出通道
  config/
    settingsManager.ts         # 读取与合并 VSCode Settings + workspace 配置
    workspaceConfig.ts         # 解析 apiForge.config.json
  secrets/
    secretService.ts           # VSCode SecretStorage 封装
  sources/
    openapiFetcher.ts          # 拉取+解析 OpenAPI → 统一模型
    yapiFetcher.ts             # 拉取+解析 YApi → 统一模型
    customFetcher.ts           # 自定义源适配接口与默认实现
    cacheStore.ts              # 文档缓存/ETag/快照
  model/
    unified.ts                 # 统一接口模型类型定义
  naming/
    namer.ts                   # 命名算法（resourceVerbCamel / pathSnake）
    renameStore.ts             # _rename.map.json 读写与校验
  meta/
    metaStore.ts               # _apiForge.meta.json 读写与校验
  generation/
    ast/
      generator.ts            # 生成协调：types、service、index
      astUtils.ts             # AST 解析/变更工具（TypeScript/ESTree）
      diff.ts                 # 生成段与现有代码的差异计算
    output/
      fileStructure.ts        # 目录与文件组织策略（byTag/byPathPrefix/flat）
      indexWriter.ts          # 统一导出维护（index.ts）
    runtime/
      clientAdapter.ts        # 运行时接口定义（get/post/put/patch/delete）
      clientProvider.ts       # setClient/getClient 注入点
      fetchAdapter.ts         # 默认 fetch 适配器（baseURL/headers/timeout）
  ui/
    views/dataSourceView.ts   # 侧边栏树视图（数据源/接口树）
    webviews/sourceForm.ts    # 数据源配置表单（OpenAPI/YApi/Custom）
    commands/
      generateOne.ts          # 单个生成
      generateBatch.ts        # 批量生成
      syncUpdate.ts           # 同步增量更新
      configureSources.ts     # 打开配置表单
      renameMethod.ts         # 重命名交互逻辑
      testSource.ts           # 测试连接与解析
      refreshCache.ts         # 刷新缓存与 ETag
  logging/
    logger.ts                 # 输出通道封装与分级日志
  utils/
    http.ts                   # 拉取 HTTP 辅助（带拦截/重试/速率限制）
    path.ts                   # 路径/段解析工具
    checksum.ts               # 生成段校验和计算
    validation.ts             # 配置/模型校验
tests/
  unit/                        # 命名、AST 合并、元数据、配置解析单测
  integration/                 # 数据源到生成产物的端到端测试
assets/
  icons/                       # 视图图标
docs/
  VSCode接口生成插件_需求文档.md
  VSCode接口生成插件_技术架构.md
```

## 三、职责边界（按文件）
- `extension.ts`：只负责激活/销毁生命周期、命令注册、视图注册、输出通道创建与依赖注入；不含业务逻辑。
- `config/settingsManager.ts`：合并 Settings 与工作区配置；提供只读的配置快照；暴露订阅更新事件。
- `config/workspaceConfig.ts`：读取 `apiForge.config.json`；执行 JSON Schema 校验；错误上报到输出通道。
- `secrets/secretService.ts`：统一读写 SecretStorage；提供 `${secret:key}` 的解析；不向日志输出明文。
- `sources/*Fetcher.ts`：各自实现数据拉取与解析到统一模型，禁止携带生成逻辑；支持缓存与测试连接；错误分类（网络/鉴权/解析）。
- `sources/cacheStore.ts`：ETag 管理、快照持久化；拉取失败时提供最近可用快照。
- `model/unified.ts`：统一模型类型（接口 id/name/method/path/tags/reqSchema/resSchema）。
- `naming/namer.ts`：仅包含命名算法；输入统一模型+配置，输出函数名/类型名/文件名建议；无 IO。
- `naming/renameStore.ts`：管理 `_rename.map.json`；提供根据 `id` 查询最终导出名与别名的能力。
- `meta/metaStore.ts`：管理 `_apiForge.meta.json`；维护 `{ id, file, exportName, method, path, typeNames, checksum }[]`；用于增量识别。
- `generation/ast/generator.ts`：编排生成流程；调用 `astUtils` 操作既有文件；写入产物与更新 `meta/rename`；不直接处理 UI。
- `generation/ast/astUtils.ts`：封装 AST 解析/定位/插入/更新；提供“生成块”标记，以保留手写逻辑；不输出日志，仅返回结果。
- `generation/ast/diff.ts`：对比生成段与现有段，产出用于预览的差异信息。
- `generation/output/fileStructure.ts`：决定输出目录与文件路径；确保 `byTag/byPathPrefix/flat` 一致性。
- `generation/output/indexWriter.ts`：维护 `index.ts` 导出；处理重名与别名导出。
- `generation/runtime/*`：定义与提供运行时适配器；仅包含运行时相关实现与注入点；不参与业务命名与生成策略。
- `ui/views/dataSourceView.ts`：组织数据源与接口树的展示/筛选状态；触发生成命令。
- `ui/webviews/sourceForm.ts`：配置管理表单；字段校验、测试连接、保存。
- `ui/commands/*`：每个命令单一职责；通过服务层协作，不直接做 AST 操作。
- `logging/logger.ts`：统一日志；支持 info/debug/warn/error 等级；面向输出通道。
- `utils/*`：通用工具；不依赖业务模块。

## 四、数据流（端到端）
1. 用户通过视图或命令选择数据源与筛选条件。
2. `settingsManager` 合并配置 → `secretService` 解析密钥引用。
3. 对应 `*Fetcher` 拉取并解析 → 统一模型（含 id/method/path/...）。
4. `namer` 依据配置生成命名建议（`resourceVerbCamel` 或 `pathSnake`）；`renameStore` 覆盖最终导出名。
5. `fileStructure` 计算输出目标路径；`metaStore` 查找既有映射。
6. `generator` 生成 types/service/index 目标段 → `astUtils` 增量合并 → `diff` 提供预览。
7. 成功后更新 `metaStore` 与 `renameStore`（如有改名），`indexWriter` 维护导出，`logger` 记录摘要。

## 五、关键接口与类型（摘要）
```
// 统一模型
interface ApiItem {
  id: string
  name: string
  method: 'GET'|'POST'|'PUT'|'PATCH'|'DELETE'
  path: string
  summary?: string
  description?: string
  tags?: string[]
  reqSchema?: any
  resSchema?: any
}

// 命名引擎输入输出
interface NamingOptions { scheme: 'resourceVerbCamel'|'pathSnake'; removePrefixes?: string[] }
interface NamingResult { functionName: string; typeNames: { params?: string; response?: string } }

// 运行时适配器
interface ClientAdapter {
  get<T>(url: string, options?: RequestOptions): Promise<T>
  post<T>(url: string, body?: any, options?: RequestOptions): Promise<T>
  put<T>(url: string, body?: any, options?: RequestOptions): Promise<T>
  patch<T>(url: string, body?: any, options?: RequestOptions): Promise<T>
  delete<T>(url: string, options?: RequestOptions): Promise<T>
}

// 元数据项
interface MetaEntry {
  id: string
  file: string
  exportName: string
  method: string
  path: string
  typeNames?: string[]
  checksum?: string
}
```

## 六、增量生成与冲突处理
- 识别优先级：`id` → `method+path` → 命名推断；命中后仅更新生成段与类型定义，保留手写逻辑。
- 生成块：对生成的函数与类型使用 AST 层面的“生成节点”标记，不写入代码注释；通过 `checksum` 检测漂移，异常时仅输出补丁建议。
- 重名处理：自动追加序号后缀并在 `index.ts` 保留稳定映射；记录到 `metaStore`。
- 删除处理：支持配置为移除/标记废弃/仅更新元数据。

## 七、命名与重命名
- 命名方案：
  - `resourceVerbCamel`：动词映射 + 资源名 + `By<Param>`。
  - `pathSnake`：基于路径生成 `<verb>_<segments>[_by_<params>]`。
- 重命名映射：`_rename.map.json` 根据 `id` 固定导出名；支持别名导出与过期标记；命令 `renameMethod.ts` 更新映射与 AST。

## 八、运行时适配层
- `clientAdapter.ts` 定义请求接口；`clientProvider.ts` 提供 `setClient/getClient` 注入点。
- 默认回退：未注入时使用 `fetchAdapter.ts`；支持 baseURL/headers/timeout 与错误包装；受 `apiForge.runtime.fallback` 控制。
- 生成的方法体统一委派 `client()`，实现外部注入优先、默认回退可用的策略。

## 九、UI 层
- 侧边栏树视图：数据源/接口树；勾选与搜索；状态展示（新增/变更/一致）。
- Webview 表单：类型选择、字段输入、SecretStorage 写入、测试连接、保存。
- 预览与生成：调用 `diff` 展示差异；应用后提示摘要与耗时。

## 十、日志与错误处理
- `logger.ts`：输出通道分级日志；关键路径记录（拉取/解析/生成/合并）。
- 错误分类：配置错误/网络错误/鉴权错误/解析错误/生成冲突；统一错误对象与用户提示。

## 十一、性能与缓存
- ETag 与快照：优先使用未过期快照；支持失败降级。
- 并发与速率：拉取与解析并发控制；大文档分片解析；必要时后台预热缓存。
- AST 性能：仅解析受影响文件；生成段最小化覆盖与合并。

## 十二、安全
- SecretStorage：密钥只存 SecretStorage；配置引用 `${secret:key}`；日志脱敏。
- HTTPS 优先；错误报告不含敏感信息。

## 十三、测试与验证
- 单测：命名算法、元数据识别、AST 合并、`clientAdapter` 回退策略、配置解析。
- 端到端：模拟 OpenAPI/YApi → 生成产物 → 增量更新 → 运行时调用；比对导出与类型完整性。
- UI 回归：命令与表单交互；视图树状态同步。

## 十四、扩展与插件点
- 数据源插件：新增 `*Fetcher` 实现与注册即可扩展。
- 运行时模板：可新增适配器（如 `umi-request`）并在配置选择。
- 钩子：生成前/后钩子（如统一错误包装与类型校正）。