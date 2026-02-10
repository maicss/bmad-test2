# TECH_SPEC_BUN.md

> Bun 运行时使用规范 - API详解、最佳实践、性能优化
>
> **AI 代理**：快速决策参考请查看 [AGENTS.md](../AGENTS.md)

---

## 概述

Bun 是一个快速的 JavaScript 运行时、包管理器、测试运行器和打包器。本项目使用 Bun 作为主要运行时，所有代码开发必须遵循 Bun 的最佳实践。

### Bun 的核心优势

| 特性 | 优势 | 性能对比 |
|------|------|----------|
| **启动速度** | 比快 20x+ | 40ms vs 900ms |
| **I/O 操作** | 原生支持，无桥接开销 | 2-3x 更快 |
| **TypeScript** | 原生支持，无需编译 | 0ms 编译时间 |
| **包管理** | 比 npm/pnpm 快 10x+ | 秒级安装 |

---

## 🔴 RED LIST（绝对禁止）

- ❌ **重复实现 Bun 已提供的工具函数** - 严禁！必须优先使用 Bun 内置工具
- ❌ **手动实现文件操作** - 必须用 `Bun.file()`, `Bun.write()`
- ❌ **手动实现密码哈希** - 必须用 `Bun.password.hash()`, `Bun.password.verify()`
- ❌ **手动实现 UUID** - 必须用 `Bun.randomUUIDv7()`
- ❌ **使用第三方 UUID 库** - 如 `uuid`, `nanoid`, `nanoid`
- ❌ **手动实现 HTTP 服务器** - 必须用 `Bun.serve()`
- ❌ **手动实现环境变量读取** - 必须用 `Bun.env`
- ❌ **手动实现路径拼接** - 必须用 `import.meta.dir`, `import.meta.resolve()`
- ❌ **使用 Node.js 兼容层** - 如 `node-fetch`, `node-crypto`, `fs/promises`

---

## 核心 API 详解

### 1. 文件操作

#### Bun.file()

```typescript
import { Bun } from 'bun';

// ✅ 正确 - 读取文件（推荐）
const file = Bun.file('./data.txt');
const text = await file.text();           // 读取为文本
const json = await file.json();           // 解析为 JSON
const arrayBuffer = await file.arrayBuffer(); // 读取为 ArrayBuffer
const blob = await file.blob();           // 读取为 Blob

// 文件属性
console.log(file.size);      // 文件大小（字节）
console.log(file.type);      // MIME 类型
console.log(file.lastModified); // 最后修改时间

// ✅ 正确 - 流式读取（大文件）
const stream = file.stream();
const reader = stream.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  // 处理 chunk
}
```

```typescript
// ❌ 禁止 - 使用 Node.js fs
import { readFile } from 'fs/promises';
const content = await readFile('./data.txt', 'utf-8');

// ❌ 禁止 - 使用第三方库
import fs from 'fs-extra';
const content = await fs.readFile('./data.txt', 'utf-8');
```

#### Bun.write()

```typescript
import { Bun } from 'bun';

// ✅ 正确 - 写入文件
await Bun.write('./output.txt', 'Hello, Bun!');

// ✅ 正确 - 写入 JSON（自动格式化）
const data = { name: 'Bun', version: '1.0' };
await Bun.write('./data.json', JSON.stringify(data, null, 2));

// ✅ 正确 - 写入 Blob
const blob = new Blob(['Hello'], { type: 'text/plain' });
await Bun.write('./blob.txt', blob);

// ✅ 正确 - 写入 ArrayBuffer
const buffer = new TextEncoder().encode('Hello');
await Bun.write('./buffer.txt', buffer);

// ✅ 正确 - 追加写入
await Bun.write('./log.txt', 'New entry\n', { createPathIfNotExist: true });
```

```typescript
// ❌ 禁止 - 使用 Node.js fs
import { writeFile } from 'fs/promises';
await writeFile('./output.txt', 'Hello', 'utf-8');

// ❌ 禁止 - 使用第三方库
import fs from 'fs-extra';
await fs.writeFile('./output.txt', 'Hello');
```

#### Bun.glob()

```typescript
import { Bun } from 'bun';

// ✅ 正确 - 查找文件
const tsFiles = await Bun.glob('**/*.ts');          // 递归查找所有 .ts 文件
const cssFiles = await Bun.glob('src/**/*.css');    // 在 src 目录查找 .css 文件
const images = await Bun.glob('public/*.{png,jpg}'); // 查找图片文件

// ✅ 正确 - 使用绝对路径
const files = await Bun.glob(import.meta.dir + '/**/*.md');

// ✅ 正确 - 使用选项
const files = await Bun.glob('**/*.ts', {
  absolute: true,      // 返回绝对路径
  cwd: './src',        // 工作目录
});
```

