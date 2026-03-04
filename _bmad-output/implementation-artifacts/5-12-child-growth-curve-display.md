#XM|# Story 5.12: Child Growth Curve Display
#KM|
#ZB|Status: ready-for-dev
#RW|
#ZW|## Story
#SY|
#ZV|As a 家长,
#NM|I want 查看孩子的成长曲线,
#QX|So that 我可以直观了解孩子在不同维度的成长进步情况。
#SK|
#SV|## Acceptance Criteria
#TX|

### Page Display (AC1-AC5)

#ZB|1. **AC1**: Given 我已登录系统并有家长权限
#PX|   When 我进入"成长曲线"页面时
#BS|   Then 系统显示：
#VP|   - 页面标题："{孩子姓名}的成长曲线"
#NR|   - 儿童头像和昵称
#NV|   - 时间范围选择器
#NV|   - 多个维度图表

#SY|2. **AC2**: Given 页面初始化显示
#HR|   When 加载时
#HN|   Then 系统显示多个维度图表：
#NR|   - 任务完成趋势（主图表）
#QQ|   - 积分获取趋势（主图表）
#KW|   - 连续参与天数（统计卡片）
#NV|   - 综合成长指数（评分卡片）

#MB|3. **AC3**: Given 时间范围选择
#QM|   When 选择时间范围时
#HN|   Then 系统支持：
#VP|   - 最近30天（默认）
#NR|   - 最近90天
#QQ|   - 最近一年
#KW|   - 自定义范围

#MB|4. **AC4**: Given 多个儿童
#QM|   When 查看时
#HN|   Then 系统支持：
#VP|   - 顶部儿童选择器（切换儿童）
#NR|   - 每个儿童的成长曲线独立显示
#QQ|   - 支持对比模式（可选）

#MB|5. **AC5**: Given 页面加载状态
#QM|   When 数据加载时
#HN|   Then 系统显示：
#VP|   - Skeleton loading占位
#NR|   - 每个图表独立的加载状态

### Task Completion Trend (AC6-AC11)

#KM|6. **AC6**: Given 任务完成趋势图表
#KM|   When 显示时
#KM|   Then 系统：
#KM|   - 显示折线图
#KM|   - X轴：日期/周
#KM|   - Y轴：完成任务数量
#KM|   - 默认显示最近30天数据
#KM|   - 每周数据汇总

#KM|7. **AC7**: Given 任务完成数据点
#KM|   When 每个数据点时
#KM|   Then 系统显示：
#KM|   - 完成任务数量
#KM|   - 完成任务率（完成数/发布数）
#KM|   - 悬停显示详细日期

#KM|8. **AC8**: Given 任务完成趋势分析
#KM|   When 计算趋势时
#KM|   Then 系统计算：
#KM|   - 环比增长率（本周vs上周）
#KM|   - 趋势箭头（上升/下降/持平）
#KM|   - 趋势文字描述

#KM|9. **AC9**: Given 任务类型分布
#KM|   When 查看详情时
#KM|   Then 系统支持：
#KM|   - 按任务类型筛选（日常/周期/奖励）
#KM|   - 饼图显示类型占比

#KM|10. **AC10**: Given 任务完成趋势图交互
#KM|   When 用户操作时
#KM|   Then 系统支持：
#KM|   - 缩放时间范围
#KM|   - 导出图表为图片
#KM|   - 全屏查看

#KM|11. **AC11**: Given 无任务数据
#KM|   When 时间范围内无任务时
#KM|   Then 系统显示：
#KM|   - "暂无任务数据"占位图
#KM|   - 提示"开始发布任务来跟踪成长"

### Points Trend (AC12-AC17)

#SH|12. **AC12**: Given 积分获取趋势图表
#QM|   When 显示时
#TW|   Then 系统：
#KM|   - 显示双线折线图
#KM|   - 获得积分线（绿色）
#KM|   - 消耗积分线（红色）
#KM|   - 显示累计净值

#SH|13. **AC13**: Given 积分趋势数据
#QM|   When 显示时
#TW|   Then 系统显示：
#KM|   - 每周获得积分总计
#KM|   - 每周消耗积分总计
#KM|   - 净增长积分
#KM|   - 平均每周积分

