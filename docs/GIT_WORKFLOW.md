# Git 工作流规范

> **版本：** 2.0
> **最后更新：** 2026-03-13
> **目的：** 规范 Git 分支管理和开发流程

---

## 🚨 核心规则（必须遵守）

### 1. 必须运行分支检查脚本

**在开始任何开发工作前，必须运行：**

```bash
bun run scripts/check-branch.ts
```

**如果脚本返回错误（exit code 1），严禁继续开发！**

该脚本会：
- ✅ 验证当前分支名称符合规范
- ✅ 检测是否在受保护分支（main、fix-e2e、hotfix-*）
- ✅ 自动尝试切换到最近使用的合规分支
- ❌ 如果不符合规范，阻止开发并给出提示

### 2. 功能分支命名规范

```
feature/story-{Epic编号}-{Story编号}-{简短描述}
```

**示例：**
- `feature/story-2-10-parent-approves-completion` ✅
- `feature/story-1-7-member-management` ✅
- `my-feature` ❌
- `fix/login-bug` ✅ (仅用于 bug 修复)

### 3. 禁止在受保护分支开发

| 分支 | 状态 | 用途 |
|------|------|------|
| `main` | 🚫 禁止开发 | 稳定代码 |
| `fix-e2e` | 🚫 禁止开发 | E2E 测试调试 |
| `hotfix-*` | 🚫 禁止开发 | 紧急修复 |

---

## 📋 完整开发流程

### 开始开发

```bash
# 1. 确保在 main 且最新
git checkout main && git pull

# 2. 创建功能分支
git checkout -b feature/story-2-10-parent-approves-completion

# 3. 【必须】运行分支检查
bun run scripts/check-branch.ts
```

### 开发阶段

```bash
# 频繁提交，保持原子性
git commit -m "feat: add approval API"
git commit -m "test: add integration tests"
```

### 提交前验证

```bash
bun tsc --noEmit    # 类型检查
bun test            # 运行测试
```

### 完成开发

```bash
git push            # 推送到远程功能分支
# 等待代码审查...
```

---

## 📝 提交信息规范

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: add approval API` |
| `fix` | Bug 修复 | `fix: resolve race condition` |
| `test` | 测试 | `test: add integration tests` |
| `refactor` | 重构 | `refactor: extract validation` |
| `docs` | 文档 | `docs: update API docs` |
| `chore` | 构建/工具 | `chore: update deps` |

---

## ⚠️ 常见错误

| 错误 | 后果 | 解决 |
|------|------|------|
| 在 main 开发 | 代码混乱 | 创建 feature 分支 |
| 分支命名不规范 | 难以追踪 | 使用 `feature/story-X-Y-name` |
| 未运行 check-branch.ts | 违反规范 | **每次开发前必须运行** |

---

## 🔍 检查清单

### 开发前
- [ ] 运行 `bun run scripts/check-branch.ts` ✅ 通过
- [ ] 分支命名符合 `feature/story-X-Y-name` 格式
- [ ] 不在 main、fix-e2e、hotfix-* 分支

### 开发后
- [ ] 所有测试通过 (`bun test`)
- [ ] 类型检查通过 (`bun tsc --noEmit`)
- [ ] 提交信息符合规范

---

## 📝 变更日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-03-13 | 2.0 | 精简文档，强调必须运行 check-branch.ts |
| 2026-03-06 | 1.1 | 添加代码审查环节 |
| 2026-03-06 | 1.0 | 初始版本 |