---

### 2. 密码哈希

#### Bun.password.hash()

```typescript
import { Bun } from 'bun';

// ✅ 正确 - 使用 bcrypt
const password = 'user-password';
const hash = await Bun.password.hash(password, 'bcrypt');

// ✅ 正确 - 指定成本因子
const hash = await Bun.password.hash(password, {
  algorithm: 'bcrypt',
  cost: 10,
});

// ✅ 正确 - 使用 argon2（更安全但更慢）
const hash = await Bun.password.hash(password, {
  algorithm: 'argon2id',
  memorySize: 64,
});
```

#### Bun.password.verify()

```typescript
import { Bun } from 'bun';

// ✅ 正确 - 验证密码
const isValid = await Bun.password.verify('user-password', storedHash);
if (isValid) {
  console.log('密码正确');
} else {
  console.log('密码错误');
}

// ✅ 正确 - 处理不同算法
// Bun 会自动检测哈希算法
const isValid = await Bun.password.verify(password, hash); // 支持所有算法
```

```typescript
// ❌ 禁止 - 使用第三方 bcrypt
import bcrypt from 'bcrypt';
const hash = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, hash);

// ❌ 禁止 - 使用 node-crypto
import crypto from 'crypto';
const hash = crypto.createHash('sha256').update(password).digest('hex');
```

---

### 3. HTTP 服务器

#### Bun.serve()

```typescript
import { Bun } from 'bun';

// ✅ 正确 - 创建 HTTP 服务器
Bun.serve({
  port: 3000,
  async fetch(req) {
    return new Response('Hello, Bun!');
  },
});

// ✅ 正确 - 带路由的 HTTP 服务器
Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/api/tasks') {
      return Response.json({ tasks: [] });
    }

    return new Response('Not Found', { status: 404 });
  },
});

// ✅ 正确 - 带中间件的 HTTP 服务器
Bun.serve({
  port: 3000,
  async fetch(req, server) {
    // 中间件：记录日志
    console.log(`${req.method} ${req.url}`);

    // 中间件：CORS
    const response = await handler(req);

    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  },
});

// ✅ 正确 - WebSocket 支持
Bun.serve({
  port: 3000,
  websocket: {
    message(ws, message) {
      ws.send(`Echo: ${message}`);
    },
  },
  fetch(req, server) {
    const upgrade = req.headers.get('Upgrade');
    if (upgrade === 'websocket') {
      return server.upgrade(req);
    }
    return new Response('Expected WebSocket', { status: 426 });
  },
});
```

```typescript
// ❌ 禁止 - 使用 Node.js http
import http from 'http';
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Hello');
});
server.listen(3000);

// ❌ 禁止 - 使用 Express
import express from 'express';
const app = express();
app.get('/', (req, res) => res.send('Hello'));
app.listen(3000);
```

---

### 4. 环境变量

#### Bun.env

```typescript
import { Bun } from 'bun';

// ✅ 正确 - 读取环境变量
const dbUrl = Bun.env.DATABASE_URL;
const apiKey = Bun.env.API_KEY;
const port = Number(Bun.env.PORT || 3000);

// ✅ 正确 - 类型守卫
function getRequiredEnv(key: string): string {
  const value = Bun.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const dbUrl = getRequiredEnv('DATABASE_URL');

// ✅ 正确 - 默认值
const port = Bun.env.PORT ?? '3000';
```

```typescript
// ❌ 禁止 - 使用 process.env
const dbUrl = process.env.DATABASE_URL;

// ❌ 禁止 - 使用第三方库
import { config } from 'dotenv';
config();
```

---

### 5. 路径操作

#### import.meta.dir 和 import.meta.resolve()

```typescript
// ✅ 正确 - 获取当前文件所在目录
const currentDir = import.meta.dir;

// ✅ 正确 - 解析模块路径
const modulePath = import.meta.resolve('@/lib/utils');

// ✅ 正确 - 读取同目录下的文件
const dataPath = `${import.meta.dir}/data.json`;
const data = await Bun.file(dataPath).json();

// ✅ 正确 - 构建绝对路径
const projectRoot = import.meta.dir;
const configPath = `${projectRoot}/config.json`;
```

```typescript
// ❌ 禁止 - 使用 __dirname（Node.js）
const path = `${__dirname}/data.json`;

// ❌ 禁止 - 使用 path.join
import path from 'path';
const configPath = path.join(__dirname, '../config.json');
```

---

### 6. 其他实用工具

#### Bun.spawn()