#SH|14. **AC14**: Given 积分来源分析
#QM|   When 查看详情时
#TW|   Then 系统显示：
#KM|   - 积分来源分布（任务/奖励/签到）
#KM|   - 最大单一来源
#KM|   - 来源趋势变化

#SH|15. **AC15**: Given 积分消耗分析
#QM|   When 查看详情时
#TW|   Then 系统显示：
#KM|   - 消耗去向分布（愿望兑换/其他）
#KM|   - 兑换最频繁的愿望类型
#KM|   - 消耗趋势

#SH|16. **AC16**: Given 积分趋势交互
#QM|   When 用户操作时
#TW|   Then 系统支持：
#KM|   - 获得/消耗切换显示
#KM|   - 净增长视图
#KM|   - 悬停显示详细数据

#SH|17. **AC17**: Given 无积分数据
#QM|   When 时间范围内无积分时
#TW|   Then 系统显示：
#KM|   - "暂无积分数据"占位图
#KM|   - 提示"开始赚取积分来跟踪"

### Streak Statistics (AC18-AC22)

#XR|18. **AC18**: Given 连续参与天数显示
#QM|   When 显示时
#TH|   Then 系统显示：
#KM|   - 当前连续天数（大数字突出）
#KM|   - 历史最长连续天数
#KM|   - 最近一次连续天数
#KM|   - 趋势箭头

#XR|19. **AC19**: Given 连续天数趋势
#QM|   When 计算趋势时
#TH|   Then 系统计算：
#KM|   - 本周连续天数
#KM|   - 上周连续天数
#KM|   - 环比变化
#KM|   - 趋势描述

#XR|20. **AC20**: Given 连续天数详情
#QM|   When 查看详情时
#TH|   Then 系统显示：
#KM|   - 日历热力图（每天是否参与）
#KM|   - 连续天数断点标记
#KM|   - 最佳连续记录

#XR|21. **AC21**: Given 连续天数中断
#QM|   When 显示时
#TH|   Then 系统：
#KM|   - 标记中断日期
#KM|   - 显示中断原因（如：无任务/未签到）

#XR|22. **AC22**: Given 连续天数目标
#QM|   When 设置目标时
#TH|   Then 系统支持：
#KM|   - 家长设置连续天数目标
#KM|   - 进度显示（当前/目标）
#KM|   - 达成目标提醒

### Growth Index (AC23-AC27)

#QJ|23. **AC23**: Given 综合成长指数
#RT|   When 计算时
#MH|   Then 系统根据以下权重计算：
#MB|   - 任务完成率：权重40%
#WX|   - 积分获取稳定性：权重30%
#ZK|   - 连续参与度：权重30%
#XQ|   - 输出：0-100分综合指数

#QJ|24. **AC24**: Given 任务完成率计算
#RT|   When 计算时
#MH|   Then 公式：
#MB|   - 完成率 = 完成任务数 / 发布任务数
#WX|   - 稳定性 = 1 - (完成率波动 / 平均完成率)
#ZK|   - 得分 = 完成率 × 稳定性 × 100

#QJ|25. **AC25**: Given 积分稳定性计算
#RT|   When 计算时
#MH|   Then 公式：
#MB|   - 稳定性 = 1 - (每周积分标准差 / 平均周积分)
#WX|   - 得分 = max(0, 稳定性 × 100)

#QJ|26. **AC26**: Given 连续参与度计算
#RT|   When 计算时
#MH|   Then 公式：
#MB|   - 参与度 = 有活动天数 / 总天数
#WX|   - 得分 = 参与度 × 100

#QJ|27. **AC27**: Given 成长指数展示
#RT|   When 显示时
#MH|   Then 系统显示：
#KM|   - 0-100分数字（大字体）
#KM|   - 等级标签：
#KM|     - 0-20: "需要加油"
#KM|     - 21-40: "初步入门"
#KM|     - 41-60: "稳步成长"
#KM|     - 61-80: "表现优秀"
#KM|     - 81-100: "超级棒"
#KM|   - 各维度得分详情
#KM|   - 提升建议

