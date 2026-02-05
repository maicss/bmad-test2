## 系统初始化时添加默认日期策略

> 2026年国假安排
> 一、元旦：1月1日（周四）至3日（周六）放假调休，共3天。1月4日（周日）上班。
>
> 二、春节：2月15日（农历腊月二十八、周日）至23日（农历正月初七、周一）放假调休，共9天。2月14日（周六）、2月28日（周六）上班。
>
> 三、清明节：4月4日（周六）至6日（周一）放假，共3天。
>
> 四、劳动节：5月1日（周五）至5日（周二）放假调休，共5天。5月9日（周六）上班。
>
> 五、端午节：6月19日（周五）至21日（周日）放假，共3天。
>
> 六、中秋节：9月25日（周五）至27日（周日）放假，共3天。
>
> 七、国庆节：10月1日（周四）至7日（周三）放假调休，共7天。9月20日（周日）、10月10日（周六）上班。

## 要求

根据国假安排和日历，写脚本，在项目启动的时候检测数据库是不是存在如下规则的日期策略，如果不存在，则写入，存在则跳过。并打印日志

- 每天
- 周末（不含国假规则）
- 工作日（不含国假规则）
- 工作日（含国假）
- 休息日（含国假）

数据库表名称：date_strategies

```
id: text("id").primaryKey(),
name: text("name").notNull(),
description: text("description"),
region: text("region").notNull(),
year: integer("year").notNull(),
isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
dates: text("dates").notNull(),
copyCount: integer("copy_count").notNull().default(0),
createdBy: text("created_by"),
createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
```

默认值
region 为全国
isPublic true
description为空
