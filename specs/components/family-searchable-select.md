数据源

```ts
// 示例代码
const response = await fetch("/api/admin/families?status=approved");
const data = await response.json();

if (data.success && data.data) {
  const families = data.data;

  const familiesWithParents = families.map((f) => ({
    id: f.id,
    name: f.name,
    parentName: f.primaryParent?.name || null,
    parentPhone: f.primaryParent?.phone || null,
    type: "family" as const,
  }));
  [
    { id: "all", name: "全部", type: "all" },
    {
      id: "admin",
      name: "管理员",
      parentName: "admin",
      parentPhone: null,
      type: "admin",
    },
    ...familiesWithParents,
  ].map((option) => ({
    id: option.id,
    label:
      option.type === "all"
        ? "全部"
        : option.type === "admin"
          ? "管理员(admin)"
          : `${option.name}(${option.parentName || "未知"})(${option.parentPhone || "未知"})`,
    data: option,
  }));
}
```

使用 Combobox 组件做检索过滤