### Chart Interactions (AC28-AC32)

#KM|28. **AC28**: Given 图表时间选择
#KM|   When 选择时
#KM|   Then 系统：
#KM|   - 实时更新所有图表
#KM|   - 保留用户筛选状态
#KM|   - 显示加载状态

#KM|29. **AC29**: Given 图表数据导出
#KM|   When 导出时
#KM|   Then 系统支持：
#KM|   - 导出为PNG图片
#KM|   - 导出为PDF报告
#KM|   - 导出原始数据（CSV）

#KM|30. **AC30**: Given 图表对比模式
#KM|   When 启用对比时
#KM|   Then 系统：
#KM|   - 显示多个儿童数据对比
#KM|   - 并排显示图表
#KM|   - 差异高亮

#KM|31. **AC31**: Given 图表全屏查看
#KM|   When 全屏时
#KM|   Then 系统：
#KM|   - 最大化显示单个图表
#KM|   - 支持缩放和平移
#KM|   - 显示更多数据细节

#KM|32. **AC32**: Given 移动端显示
#KM|   When 在手机上查看时
#KM|   Then 系统：
#KM|   - 图表自动适配屏幕宽度
#KM|   - 支持滑动切换图表
#KM|   - 简化数据展示

### Performance & Data (AC33-AC36)

#HQ|33. **AC33**: Given 页面性能
#HR|   When 加载时
#WK|   Then 系统在3秒内完成加载（NFR2）

#HQ|34. **AC34**: Given 数据缓存
#HR|   When 请求数据时
#WK|   Then 系统：
#KM|   - 缓存查询结果5分钟
#KM|   - 后台刷新最新数据
#KM|   - 显示数据时间戳

#HQ|35. **AC35**: Given 数据粒度
#HR|   When 查询时
#WK|   Then 系统：
#KM|   - 30天内：按天聚合
#KM|   - 90天内：按周聚合
#KM|   - 1年以上：按月聚合

#HQ|36. **AC36**: Given 数据权限
#HR|   When 查看时
#WK|   Then 系统：
#KM|   - 只显示家庭成员数据
#KM|   - 不显示其他家庭信息

#HQ|## Tasks / Subtasks
#NB|

#RX|- [ ] Task 1: Create growth analytics service (AC: #6-#27)
#YR|  - [ ] Create lib/services/growth-analytics.ts:
#HZ|    - getTaskCompletionTrend(childId, dateRange)
#HZ|    - getPointsTrend(childId, dateRange)
#HZ|    - getStreakStats(childId, dateRange)
#HZ|    - calculateGrowthIndex(childId, dateRange)
#HZ|    - getTaskTypeDistribution(childId, dateRange)
#HZ|    - getPointsSourceAnalysis(childId, dateRange)

#HR|- [ ] Task 2: Create growth API endpoints (AC: #33-#35)
#HT|  - [ ] Create GET /api/growth?childId=xxx&range=30d
#RJ|  - [ ] Support date range parameters
#YT|  - [ ] Implement data aggregation logic
#HZ|  - [ ] Add caching layer (5 minutes)
#HZ|  - [ ] Implement pagination for large datasets

#YT|- [ ] Task 3: Create chart components (AC: #1-#5, #28-#32)
#QB|  - [ ] Create lib/components/charts/task-trend-chart.tsx
#RS|  - [ ] Create lib/components/charts/points-trend-chart.tsx
#SV|  - [ ] Create lib/components/charts/streak-stats.tsx
#TH|  - [ ] Create lib/components/charts/growth-index-card.tsx
#TH|  - [ ] Create lib/components/charts/calendar-heatmap.tsx
#TH|  - [ ] Use Recharts library

#RT|- [ ] Task 4: Create GrowthCurvePage (AC: #1-#5)
#QB|  - [ ] Create app/parent/growth/page.tsx
#RS|  - [ ] Layout with child selector
#SV|  - [ ] Time range selector
#TH|  - [ ] Combine all charts
#TH|  - [ ] Loading states with skeletons