```typescript
import { Bun } from 'bun';

// ✅ 正确 - 运行命令
const proc = Bun.spawn(['git', 'status']);
const stdout = await new Response(proc.stdout).text();

// ✅ 正确 - 带环境变量
const proc = Bun.spawn(['node', 'script.js'], {
  env: { NODE_ENV: 'production' },
  cwd: '/path/to/dir',
});

// ✅ 正确 - 检查退出码
const proc = Bun.spawn(['npm', 'install']);
await proc.exited;
if (proc.exitCode !== 0) {
  console.error('Command failed');
}
```

#### Bun.gzip() 和 Bun.unzip()

```typescript
import { Bun } from 'bun';

// ✅ 正确 - 压缩数据
const data = 'Hello, Bun!';
const compressed = Bun.gzip(data);

// ✅ 正确 - 解压数据
const decompressed = Bun.unzip(compressed);
```

#### Bun.randomUUIDv7()

```typescript
import { Bun } from 'bun';

// ✅ 正确 - 生成 UUID v7（推荐）
const id = Bun.randomUUIDv7();
// 输出示例: '018f0312-544b-71c7-8101-a6d5b507746'

// ✅ 正确 - 生成多个 ID
const id1 = Bun.randomUUIDv7();
const id2 = Bun.randomUUIDv7();
const id3 = Bun.randomUUIDv7();

// ✅ 正确 - 用于数据库 ID
const taskId = `task_${Bun.randomUUIDv7()}`;
const userId = `user_${Bun.randomUUIDv7()}`;

// ✅ 正确 - 确保唯一性
function generateUniqueKey(prefix: string): string {
  return `${prefix}_${Bun.randomUUIDv7()}`;
}

const taskId = generateUniqueKey('task');
const logId = generateUniqueKey('log');
```

```typescript
// ❌ 禁止 - 使用第三方 uuid 库
import { v7 as uuidv7 } from 'uuid';
const id = uuidv7();

// ❌ 禁止 - 使用第三方 nanoid 库
import { nanoid } from 'nanoid';
const id = nanoid();

// ❌ 禁止 - 手动实现 UUID
function generateUUID(): string {
  const hex = [...Array(32)].map(() =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
```

**为什么使用 UUID v7？**

| 特性 | UUID v7 | UUID v4 | 说明 |
|------|----------|----------|------|
| **时间排序** | ✅ 支持 | ❌ 不支持 | v7 按时间排序，索引更高效 |
| **随机性** | ✅ 高 | ✅ 高 | 防止 ID 猜测 |
| **格式标准** | RFC 4122 | RFC 4122 | 符合标准 |
| **性能** | 高 | 高 | Bun 原生实现，极快 |

**实际应用场景：**

```typescript
// 场景 1: 数据库主键
export async function createTask(data: CreateTaskDto) {
  const task = await db.insert(tasks).values({
    id: Bun.randomUUIDv7(),  // 使用 UUID v7
    ...data,
    createdAt: new Date(),
  }).returning();

  return task;
}

// 场景 2: 日志追踪
export async function logApiRequest(req: NextRequest) {
  await db.insert(logs).values({
    id: Bun.randomUUIDv7(),
    timestamp: new Date(),
    method: req.method,
    path: req.nextUrl.pathname,
  });
}

// 场景 3: 临时文件名
export async function createTempFile(content: string) {
  const filename = `temp_${Bun.randomUUIDv7()}.txt`;
  await Bun.write(`./tmp/${filename}`, content);
  return filename;
}

// 场景 4: 会话 ID
export async function createSession(userId: string) {
  const sessionId = Bun.randomUUIDv7();
  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  return sessionId;
}
```

---

## 与 Node.js 的迁移对比

### 文件操作

| Node.js | Bun | 说明 |
|---------|-----|------|
| `fs.readFile()` | `Bun.file().text()` | Bun 原生支持，无桥接 |
| `fs.writeFile()` | `Bun.write()` | Bun 更快，无回调 |
| `fs.stat()` | `file.size`, `file.lastModified` | 直接属性访问 |
| `fs.readdir()` | `Bun.glob()` | 支持通配符，更强大 |

### 加密

| Node.js | Bun | 说明 |
|---------|-----|------|
| `bcrypt.hash()` | `Bun.password.hash()` | Bun 原生实现 |
| `bcrypt.compare()` | `Bun.password.verify()` | 自动检测算法 |
| `crypto.createHash()` | `Bun.password.hash()` | 使用 Web Crypto API |

### HTTP

