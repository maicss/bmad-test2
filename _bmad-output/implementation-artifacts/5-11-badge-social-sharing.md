#XV|# Story 5.11: Badge Social Sharing
#KM|
#ZB|Status: ready-for-dev
#RW|
#ZW|## Story
#SY|
#KY|As a 儿童,
#XB|I want 分享获得的徽章到家长,
#KR|So that 我可以向家长展示自己的成就，获得更多的认可和鼓励。
#SK|
#SV|## Acceptance Criteria
#TX|

### Share Entry Points (AC1-AC4)

#QY|1. **AC1**: Given 我已获得徽章并查看徽章详情
#RJ|   When 我点击"分享"按钮时
#YY|   Then 系统显示分享选项菜单

#BN|2. **AC2**: Given 显示分享选项时
#TJ|   When 菜单展开时
#WP|   Then 系统显示：
#QZ|   - "分享到家长"（默认首选）
#RR|   - "复制分享链接"
#KB|   - "保存图片到相册"

#YM|3. **AC3**: Given 在徽章墙页面
#KX|   When 我长按或点击徽章的分享图标时
#TW|   Then 系统显示分享选项菜单（与AC2相同）

#YM|4. **AC4**: Given 在通知消息中
#KX|   When 我收到徽章获得通知时
#TW|   Then 系统在通知中显示"分享"快捷按钮

### Share to Parent (AC5-AC9)

#KM|5. **AC5**: Given 我选择"分享到家长"
#KM|   When 选择时
#KM|   Then 系统：
#KM|   - 直接发送给家庭成员中的家长
#KM|   - 显示"已发送给家长"成功提示
#KM|   - 使用系统内消息通道（非系统通知）

#KM|6. **AC6**: Given 分享到家长时
#KM|   When 发送时
#KM|   Then 系统消息包含：
#KM|   - 徽章图标（大尺寸）
#KM|   - 徽章名称
#KM|   - 获得原因
#KM|   - 获得时间

#KM|7. **AC7**: Given 家长收到分享
#KM|   When 查看消息时
#KM|   Then 系统显示：
#KM|   - 徽章详情卡片
#KM|   - "恭喜孩子"按钮
#KM|   - "查看更多徽章"按钮

#KM|8. **AC8**: Given 家长点击"恭喜孩子"
#KM|   When 点击时
#KM|   Then 系统：
#KM|   - 发送鼓励消息给孩子
#KM|   - 孩子收到鼓励反馈
#KM|   - 显示"已发送鼓励！"

#KM|9. **AC9**: Given 多个家长
#KM|   When 分享到家长时
#KM|   Then 系统发送给所有家长

### Share Link (AC10-AC15)

#MM|10. **AC10**: Given 我选择"复制分享链接"
#KX|   When 选择时
#TW|   Then 系统：
#BZ|   - 生成唯一分享链接
#RT|   - 复制到剪贴板
#KM|   - 显示"链接已复制到剪贴板"（Shadcn Toast）

#MS|11. **AC11**: Given 分享链接格式
#TY|   When 生成时
#BZ|   Then 链接格式：`{domain}/share/badge/{shareCode}`
#KM|   - 分享码：8位随机字符串
#KM|   - 有效期：7天

#MS|12. **AC12**: Given 分享链接创建时
#TY|   When 生成时
#BZ|   Then 系统：
#KM|   - 记录分享到share_records表
#KM|   - 设置过期时间戳
#KM|   - 记录分享者信息

#MS|13. **AC13**: Given 家长收到分享链接
#RB|   When 点击链接时（未登录）
#BH|   Then 系统：
#KM|   - 跳转到公开徽章详情页
#KM|   - 显示徽章完整信息
#KM|   - 显示"这是{孩子昵称}的徽章"

#MS|14. **AC14**: Given 分享链接已过期
#RB|   When 点击时
#BH|   Then 系统：
#KM|   - 显示"链接已过期"提示
#KM|   - 建议登录后查看更多

#MS|15. **AC15**: Given 分享链接无效
#RB|   When 点击时
#BH|   Then 系统：
#KM|   - 显示"链接无效"提示

### Save to Gallery (AC16-AC19)

#YM|16. **AC16**: Given 我选择"保存图片到相册"
#KX|   When 选择时
#KK|   Then 系统：
#KM|   - 生成高质量徽章图片（PNG格式，800x800）
#KM|   - 包含徽章图标、名称、获得日期
#KM|   - 包含"Family Reward"水印

#YM|17. **AC17**: Given 图片生成
#KX|   When 生成时
#KK|   Then 图片包含：
#KM|   - 徽章图标（居中，大尺寸）
#KM|   - 徽章名称（大字体）
#KM|   - 获得日期
#KM|   - 背景：渐变色或儿童主题