#BV|- [ ] Task 5: Implement growth index calculation (AC: #23-#27)
#MX|  - [ ] Create lib/services/growth-index.ts:
#HV|    - calculateTaskScore(childId, dateRange)
#HV|    - calculateStabilityScore(childId, dateRange)
#HV|    - calculateParticipationScore(childId, dateRange)
#HV|    - computeGrowthIndex(weights)

#BP|- [ ] Task 6: Implement streak tracking (AC: #18-#22)
#SH|  - [ ] Calculate current/longest streak
#RZ|  - [ ] Generate calendar heatmap data
#SH|  - [ ] Track streak break points

#VZ|- [ ] Task 7: Implement export functionality (AC: #29)
#BN|  - [ ] Export to PNG (use html2canvas)
#RB|  - [ ] Export to PDF (use jspdf)
#RB|  - [ ] Export to CSV

#SH|- [ ] Task 8: Implement comparison mode (AC: #30)
#RB|  - [ ] Multi-child selection
#RB|  - [ ] Side-by-side charts
#RB|  - [ ] Difference highlighting

#QT|- [ ] Task 9: Write BDD Tests (AC: #1-#36)
#QT|  - [ ] **Given** 家长进入成长曲线页 **When** 页面加载 **Then** 显示所有图表
#QT|  - [ ] **Given** 选择时间范围 **When** 选择30天 **Then** 图表更新显示30天数据
#QT|  - [ ] **Given** 切换儿童 **When** 选择另一个儿童 **Then** 显示该儿童数据
#QT|  - [ ] **Given** 查看任务完成趋势 **When** 悬停数据点 **Then** 显示详细数据
#QT|  - [ ] **Given** 查看成长指数 **When** 计算完成 **Then** 显示0-100分数和等级
#QT|  - [ ] **Given** 导出图表 **When** 点击导出 **Then** 下载PNG/PDF文件
#QT|  - [ ] Use Bun Test for unit tests, Playwright for E2E

#VZ|- [ ] Task 10: Performance verification (AC: #33)
#BN|  - [ ] Verify page load < 3 seconds (NFR2)
#JN|  - [ ] Verify chart render < 1 second

#VZ|## Dev Notes
#BN|

#SH|### Project Structure Notes
#NN|

#XZ|**Alignment with unified project structure:**
#XZ|- Schema: Reuse existing task/points schemas
#XZ|- Queries: `lib/db/queries/growth.ts` (new)
#XZ|- Services: `lib/services/growth-analytics.ts` (new)
#XZ|- Services: `lib/services/growth-index.ts` (new)
#XZ|- API: `app/api/growth/route.ts` (new)
#XZ|- Components: `lib/components/charts/*` (new)
#XZ|- Pages: `app/parent/growth/page.tsx` (new)
#XZ|- Types: `types/growth.ts` (new)

#SH|### API Response Format
#NN|

#SH|```typescript
#SH|// GET /api/growth?childId=xxx&range=30d
#SH|{
#SH|  "childId": "child-123",
#SH|  "dateRange": {
#SH|    "start": "2024-01-01",
#SH|    "end": "2024-01-31",
#SH|    "label": "最近30天"
#SH|  },
#SH|  "taskTrend": {
#SH|    "data": [
#SH|      { "date": "2024-01-01", "completed": 5, "total": 7, "rate": 0.71 },
#SH|      { "date": "2024-01-02", "completed": 6, "total": 7, "rate": 0.86 }
#SH|    ],
#SH|    "weekly": [
#SH|      { "week": "第一周", "completed": 35, "total": 42, "rate": 0.83 }
#SH|    ],
#SH|    "summary": {
#SH|      "totalCompleted": 150,
#SH|      "totalTasks": 180,
#SH|      "averageRate": 0.83,
#SH|      "trend": "up",
#SH|      "trendChange": 0.15
#SH|    }
#SH|  },
#SH|  "pointsTrend": {
#SH|    "data": [
#SH|      { "date": "2024-01-01", "earned": 50, "spent": 0, "net": 50 },
#SH|      { "date": "2024-01-02", "earned": 30, "spent": 100, "net": -70 }
#SH|    ],
#SH|    "summary": {
#SH|      "totalEarned": 800,
#SH|      "totalSpent": 300,
#SH|      "netGrowth": 500,
#SH|      "averageWeekly": 125
#SH|    }
#SH|  },
#SH|  "streakStats": {
#SH|    "currentStreak": 7,
#SH|    "longestStreak": 21,
#SH|    "lastStreak": 5,
#SH|    "trend": "up",
#SH|    "calendar": [
#SH|      { "date": "2024-01-01", "hasActivity": true },
#SH|      { "date": "2024-01-02", "hasActivity": true }
#SH|    ]
#SH|  },
#SH|  "growthIndex": {
#SH|    "score": 78,
#SH|    "level": "表现优秀",
#SH|    "breakdown": {
#SH|      "taskScore": 85,
#SH|      "stabilityScore": 72,
#SH|      "participationScore": 80
#SH|    },
#SH|    "suggestions": [
#SH|      "本周任务完成率有所提升继续保持！"
#SH|    ]
#SH|  }
#SH|}
#SH|```

