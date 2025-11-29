# VSCode 接口代码生成插件 需求文档

## 一、背景与目标

- 目标：在 VSCode 内，通过配置 Swagger/OpenAPI、YApi 或自定义服务地址，基于筛选条件一键生成前端接口代码；能识别本地既有代码并增量更新（基于 AST/ESTree），避免重复与覆盖手改逻辑。
- 预期收益：统一接口调用风格、提升联调效率、降低重复劳动与回归风险。

## 二、适用场景与用户

- 使用者：前端开发工程师（TypeScript/JavaScript），团队内有多后端服务或多个接口平台。
- 场景：
  - 新项目初始化批量生成服务层；
  - 老项目新增或变更接口的增量更新；
  - 多仓库/多平台（Swagger、YApi）混合管理。

## 三、范围与非目标

- 范围：接口声明、类型定义、请求函数、错误处理框架对接、导出索引、自动化增量合并。
- 非目标：
  - 生成后端服务或 Mock 服务本身；
  - 生成 UI 组件；
  - 跨语言（仅限 TS/JS）。

## 四、数据源支持

- Swagger/OpenAPI：
  - 输入：`url`（JSON/ YAML）、`headers`、`auth`（可选）、`sourceName`。
  - 识别键：`operationId` 优先；无则以 `method + path` 计算稳定哈希。
- YApi：
  - 输入：`url`（项目 API 列表）、`token`、`projectId`、`sourceName`。
  - 识别键：`id`（YApi 接口唯一 ID）为主，兼容 `method + path`。
- 自定义：
  - 输入：`url` 或本地文件路径；自定义解析器返回统一的规范结构（见“统一接口模型”）。

### 统一接口模型（生成器消费）

```
{
  id: string,              // 稳定唯一标识（operationId / yapi id / hash）
  name: string,            // 建议函数名（可配置命名策略）
  method: 'GET'|'POST'|...,
  path: string,            // /user/{id}
  summary?: string,
  description?: string,
  tags?: string[],
  reqSchema?: OpenAPISchema,
  resSchema?: OpenAPISchema,
}
```

## 五、配置项（VSCode Settings & 工作区配置）

- VSCode Settings（`settings.json`）：
  - `apiForge.sources`: 数组，支持多数据源
    - `{ type: 'openapi'|'yapi'|'custom', sourceName: string, url: string, headers?: Record<string,string>, token?: string, projectId?: string }`
  - `apiForge.output.baseDir`: 代码输出根目录（默认 `src/services`）。
  - `apiForge.output.structure`: 文件组织策略（`byTag` | `byPathPrefix` | `flat`）。
  - `apiForge.template.runtime`: `external` | `fetch` | `axios` | `umi-request` | `ky`（默认 `external`）。
  - `apiForge.template.options`: 运行时细项（拦截器、基址、超时等）。
  - `apiForge.naming.style`: `camelCase` | `pascalCase` | `snake_case`。
  - `apiForge.types.emit`: 是否生成 `types.ts`（默认 true）。
  - `apiForge.index.autoExport`: 是否自动维护 `index.ts` 导出（默认 true）。
  - `apiForge.generation.safeRegions`: 是否使用保护区域标记以保留手工代码（默认 true）。
  - `apiForge.filters.default`: 默认筛选条件（标签、路径前缀、method 白/黑名单）。
  - `apiForge.auth.secretStorage`: 是否将敏感信息存入 VSCode SecretStorage（默认 true）。
  - `apiForge.runtime.fallback`: 外部未注入时的默认运行时（`fetch` | `axios` ...，默认 `fetch`）。
  - `apiForge.runtime.clientProviderPath`: 外部客户端适配器的导入路径（可选，默认使用内置 `runtime/clientProvider`）。

- 工作区配置文件（可选 `apiForge.config.json`）：覆盖/补充 Settings，便于仓库共享。

## 六、生成目标与模板

- 产物：
  - `types.ts`: 根据 `reqSchema`/`resSchema` 生成类型（TypeScript）。
  - `*.service.ts`: 每类（tag/模块）生成请求函数集合。
  - `index.ts`: 统一导出，支持按模块聚合。
- 函数签名：
  - `function getUser(params: GetUserParams, options?: RequestOptions): Promise<GetUserResponse>`
  - 位置参数：`path` 参数注入、`query`/`body` 按运行时约定传递。
- 运行时对接：
  - axios：统一 `axiosInstance`，拦截器注入 baseURL/headers；
  - fetch：封装 `request(url, options)`，自动序列化 query/body。

### 运行时注入与默认封装