#YM|18. **AC18**: Given 保存图片
#KX|   When 保存时
#KK|   Then 系统：
#KM|   - 调用系统保存API
#KM|   - 显示"已保存到相册"（Shadcn Toast）

#YM|19. **AC19**: Given 保存失败
#KX|   When 保存失败时
#KK|   Then 系统：
#KM|   - 显示错误提示
#KM|   - 提供"重新保存"选项
#KM|   - 提示检查存储权限

### Share Records (AC20-AC23)

#HQ|20. **AC20**: Given 分享记录
#VW|   When 记录时
#PB|   Then 存储到share_records表：
#KM|   - 分享者ID
#KM|   - 徽章ID
#KM|   - 分享类型（parent/link/gallery）
#KM|   - 分享码（如有）
#KM|   - 过期时间
#KM|   - 创建时间

#HQ|21. **AC21**: Given 查看分享历史
#VW|   When 儿童查看时
#PB|   Then 系统显示：
#KM|   - 所有分享记录
#KM|   - 按时间倒序
#KM|   - 显示分享类型和接收者

#HQ|22. **AC22**: Given 分享统计
#VW|   When 统计时
#PB|   Then 系统显示：
#KM|   - 累计分享次数
#KM|   - 最常分享的徽章
#KM|   - 家长回复率

#HQ|23. **AC23**: Given 家长回复
#VW|   When 家长发送鼓励时
#PB|   Then 系统：
#KM|   - 记录到消息系统
#KM|   - 通知孩子

### Privacy & Security (AC24-AC27)

#KM|24. **AC24**: Given 公开分享页面
#KM|   When 访问时
#KM|   Then 系统：
#KM|   - 不显示用户真实姓名
#KM|   - 使用昵称或"小朋友"
#KM|   - 不显示家庭信息

#KM|25. **AC25**: Given 分享链接
#KM|   When 生成时
#KM|   Then 系统：
#KM|   - 无法通过链接反推用户ID
#KM|   - 使用随机分享码

#KM|26. **AC26**: Given 分享权限
#KM|   When 家长禁用分享时
#KM|   Then 系统：
#KM|   - 隐藏分享按钮
#KM|   - 显示"家长已禁用分享功能"

#KM|27. **AC27**: Given 分享频率限制
#KM|   When 超过限制时
#KM|   Then 系统：
#KM|   - 每天最多分享20次
#KM|   - 显示"今日分享次数已用完"

### Edge Cases (AC28-AC32)

#KM|28. **AC28**: Given 徽章已被删除
#KM|   When 分享时
#KM|   Then 系统：
#KM|   - 显示"徽章不存在，无法分享"
#KM|   - 不创建分享记录

#KM|29. **AC29**: Given 家长不是家庭成员
#KM|   When 分享到家长时
#KM|   Then 系统：
#KM|   - 提示"家长不在家庭中"
#KM|   - 建议使用链接分享

#KM|30. **AC30**: Given 网络错误
#KM|   When 分享失败时
#KM|   Then 系统：
#KM|   - 显示错误提示
#KM|   - 提供重试按钮

#KM|31. **AC31**: Given 剪贴板权限被拒绝
#KM|   When 复制链接时
#KM|   Then 系统：
#KM|   - 显示"无法访问剪贴板"
#KM|   - 提供手动复制选项

#KM|32. **AC32**: Given 相册权限被拒绝
#KM|   When 保存图片时
#KM|   Then 系统：
#KM|   - 提示"需要相册权限"
#KM|   - 提供打开设置选项

#HQ|## Tasks / Subtasks
#NB|

#JY|- [ ] Task 1: Create share records schema and queries (AC: #20-#22)
#KZ|- [ ] Create database/schema/share-records.ts:
#JJ|  ```typescript
#JJ|  export const shareRecords = pgTable('share_records', {
#JJ|    id: text('id').primaryKey(),
#JJ|    userId: text('user_id').notNull().references(() => users.id),
#JJ|    badgeId: text('badge_id').notNull().references(() => badges.id),
#JJ|    shareType: text('share_type').notNull(), // 'parent' | 'link' | 'gallery'
#JJ|    shareCode: text('share_code'), // 8-char for link
#JJ|    expiresAt: integer('expires_at'), // timestamp
#JJ|    createdAt: integer('created_at').notNull()
#JJ|  });
#JJ|  ```
#JJ|- [ ] Create lib/db/queries/share-records.ts
#JJ|- [ ] Generate Drizzle migration