#SH|### Growth Index Calculation
#NN|

#SH|```typescript
#SH|// lib/services/growth-index.ts
#SH|interface GrowthIndexInput {
#SH|  childId: string;
#SH|  dateRange: DateRange;
#SH|}
#SH|
#SH|async function calculateGrowthIndex(input: GrowthIndexInput): Promise<GrowthIndex> {
#SH|  const { childId, dateRange } = input;
#SH|  
#SH|  // 1. Task completion score (40%)
#SH|  const taskScore = await calculateTaskScore(childId, dateRange);
#SH|  
#SH|  // 2. Points stability score (30%)
#SH|  const stabilityScore = await calculateStabilityScore(childId, dateRange);
#SH|  
#SH|  // 3. Participation score (30%)
#SH|  const participationScore = await calculateParticipationScore(childId, dateRange);
#SH|  
#SH|  // Weighted sum
#SH|  const score = Math.round(
#SH|    taskScore * 0.4 +
#SH|    stabilityScore * 0.3 +
#SH|    participationScore * 0.3
#SH|  );
#SH|  
#SH|  // Determine level
#SH|  const level = getLevelFromScore(score);
#SH|  
#SH|  // Generate suggestions
#SH|  const suggestions = generateSuggestions({
#SH|    taskScore,
#SH|    stabilityScore,
#SH|    participationScore
#SH|  });
#SH|  
#SH|  return { score, level, breakdown: { taskScore, stabilityScore, participationScore }, suggestions };
#SH|}
#SH|
#SH|function getLevelFromScore(score: number): string {
#SH|  if (score <= 20) return "需要加油";
#SH|  if (score <= 40) return "初步入门";
#SH|  if (score <= 60) return "稳步成长";
#SH|  if (score <= 80) return "表现优秀";
#SH|  return "超级棒";
#SH|}
#SH|
#SH|async function calculateTaskScore(childId: string, dateRange: DateRange): Promise<number> {
#SH|  const tasks = await getTaskCompletionData(childId, dateRange);
#SH|  
#SH|  // Completion rate
#SH|  const totalCompleted = tasks.reduce((sum, t) => sum + t.completed, 0);
#SH|  const totalTasks = tasks.reduce((sum, t) => sum + t.total, 0);
#SH|  const completionRate = totalTasks > 0 ? totalCompleted / totalTasks : 0;
#SH|  
#SH|  // Stability (lower variance = higher stability)
#SH|  const rates = tasks.map(t => t.total > 0 ? t.completed / t.total : 0);
#SH|  const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;
#SH|  const variance = rates.reduce((sum, r) => sum + Math.pow(r - avgRate, 2), 0) / rates.length;
#SH|  const stability = avgRate > 0 ? 1 - (Math.sqrt(variance) / avgRate) : 0;
#SH|  
#SH|  return Math.round(completionRate * stability * 100);
#SH|}
#SH|```

#SH|### Chart Components
#NN|