- 生成的接口方法不直接绑定具体库，统一委派至 `ClientAdapter`：
  - `interface ClientAdapter { get<T>(url: string, options?: RequestOptions): Promise<T>; post<T>(url: string, body?: any, options?: RequestOptions): Promise<T>; put<T>(...); patch<T>(...); delete<T>(...); }`
  - 生成代码示例：`export async function getUserById(params: GetUserParams, options?: RequestOptions) { const url = buildUrl('/users/{id}', params); return client().get<GetUserResponse>(url, withQueryAndBody(params, options)); }`
- 外部注入：
  - 项目可在初始化处调用 `setClient(adapter: ClientAdapter)` 注入自有请求实现（如 axios/umi-request）。
  - 当 `apiForge.template.runtime` 设为 `external` 时，生成代码仅依赖注入的 `client()` 方法，不绑定具体实现。
- 默认回退：
  - 若未注入外部客户端，使用内置 `fetch` 适配器作为默认实现（由 `apiForge.runtime.fallback` 控制，默认 `fetch`）。
  - 内置 `fetch` 适配器支持 baseURL、headers、超时与错误统一包装（可在 `apiForge.template.options` 配置）。
  - 因此，当前生成的 `get/post/delete` 等方法不会为空实现；若外部未提供，将自动走内置 `fetch` 封装。

## 七、增量生成与重复识别（AST/ESTree）

- 识别策略：
  - 优先匹配文件中函数的稳定标识：`@apiForge(id: ...)` 注释标签或 JSDoc tag（可开启/关闭）；
  - 无显式标识时，依据函数名与 `method+path` 哈希比对；
  - 对类型与接口声明同样应用标识。
- 合并算法：
  - 解析现有文件 AST（TypeScript/ESTree），构建符号表；
  - 对比新模型：新增 → 插入；变更 → 更新函数签名/类型；删除（可配置是否移除或标记废弃）；
  - 保护区域（Safe Regions）：保留开发者手写逻辑（region 开闭标记或 JSDoc 指令）。
- 冲突解决：
  - 命名冲突 → 追加后缀或依据命名策略重命名，并在导出层保持稳定映射；
  - 类型变化 → 生成 diff 提示与代码更新；
  - 手动覆盖 → 输出通道提示并生成候选补丁。

## 八、筛选与批量/单个生成流程

- 条件筛选：
  - 按 `tags`、`path` 前缀、`method`、关键字搜索（summary/description）；
  - include/exclude 规则；
  - 仅变更项、仅新增项、忽略废弃项。
- 交互流程：
  - 单个生成：命令面板选择数据源→搜索接口→预览→生成/更新；
  - 批量生成：选择数据源→选择模块/标签→预览变更列表→一键应用；
  - 同步更新：对比本地与远端，列出新增/变更/删除项→一键增量更新。

## 九、文件组织与命名

- 目录结构：
  - `src/services/<sourceName>/`：
    - `types.ts`
    - `<tag>.service.ts`
    - `index.ts`
- 命名规则：
  - 函数名来源：`operationId` 或基于 `summary/path` 规则生成；
  - 类型名：`<Tag><Action>Params/Response`，可配置后缀；
  - 文件名：`kebab-case` 或 `camelCase`（可配置）。

## 十、VSCode 交互与命令

- 命令：
  - `ApiForge: 生成接口（单个）`
  - `ApiForge: 批量生成接口`
  - `ApiForge: 同步更新（增量）`
  - `ApiForge: 配置数据源`
- 视图：
  - 侧边栏 `ApiForge`：数据源列表、标签/模块树、接口项勾选与状态（新增/变更/一致）。
- 体验：
  - 快速选择（QuickPick）、预览 diff、进度展示、错误 toast；
  - 输出通道 `ApiForge` 提供详细日志与调试信息。

## 十一、安全与隐私

- Token/密钥存储在 VSCode SecretStorage；不写入仓库文件；
- 仅通过 HTTPS 拉取；敏感头部在日志中脱敏；
- 生成代码不包含敏感信息（例如 Token 字面量）。

## 十二、性能与稳定性

- 拉取缓存与 ETag；
- 并发请求与速率限制；
- 大型 OpenAPI 文档的分片解析与渐进式渲染；
- 失败重试与降级（仅生成已有缓存）。

## 十三、扩展性与模板机制

- 模板可插拔：通过简单适配接口实现其他运行时（如 `umi-request`）；
- 数据源插件：自定义解析器注册；
- 钩子：生成前/后钩子，用于团队自定义规范（如统一错误包装）。

## 十四、日志与可观测性

- 输出通道分级（info/debug/warn/error）；
- 统计：生成项数量、耗时、增量命中率（不含隐私）；
- 可选生成报告（Markdown/JSON）。