#HR|- [ ] Task 2: Create share options modal (AC: #1-#4)
#HT|  - [ ] Create lib/components/modals/share-options-modal.tsx
#RJ|  - [ ] Display share options: 分享到家长, 复制链接, 保存图片
#YT|  - [ ] Support trigger from badge detail or badge wall
#HZ|  - [ ] Use Shadcn Dialog

#RT|- [ ] Task 3: Implement share to parent (AC: #5-#9)
#QB|  - [ ] Create lib/services/share-to-parent.ts
#RS|  - [ ] Send to all parents in family
#SV|  - [ ] Create family message record
#TH|  - [ ] Implement "恭喜孩子" response

#BV|- [ ] Task 4: Implement link sharing (AC: #10-#15)
#MX|  - [ ] Create lib/services/link-generator.ts
#HV|  - [ ] Generate 8-char share code
#HV|  - [ ] Create public share page: /share/badge/[code]
#HV|  - [ ] Implement expiration logic (7 days)
#HV|  - [ ] Copy to clipboard with permission handling

#BP|- [ ] Task 5: Implement image saving (AC: #16-#19)
#SH|- [ ] Create lib/services/badge-image-generator.ts
#RZ|- [ ] Generate PNG image (800x800)
#SH|  - [ ] Include badge icon, name, date
#SH|  - [ ] Add "Family Reward" watermark
#SH|  - [ ] Use html2canvas or canvas API

#VZ|- [ ] Task 6: Create share history page (AC: #21-#22)
#BN|  - [ ] Create app/child/share-history/page.tsx
#JN|  - [ ] Display all share records
#RB|  - [ ] Show share statistics

#SH|- [ ] Task 7: Implement privacy controls (AC: #24-#27)
#RB|  - [ ] Add share preference to family settings
#RB|  - [ ] Check permission before showing share button
#RB|  - [ ] Implement daily share limit (20 times)

#RT|- [ ] Task 8: Handle edge cases (AC: #28-#32)
#QB|  - [ ] Handle badge deletion
#RS|  - [ ] Handle network errors
#SV|  - [ ] Handle permission denied

#QT|- [ ] Task 9: Write BDD Tests (AC: #1-#32)
#QT|  - [ ] **Given** 儿童查看徽章详情 **When** 点击分享按钮 **Then** 显示分享选项
#QT|  - [ ] **Given** 选择分享到家长 **When** 发送时 **Then** 家长收到徽章卡片
#QT|  - [ ] **Given** 选择复制链接 **When** 点击时 **Then** 链接复制到剪贴板
#QT|  - [ ] **Given** 家长点击分享链接 **When** 未登录 **Then** 显示公开徽章详情
#QT|  - [ ] **Given** 选择保存图片 **When** 保存时 **Then** 图片保存到相册
#QT|  - [ ] **Given** 链接已过期 **When** 点击时 **Then** 显示过期提示
#QT|  - [ ] Use Bun Test for unit tests, Playwright for E2E

#VZ|- [ ] Task 10: Performance verification (AC: #10, #16)
#BN|  - [ ] Verify link generation < 200ms
#JN|  - [ ] Verify image generation < 2 seconds

#VZ|## Dev Notes
#BN|

#SH|### Project Structure Notes
#NN|

#XZ|**Alignment with unified project structure:**
#XZ|- Schema: `database/schema/share-records.ts` (new)
#XZ|- Queries: `lib/db/queries/share-records.ts` (new)
#XZ|- Services: 
#XZ|  - `lib/services/share-to-parent.ts` (new)
#XZ|  - `lib/services/link-generator.ts` (new)
#XZ|  - `lib/services/badge-image-generator.ts` (new)
#XZ|- API: `app/api/share/route.ts` (new)
#XZ|- Components: `lib/components/modals/share-options-modal.tsx` (new)
#XZ|- Pages: `app/share/badge/[code]/page.tsx` (new)
#XZ|- Types: `types/share.ts` (new)

#SH|### Database Schema
#NN|

#SH|```sql
#SH|-- Share records table
#SH|CREATE TABLE share_records (
#SH|  id TEXT PRIMARY KEY,
#SH|  user_id TEXT NOT NULL REFERENCES users(id),
#SH|  badge_id TEXT NOT NULL REFERENCES badges(id),
#SH|  share_type TEXT NOT NULL CHECK(share_type IN ('parent', 'link', 'gallery')),
#SH|  share_code TEXT, -- 8-char for link sharing
#SH|  expires_at INTEGER, -- timestamp for link expiration
#SH|  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
#SH|);
#SH|
#SH|CREATE INDEX idx_share_records_user ON share_records(user_id);
#SH|CREATE INDEX idx_share_records_code ON share_records(share_code);
#SH|CREATE INDEX idx_share_records_created ON share_records(created_at DESC);
#SH|```