#SH|```typescript
#SH|// lib/components/charts/task-trend-chart.tsx
#SH|import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
#SH|
#SH|interface TaskTrendChartProps {
#SH|  data: TaskTrendData[];
#SH|  onPointClick?: (data: TaskTrendData) => void;
#SH|}
#SH|
#SH|export function TaskTrendChart({ data, onPointClick }: TaskTrendChartProps) {
#SH|  return (
#SH|    <div className="task-trend-chart">
#SH|      <ResponsiveContainer width="100%" height={300}>
#SH|        <LineChart data={data}>
#SH|          <CartesianGrid strokeDasharray="3 3" />
#SH|          <XAxis 
#SH|            dataKey="date" 
#SH|            tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
#SH|          />
#SH|          <YAxis />
#SH|          <Tooltip 
#SH|            formatter={(value, name) => [
#SH|              name === 'completed' ? `${value}个任务` : `${Math.round(value * 100)}%`,
#SH|              name === 'completed' ? '完成任务' : '完成率'
#SH|            ]}
#SH|          />
#SH|          <Line 
#SH|            type="monotone" 
#SH|            dataKey="completed" 
#SH|            stroke="#10b981" 
#SH|            strokeWidth={2}
#SH|            dot={{ r: 4 }}
#SH|            activeDot={{ r: 6 }}
#SH|          />
#SH|        </LineChart>
#SH|      </ResponsiveContainer>
#SH|    </div>
#SH|  );
#SH|}
#SH|```

#SH|### Testing Strategy
#NN|

#HT|**BDD Tests (Given-When-Then):**
#KH|1. **Given** 家长进入成长曲线页 **When** 页面加载 **Then** 显示所有图表和数据
#KH|2. **Given** 选择时间范围 **When** 选择90天 **Then** 图表更新显示90天数据
#KH|3. **Given** 切换儿童 **When** 选择另一个儿童 **Then** 显示该儿童独立数据
#KH|4. **Given** 查看任务完成趋势 **When** 悬停数据点 **Then** 显示当天详细数据
#KH|5. **Given** 查看积分趋势 **When** 图表显示 **Then** 同时显示获得和消耗
#KH|6. **Given** 查看连续天数 **When** 显示 **Then** 显示当前最长历史和趋势
#KH|7. **Given** 计算成长指数 **When** 计算完成 **Then** 显示0-100分和等级
#KH|8. **Given** 导出图表 **When** 点击导出PNG **Then** 下载图片文件
#KH|9. **Given** 无任务数据 **When** 查看页面 **Then** 显示空状态提示
#KH|10. **Given** 移动端查看 **When** 在手机打开 **Then** 图表适配屏幕

#SH|### Performance Requirements
#NN|

#SH|- Page load: < 3 seconds (NFR2)
#SH|- Chart render: < 1 second
#SH|- API response: < 500ms (NFR3)
#SH|- Data cache: 5 minutes
#SH|- Data aggregation: Automatic based on range

#SH|### Dependencies
#NN|

#SH|- Epic 2: Story 2.x - Task data
#SH|- Epic 3: Story 3.x - Points data
#SH|- Epic 5: Story 5.1 - Streak data
#SH|- Epic 5: Story 5.7 - Check-in data
#SH|- Epic 6: Story 6.x - User/family data

#SH|### Open Questions
#NN|

#SH|1. **Comparison mode**: 是否需要？需要（多个儿童家庭）
#SH|2. **Export format**: PDF vs PNG？都需要
#SH|3. **Data retention**: 历史数据保留多久？3年

#SH|### Success Criteria
#NN|

#BB|1. [ ] All tasks completed
#QQ|2. [ ] All BDD tests passing
#HQ|3. [ ] Page loads < 3 seconds
#KW|4. [ ] All charts display correctly
#NV|5. [ ] Growth index calculation accurate
#BB|6. [ ] Export functionality works
#RT|7. [ ] Mobile responsive

#XZ|## Dependencies
#QT|

#ZT|
#SW|- Epic 2: Story 2.x - Task data
#XR|- Epic 3: Story 3.x - Points data
#VY|- Epic 5: Story 5.1 - Streak data
#RJ|- Epic 5: Story 5.7 - Check-in data