## 十五、验收标准（Acceptance Criteria）

- 配置至少一种数据源并成功拉取接口列表；
- 在 `src/services` 下生成对应文件结构与类型；
- 单个与批量生成均支持预览并应用；
- 增量更新正确识别新增/变更/删除，且保留手写区域；
- 重复识别准确（基于 `operationId`/`yapi id`/哈希），不产生重复函数；
- 运行时模板可选（axios/fetch），生成代码通过编译与基本调用；
- 无敏感信息泄露，日志可读；
- 大型文档（>5k 接口）仍能完成拉取与筛选（有进度反馈）。

## 十六、交付物与里程碑

- M1：数据源拉取与统一模型；
- M2：基础模板与文件生成；
- M3：增量合并（AST）与重复识别；
- M4：VSCode 交互（命令/视图/预览）；
- M5：安全、性能、日志与文档完善。

## 十七、后续规划

- 支持多语言（Flow/JS JSDoc 类型化）；
- 生成单元测试样板；
- 团队级规范校验（ESLint 规则/Commit 机器人）。
  
## 十八、默认命名与重复识别细则

- 默认文件组织：`byTag` 分组；无标签时按第一段路径前缀分组；文件名使用 `kebab-case`（如 `user.service.ts`）。
- 函数命名（`camelCase`）：
  - 动词映射：`GET→get`、`POST→create`、`PUT→update`、`PATCH→patch`、`DELETE→remove`；
  - 资源名：取路径最后一个静态片段（`/users/{id}` → `user`）；
  - 限定词：追加其余静态片段（`/orders/settlement` → `orderSettlement`）；
  - 路径参数：`By` + 参数名（`/users/{id}` → `getUserById`）；
  - 存在 `operationId` 时，优先将其标准化为 `camelCase` 用作函数名；
  - 可选：`summary` 参与命名但不覆盖稳定规则（可配置）。
- 类型命名（`PascalCase`）：`<TagOrResource><Verb>Params/Response`，如 `UserGetParams`、`OrderCreateResponse`。
 - 索引导出：统一在 `index.ts` 导出，重名自动加后缀并记录映射。

### 路径下划线命名建议（snake_case）

- 规则：`<verb>_<segment1>_<segment2>...[_by_<param1>[_and_<param2>...]]`
- 例子：
  - `GET /users/{id}` → `get_users_by_id`
  - `POST /orders/settlement` → `create_orders_settlement`
  - `DELETE /projects/{pid}/members/{uid}` → `remove_projects_members_by_pid_and_uid`
- 细节处理：
  - 分段：按 `/` 分段，静态段中的 `-` 转为 `_`；
  - 过滤：去除空段与冗余前缀（如 `api`、`v1` 可配置）；
  - 规范化：首字符若为数字则前置 `api_`；折叠重复 `_`；
  - 冲突：与现有导出重名时自动追加序号后缀，并在元数据记录映射。

### 重复识别与增量更新

- 元数据文件：默认启用 `_apiForge.meta.json`（路径：`src/services/<sourceName>/_apiForge.meta.json`），不在代码中写注释标记。
- 元数据字段：`id, file, exportName, method, path, typeNames, checksum`。
- 识别优先级：
  - `id` 精确匹配 → 更新既有函数与类型；
  - 无 `id`：`method+path` 稳定哈希匹配；
  - 仍无匹配：依据命名规则推断函数，若命中则更新，否则插入新函数并保留旧实现。
- 同名文件处理：
  - 读取既有导出，构建 AST 符号表；
  - 对应命中项仅更新签名/类型与生成段，不覆盖手写逻辑；
  - 校验失败（`checksum` 不一致）时，仅生成补丁建议并提示冲突。
- 可选增强：
  - `apiForge.generation.useComments: true` 时，在函数上写入 `@apiForge(id)` JSDoc 以提高重命名后的稳定匹配；默认关闭以避免在代码中添加注释。

### 相关配置（补充）

- `apiForge.meta.enabled`：是否启用元数据文件（默认 true）。
- `apiForge.output.structure`：`byTag | byPathPrefix | flat`（默认 `byTag`）。
- `apiForge.naming.style`：`camelCase | pascalCase | snake_case`（默认 `camelCase`）。
 - `apiForge.types.emit`：是否生成类型文件（默认 true）。
 - `apiForge.naming.scheme`：`resourceVerbCamel | pathSnake`（用于决定建议命名的来源，默认 `pathSnake`）。
 - `apiForge.rename.enabled`：是否启用重命名映射（默认 true）。
 - `apiForge.rename.mapPath`：重命名映射文件路径（默认 `src/services/<sourceName>/_rename.map.json`）。
 - `apiForge.rename.aliasDeprecated`：改名后是否保留旧名别名并标记过期（默认 true）。