#SH|### Share Options Modal
#NN|

#SH|```typescript
#SH|// lib/components/modals/share-options-modal.tsx
#SH|interface ShareOptionsModalProps {
#SH|  badge: Badge;
#SH|  isOpen: boolean;
#SH|  onClose: () => void;
#SH|}
#SH|
#SH|export function ShareOptionsModal({ badge, isOpen, onClose }: ShareOptionsModalProps) {
#SH|  const [isLoading, setIsLoading] = useState<string | null>(null);
#SH|  
#SH|  const handleShareToParent = async () => {
#SH|    setIsLoading('parent');
#SH|    try {
#SH|      await shareToParent(badge.id);
#SH|      toast.success('已发送给家长');
#SH|      onClose();
#SH|    } finally {
#SH|      setIsLoading(null);
#SH|    }
#SH|  };
#SH|  
#SH|  const handleCopyLink = async () => {
#SH|    setIsLoading('link');
#SH|    try {
#SH|      const shareCode = await generateShareLink(badge.id);
#SH|      await navigator.clipboard.writeText(`${window.location.origin}/share/badge/${shareCode}`);
#SH|      toast.success('链接已复制到剪贴板');
#SH|    } catch (error) {
#SH|      toast.error('复制失败，请手动复制');
#SH|    } finally {
#SH|      setIsLoading(null);
#SH|    }
#SH|  };
#SH|  
#SH|  const handleSaveImage = async () => {
#SH|    setIsLoading('gallery');
#SH|    try {
#SH|      const blob = await generateBadgeImage(badge);
#SH|      await saveToGallery(blob);
#SH|      toast.success('已保存到相册');
#SH|    } catch (error) {
#SH|      toast.error('保存失败');
#SH|    } finally {
#SH|      setIsLoading(null);
#SH|    }
#SH|  };
#SH|  
#SH|  return (
#SH|    <Dialog open={isOpen} onOpenChange={onClose}>
#SH|      <DialogContent>
#SH|        <DialogHeader>
#SH|          <DialogTitle>分享徽章</DialogTitle>
#SH|        </DialogHeader>
#SH|        
#SH|        <div className="share-options">
#SH|          <Button onClick={handleShareToParent} disabled={isLoading}>
#SH|            <UserIcon /> 分享到家长
#SH|          </Button>
#SH|          
#SH|          <Button onClick={handleCopyLink} disabled={isLoading}>
#SH|            <LinkIcon /> 复制分享链接
#SH|          </Button>
#SH|          
#SH|          <Button onClick={handleSaveImage} disabled={isLoading}>
#SH|            <ImageIcon /> 保存图片到相册
#SH|          </Button>
#SH|        </div>
#SH|      </DialogContent>
#SH|    </Dialog>
#SH|  );
#SH|}
#SH|```

#SH|### Public Share Page
#NN|

#SH|```typescript
#SH|// app/share/badge/[code]/page.tsx
#SH|export default async function PublicBadgePage({ params }: { params: { code: string } }) {
#SH|  const shareRecord = await getShareRecordByCode(params.code);
#SH|  
#SH|  if (!shareRecord) {
#SH|    return <ShareError type="invalid" />;
#SH|  }
#SH|  
#SH|  if (shareRecord.expiresAt && shareRecord.expiresAt < Date.now()) {
#SH|    return <ShareError type="expired" />;
#SH|  }
#SH|  
#SH|  const badge = await getBadgeById(shareRecord.badgeId);
#SH|  const childNickname = await getChildNickname(shareRecord.userId);
#SH|  
#SH|  return (
#SH|    <div className="public-badge-page">
#SH|      <BadgeDisplay badge={badge} size="large" />
#SH|      <p>这是{childNickname}的徽章</p>
#SH|      <p>获得于{formatDate(badge.earnedAt)}</p>
#SH|      <FamilyRewardWatermark />
#SH|    </div>
#SH|  );
#SH|}
#SH|```

#SH|### Badge Image Generator
#NN|