| Node.js | Bun | 说明 |
|---------|-----|------|
| `http.createServer()` | `Bun.serve()` | Bun 基于 Web 标准 |
| `express()` | `Bun.serve()` | 手动路由更轻量 |
| `ws` | 内置支持 | 无需第三方库 |

### 环境变量

| Node.js | Bun | 说明 |
|---------|-----|------|
| `process.env` | `Bun.env` | 性能相同 |
| `dotenv` | 无需加载 | Bun 自动加载 .env |

### UUID 生成

| Node.js | Bun | 说明 |
|---------|-----|------|
| `uuid.v4()` | `Bun.randomUUIDv7()` | Bun 支持 v7（时间排序） |
| `uuid.v7()` | `Bun.randomUUIDv7()` | Bun 原生实现 |
| `nanoid()` | `Bun.randomUUIDv7()` | Bun 更快，符合标准 |
| `crypto.randomUUID()` | `Bun.randomUUIDv7()` | Bun 使用 v7（更优） |

---

## 性能优化建议

### 1. I/O 操作优化

```typescript
// ✅ 好的做法 - 批量写入
const data = ['line1', 'line2', 'line3'];
await Bun.write('./output.txt', data.join('\n'));

// ❌ 避免 - 多次写入
for (const line of data) {
  await Bun.write('./output.txt', line + '\n'); // 低效
}
```

### 2. 文件读取优化

```typescript
// ✅ 好的做法 - 使用 file.text()
const content = await Bun.file('./data.txt').text();

// ❌ 避免 - 使用 FileReader（浏览器 API）
const reader = new FileReader();
reader.onload = () => console.log(reader.result);
reader.readAsText(file);
```

### 3. 密码哈希优化

```typescript
// ✅ 好的做法 - 使用默认 bcrypt（性能最佳）
const hash = await Bun.password.hash(password, 'bcrypt');

// ⚠️ 谨慎 - 使用 argon2（更安全但更慢）
const hash = await Bun.password.hash(password, {
  algorithm: 'argon2id',
  memorySize: 64,
});
```

---

## 常见错误和解决方案

### 错误 1: 文件不存在

```typescript
// ❌ 错误 - 直接读取会导致错误
const content = await Bun.file('./nonexistent.txt').text();

// ✅ 正确 - 检查文件是否存在
const file = Bun.file('./nonexistent.txt');
if (await file.exists()) {
  const content = await file.text();
}
```

### 错误 2: 密码验证失败

```typescript
// ❌ 错误 - 哈希格式不匹配
const hash = await Bun.password.hash(password, 'bcrypt');
const isValid = await Bun.password.verify(password, hash, 'argon2id'); // 错误算法

// ✅ 正确 - 让 Bun 自动检测算法
const isValid = await Bun.password.verify(password, hash);
```

### 错误 3: 环境变量未定义

```typescript
// ❌ 错误 - 返回 undefined
const dbUrl = Bun.env.DATABASE_URL;
await connect(dbUrl); // 失败

// ✅ 正确 - 提供默认值
const dbUrl = Bun.env.DATABASE_URL ?? 'sqlite:./db.sqlite';

// ✅ 正确 - 严格检查
function getRequiredEnv(key: string): string {
  const value = Bun.env[key];
  if (!value) throw new Error(`Missing ${key}`);
  return value;
}
```

---

## 检查清单

在提交代码前，确保：

- [ ] 所有文件操作使用 `Bun.file()` 或 `Bun.write()`
- [ ] 密码哈希使用 `Bun.password.hash()`
- [ ] 密码验证使用 `Bun.password.verify()`
- [ ] UUID 生成使用 `Bun.randomUUIDv7()`
- [ ] 环境变量读取使用 `Bun.env`
- [ ] 路径操作使用 `import.meta.dir` 或 `import.meta.resolve()`
- [ ] HTTP 服务器使用 `Bun.serve()`（如果需要独立服务器）
- [ ] 没有使用 Node.js 兼容层（`node-fetch`, `fs/promises` 等）
- [ ] 没有使用第三方 UUID 库（`uuid`, `nanoid` 等）
- [ ] 没有使用第三方加密库（`bcrypt`, `argon2` 等）

---

## 扩展阅读

- [Bun 官方文档](https://bun.sh/docs)
- [Bun 快速开始](https://bun.sh/docs/installation)
- [Bun 性能文档](https://bun.sh/docs/runtime/performance)
- [Bun vs Node.js 对比](https://bun.sh/docs/runtime/bun-node-compatibility)
- [AGENTS.md](../AGENTS.md) - AI 代理快速参考
- [TECH_SPEC.md](./TECH_SPEC.md) - 技术规范索引

---

## 变更日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-02-10 | 1.0 | 初始版本 |