### 重命名（Rename）机制

- 映射文件：`_rename.map.json`，结构：`{ [id]: { name: string, alias?: string[], updatedAt: string } }`。
- 生效逻辑：存在映射时以 `name` 作为最终导出名；若配置 `alias`，会在 `index.ts` 暂保留旧名别名导出并标记过期。
- VSCode 命令：`ApiForge: 重命名接口方法`。
  - 流程：选择数据源→搜索接口（按 path/summary）→展示当前名称与“路径下划线建议”→输入新名→更新映射→AST 层面重命名并更新导出。
- 冲突：遇到重名提示解决方案（自动后缀或保留旧名为别名），同时更新 `_apiForge.meta.json` 保持 `id` 映射稳定。

## 十九、数据源配置与界面

### 配置模型与示例

- Settings（`settings.json`）示例：
```
{
  "apiForge.sources": [
    {
      "type": "openapi",
      "sourceName": "account",
      "url": "https://api.example.com/openapi.json",
      "headers": { "X-Env": "prod" },
      "specFormat": "json"
    },
    {
      "type": "yapi",
      "sourceName": "yapi-main",
      "url": "https://yapi.example.com/api/interface/list",
      "projectId": "12",
      "token": "${secret:yapi_token_main}"
    }
  ],
  "apiForge.runtime.fallback": "fetch",
  "apiForge.output.baseDir": "src/services",
  "apiForge.output.structure": "byTag",
  "apiForge.naming.scheme": "pathSnake"
}
```

- Token 引用：`"${secret:xxx}"` 表示从 VSCode SecretStorage 读取，插件提供设置命令写入。
- 工作区覆盖：可在仓库根添加 `apiForge.config.json` 覆盖 Settings 中的 `sources` 与生成策略。

### Swagger/OpenAPI 配置字段

- `type`: 固定为 `openapi`
- `sourceName`: 数据源别名（用于目录命名、索引归档）
- `url`: OpenAPI 文档地址（支持 JSON/YAML）
- `headers`: 可选，拉取文档时附加头部（支持变量引用）
- `specFormat`: `json | yaml`（可选，自动识别为默认）
- 可选：`auth`（basic/bearer），以 SecretStorage 保存密钥

### YApi 配置字段

- `type`: 固定为 `yapi`
- `sourceName`: 数据源别名
- `url`: YApi 接口列表地址或项目导出 API（依团队而定）
- `projectId`: 项目标识（用于过滤）
- `token`: 访问令牌（建议使用 SecretStorage）
- 可选：`categoryInclude`/`categoryExclude`（按分类筛选）

### 自定义源

- `type`: `custom`
- `url` 或本地文件路径；需返回“统一接口模型”，可经适配器转换。

### VSCode 界面与操作流

- 侧边栏视图：`ApiForge`
  - 分区一：数据源管理
    - 列表：显示 `sourceName`、类型与状态（已连接/缓存/失败）
    - 操作：新增、编辑、删除、测试连接、刷新缓存
  - 分区二：接口树
    - 节点：按 `tag` 或分类展示；每个接口项显示方法与路径
    - 选择：勾选单个或批量；支持搜索（按 path、summary）
  - 底部工具条：生成、同步更新、导出报告

- 新增/编辑数据源（Webview 表单）
  - Step1：选择类型（Swagger/OpenAPI、YApi、Custom）
  - Step2：填写字段（`url`、`headers`/`token`、`projectId` 等），敏感字段输入框支持“保存到 SecretStorage”
  - Step3：测试连接（拉取并解析，展示接口总数、示例标签、错误信息）
  - Step4：保存（写入 Settings/工作区配置），返回列表并提示成功

- 命令面板
  - `ApiForge: 配置数据源` → 打开 Webview 表单
  - `ApiForge: 测试数据源` → 针对选中源执行拉取与解析；输出通道记录详情
  - `ApiForge: 刷新数据源缓存` → 重新拉取并更新本地缓存与 ETag

### 校验与错误提示

- URL 格式校验、必填校验、token 长度校验；
- 连接失败反馈：网络错误/鉴权失败/格式错误（JSON/YAML 解析异常）；
- 解析摘要：接口总数、重复率、可生成模块数；
- 输出通道分级日志并提供“复制诊断信息”。

### 安全与密钥管理

- Token/密钥永不写入仓库；使用 SecretStorage 存储；
- 表单提供“写入 SecretStorage”按钮；引用形式为 `"${secret:key}"`；
- 支持清除与轮换；日志中对敏感值脱敏。