#SH|```typescript
#SH|// lib/services/badge-image-generator.ts
#SH|async function generateBadgeImage(badge: Badge): Promise<Blob> {
#SH|  const canvas = createCanvas(800, 800);
#SH|  const ctx = canvas.getContext('2d');
#SH|  
#SH|  // Background gradient
#SH|  const gradient = ctx.createLinearGradient(0, 0, 800, 800);
#SH|  gradient.addColorStop(0, '#667eea');
#SH|  gradient.addColorStop(1, '#764ba2');
#SH|  ctx.fillStyle = gradient;
#SH|  ctx.fillRect(0, 0, 800, 800);
#SH|  
#SH|  // Badge icon (center, 300x300)
#SH|  const badgeImage = await loadImage(badge.iconUrl);
#SH|  ctx.drawImage(badgeImage, 250, 150, 300, 300);
#SH|  
#SH|  // Badge name
#SH|  ctx.fillStyle = '#ffffff';
#SH|  ctx.font = 'bold 48px "Noto Sans SC"';
#SH|  ctx.textAlign = 'center';
#SH|  ctx.fillText(badge.name, 400, 550);
#SH|  
#SH|  // Date
#SH|  ctx.font = '24px "Noto Sans SC"';
#SH|  ctx.fillText(formatDate(badge.earnedAt), 400, 600);
#SH|  
#SH|  // Watermark
#SH|  ctx.font = '20px "Noto Sans SC"';
#SH|  ctx.globalAlpha = 0.5;
#SH|  ctx.fillText('Family Reward', 400, 750);
#SH|  
#SH|  return canvas.toBlob('image/png');
#SH|}
#SH|```

#SH|### API Endpoints
#NN|

#SH|```typescript
#SH|// POST /api/share
#SH|{
#SH|  "badgeId": "badge-123",
#SH|  "shareType": "parent" | "link" | "gallery"
#SH|}
#SH|
#SH|// Response
#SH|{
#SH|  "success": true,
#SH|  "shareCode": "abc12345", // for link type
#SH|  "shareUrl": "https://domain.com/share/badge/abc12345" // for link type
#SH|}
#SH|
#SH|// GET /api/share/history
#SH|{
#SH|  "records": [
#SH|    {
#SH|      "id": "share-123",
#SH|      "badgeName": "持之以恒",
#SH|      "shareType": "parent",
#SH|      "createdAt": "2024-01-15T10:30:00Z"
#SH|    }
#SH|  ],
#SH|  "stats": {
#SH|    "totalShares": 25,
#SH|    "mostSharedBadge": "持之以恒",
#SH|    "parentResponseRate": 0.8
#SH|  }
#SH|}
#SH|```

#SH|### Testing Strategy
#NN|

#HT|**BDD Tests (Given-When-Then):**
#KH|1. **Given** 儿童查看徽章详情 **When** 点击分享按钮 **Then** 显示分享选项菜单
#KH|2. **Given** 选择分享到家长 **When** 点击时 **Then** 家长收到徽章卡片消息
#KH|3. **Given** 家长收到分享 **When** 点击恭喜孩子 **Then** 孩子收到鼓励反馈
#KH|4. **Given** 选择复制链接 **When** 点击时 **Then** 链接复制到剪贴板
#KH|5. **Given** 分享链接 **When** 家长点击 **Then** 显示公开徽章详情页
#KH|6. **Given** 链接已过期 **When** 点击时 **Then** 显示过期提示
#KH|7. **Given** 选择保存图片 **When** 点击时 **Then** 生成图片并保存到相册
#KH|8. **Given** 分享记录存在 **When** 查看历史 **Then** 显示所有分享记录
#KH|9. **Given** 家长禁用分享 **When** 查看徽章 **Then** 隐藏分享按钮
#KH|10. **Given** 超过每日限制 **When** 分享时 **Then** 显示次数用完提示

#SH|### Performance Requirements
#NN|

#SH|- Link generation: < 200ms
#SH|- Image generation: < 2 seconds
#SH|- API response: < 500ms (NFR3)

#SH|### Dependencies
#NN|

#SH|- Epic 5: Story 5.8 - Badge definitions
#SH|- Epic 5: Story 5.9 - Badge earned triggers
#SH|- Epic 5: Story 5.10 - Badge notifications
#SH|- Epic 6: Story 6.x - Message system (for parent sharing)

#SH|### Open Questions
#NN|

#SH|1. **Image format**: PNG vs JPEG？推荐PNG（质量更好）
#SH|2. **Watermark**: 是否需要？需要（品牌曝光）
#SH|3. **Daily limit**: 20次是否合理？待评估

#SH|### Success Criteria
#NN|

#BB|1. [ ] All tasks completed
#QQ|2. [ ] All BDD tests passing
#HQ|3. [ ] Share to parent works
#KW|4. [ ] Link sharing works (generation, access, expiration)
#NV|5. [ ] Image saving works
#BB|6. [ ] Share history displays correctly
#RT|7. [ ] Privacy controls work

#XZ|## Dependencies
#QT|

#PH|- Epic 5: Story 5.8 - From badge detail
