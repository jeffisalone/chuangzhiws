# 创智工坊前端开发文档

这是创智工坊项目的前端仓库，使用 Vue 3 + Vite。后端在另一个仓库中，路径和接口信息见下方。

## 项目位置

- 前端本地路径：`D:\项目\chuangzhiws\frontend`
- 后端本地路径：`D:\项目\chanfana-openapi-template\chanfana-openapi-template`
- 前端线上地址：`https://cz.0rz.my/`
- 后端线上地址：`https://d1.0rz.my`
- 前端 Git remote：`https://github.com/jeffisalone/chuangzhiws.git`
- 后端 Git remote：`https://github.com/jeffisalone/chanfana-openapi-template`
- 当前分支：`main`

## 技术栈

- Vue 3
- Vite
- TypeScript
- Web Crypto API
- OGL，用于视觉组件

## 关键文件

- `src/services/auth.ts`：登录/注册 API、RSA/AES 加密、公钥获取与重试逻辑
- `src/services/ai.ts`：大明白 AI 流式请求，调用后端 `/ai/chat`
- `src/components/DamingbaiWorkbench.vue`：大明白聊天工作台页面
- `src/components/LoginRegister.vue`：登录/注册表单
- `src/App.vue`：页面入口和登录/注册视图切换
- `src/main.ts`：Vue 应用入口
- `src/components/DarkVeil.vue`：登录页背景视觉
- `vite.config.ts`：Vite 配置

## 本地开发

```powershell
cd D:\项目\chuangzhiws\frontend
npm install
npm run dev
```

生产构建：

```powershell
npm run build
```

类型检查：

```powershell
npm run type-check
```

## 后端 API 地址

前端默认请求：

```ts
https://d1.0rz.my
```

配置位置：`src/services/auth.ts`

```ts
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'https://d1.0rz.my').replace(
  /\/+$/,
  '',
)
```

如果需要本地后端，设置：

```powershell
$env:VITE_API_BASE_URL='http://127.0.0.1:8787'
npm run dev
```

## 大明白 AI 工作台

入口：

- 右上角用户名下拉框中的“大明白”
- Dashboard 快捷入口中的“大明白”
- 首页资源区“大明白”卡片

进入页面前会调用 `GET /auth/session` 验证登录状态，未登录或 session 失效会回到登录页。聊天请求由 `src/services/ai.ts` 发到后端：

```http
POST https://d1.0rz.my/ai/chat
```

请求使用 `credentials: 'include'` 携带 HTTP-only session cookie。前端只处理后端返回的 NDJSON 流式 chunk，不保存或暴露 SiliconFlow 密钥。

## Auth 调用流程

前端不会直接发送明文密码和注册信息。流程如下：

1. 请求 `GET /auth/public-key` 获取 RSA 公钥。
2. 生成 AES-GCM 256-bit key。
3. 用 AES-GCM 加密登录/注册 payload。
4. 用 RSA-OAEP SHA-256 加密 AES key。
5. 发送 `{ encryptedKey, iv, ciphertext }` 到后端。
6. 请求使用 `credentials: 'include'`，后端通过 HTTP-only `session` cookie 登录。

相关代码：`src/services/auth.ts`

## Auth API

### 注册

调用函数：

```ts
registerUser({
  accountName: string,
  studentId: string,
  realName: string,
  password: string,
})
```

最终请求：

```http
POST https://d1.0rz.my/auth/register
```

成功响应：`201 Created`

### 登录

调用函数：

```ts
login({
  accountName: string,
  password: string,
  rememberMe: boolean,
})
```

最终请求：

```http
POST https://d1.0rz.my/auth/login
```

成功响应：`200 OK`

## 公钥缓存和 400 处理

历史问题：部署后或 Worker 实例切换后，前端可能缓存旧 RSA 公钥，导致后端返回：

```text
400 INVALID_AUTH_PAYLOAD
```

当前修复：

- `GET /auth/public-key` 使用 `cache: 'no-store'`。
- 如果登录/注册返回 `400` 且错误码为 `INVALID_AUTH_PAYLOAD`，前端会清掉内存中的 `publicKeyPromise` 并自动重试一次。

不要删除这段逻辑，否则部署后用户可能需要手动刷新页面才能注册/登录。

## 表单校验规则

注册时：

- `studentId` 必须是 11 位数字。
- `password` 至少 8 位。
- `password` 必须同时包含大写字母、小写字母和数字。
- `confirmPassword` 必须和 `password` 一致。

后端也会再次校验，前端校验只是用户体验层。

## 部署

通常通过 Git push 触发部署：

```powershell
git add -- <files>
git commit -m "message"
git push origin main
```

推送后等待约 30 到 60 秒，再检查线上地址：

```powershell
curl.exe -s https://cz.0rz.my/
```

检查线上是否已使用新 JS：

```powershell
curl.exe -s https://cz.0rz.my/ | Select-String -Pattern "index-[A-Za-z0-9_-]+\.js" -AllMatches
```

如果要确认 auth 修复是否已上线，下载当前 JS asset 后查找：

```powershell
curl.exe -s https://cz.0rz.my/assets/<asset>.js | Select-String -Pattern "INVALID_AUTH_PAYLOAD|no-store"
```

## 与后端联调

后端仓库：

```powershell
cd D:\项目\chanfana-openapi-template\chanfana-openapi-template
```

后端关键命令：

```powershell
npx wrangler deploy --dry-run
git push origin main
```

后端注册成功的线上验证结果应为：

- `POST https://d1.0rz.my/auth/register` 返回 `201`
- 响应 header 有 `Set-Cookie`
- 响应 body 中 `success: true`

后端登录成功的线上验证结果应为：

- `POST https://d1.0rz.my/auth/login` 返回 `200`
- 响应 header 有 `Set-Cookie`
- 响应 body 中 `success: true`

## 常见问题

### 注册返回 400

优先判断是不是旧公钥：

- 刷新页面。
- 确认线上 JS 包含 `INVALID_AUTH_PAYLOAD` 和 `no-store`。
- 确认后端 `/auth/public-key` 正常返回。

### 注册返回 500

通常是后端问题。历史真实原因：

- Cloudflare Workers 的 PBKDF2 不支持超过 `100000` 次迭代。
- D1 远端没有 `users` / `sessions` 表。
- 后端密钥不稳定导致解密失败，但解密失败通常表现为 400。

后端 README 有完整排障脚本。

### 页面仍加载旧代码

浏览器可能缓存旧 asset。强刷页面，或直接检查线上 HTML 中引用的 JS hash。

## Agent 接手建议

- 修改前先运行 `git status --short`。
- 不要回滚用户已有改动。
- 搜索用 `rg` / `rg --files`。
- 前端只负责加密、请求和表单体验；数据库、session、密码哈希都在后端。
- 前后端是两个 Git 仓库，提交和 push 要分别执行。
- 推送后等待 30 到 60 秒，再验证线上地址。
