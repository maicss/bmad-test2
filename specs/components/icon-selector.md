图标选择器

- 作为表单项存在
- 支持边框选择预览，边框："circle" | "hexagon" | "square"，默认 circle，支持配置，默认不显示
- 图标选择方式：
  - 支持选择 lucide 图标，默认项
    - 支持修改颜色 参考 PRESET_COLORS
    - 支持图片检索
  - 上传图片
    - 先上传到图床，然后再根据返回的url进行显示
- 使用change事件，返回值：`{type: 'icon'|'image', borderStyle: "circle" | "hexagon" | "square", color: string, url: string}`

```ts
const PRESET_COLORS = [
  { name: "红色", value: "#EF4444", class: "bg-red-500" },
  { name: "橙色", value: "#F97316", class: "bg-orange-500" },
  { name: "琥珀色", value: "#F59E0B", class: "bg-amber-500" },
  { name: "黄色", value: "#EAB308", class: "bg-yellow-500" },
  { name: "青柠色", value: "#84CC16", class: "bg-lime-500" },
  { name: "绿色", value: "#22C55E", class: "bg-green-500" },
  { name: "翠绿色", value: "#10B981", class: "bg-emerald-500" },
  { name: "青色", value: "#06B6D4", class: "bg-cyan-500" },
  { name: "天蓝色", value: "#0EA5E9", class: "bg-sky-500" },
  { name: "蓝色", value: "#3B82F6", class: "bg-blue-500" },
  { name: "靛蓝色", value: "#6366F1", class: "bg-indigo-500" },
  { name: "紫罗兰", value: "#8B5CF6", class: "bg-violet-500" },
  { name: "紫色", value: "#A855F7", class: "bg-purple-500" },
  { name: "洋红色", value: "#D946EF", class: "bg-fuchsia-500" },
  { name: "粉色", value: "#EC4899", class: "bg-pink-500" },
  { name: "玫瑰色", value: "#FB7185", class: "bg-rose-500" },
  { name: "石板色", value: "#64748B", class: "bg-slate-500" },
  { name: "灰色", value: "#6B7280", class: "bg-gray-500" },
  { name: "锌色", value: "#71717A", class: "bg-zinc-500" },
  { name: "中性色", value: "#737373", class: "bg-neutral-500" },
  { name: "石头色", value: "#78716C", class: "bg-stone-500" },
  { name: "黑色", value: "#000000", class: "bg-black" },
] as const;
```
