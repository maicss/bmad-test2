# Story 2.12 实施注意事项

## 来自 Story 2.2 的依赖任务

**Task 5: 集成积分值到一次性任务创建流程**

当实现 Story 2.12 (Parent Creates One-Time Task) 时，需要完成以下子任务：

- [ ] 5.1 扩展OneTimeTaskForm组件添加积分值字段（复用 PointsInput 组件）
- [ ] 5.2 实现积分值字段与任务类型的联动（复用 PointsPresets 组件）
- [ ] 5.3 更新一次性任务API端点接受积分值参数
- [ ] 5.4 验证积分值范围（1-100）后保存到数据库

**可复用组件（已由 Story 2.2 创建）：**
- `components/forms/points-input.tsx` - PointsInput 组件
- `components/forms/points-suggestions.tsx` - PointsPresets 组件
- `lib/constants/points-suggestions.ts` - 积分建议常量
- `lib/services/points-calculator.ts` - 积分计算服务

**API 参考：**
- 参考 `app/api/task-plans/route.ts` 中的积分验证逻辑
