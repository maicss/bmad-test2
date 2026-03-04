# Story 5.9: Badge Earned Celebration Animation
# Status: ready-for-dev

## Story

As a 系统,
I want 在儿童获得徽章时播放庆祝动画,
So that 增强儿童的成就感和愉悦感，强化正向行为。

## Acceptance Criteria

### Animation Trigger (AC1-AC2)

1. Given 儿童完成满足徽章条件的动作
   When 系统检测到徽章条件达成时
   Then 页面立即显示庆祝动画
   - 不等待页面刷新
   - 不延迟显示
   And 优先级高于其他通知

2. Given 徽章条件在后台达成
   When 应用在后台运行时
   Then 不显示动画
   And 只发送徽章获得通知
   And 用户回到前台后显示"获得新徽章"Badge提示

### Animation Display (AC3-AC6)

3. Given 动画显示时
   When 动画开始时
   Then 系统显示：
   - 全屏半透明遮罩（0.7透明度，黑色）
   - 彩色纸屑从顶部飘落（confetti效果）
   - 徽章图标从中心放大出现
   - 金色光芒从徽章散发
   - "恭喜获得徽章！"标题（金色大字）
   - 徽章名称显示（下方）
   - And 动画层级最高（覆盖所有UI）

4. Given 徽章图标动画
   When 实现时
   Then 使用Framer Motion实现：
   - 初始状态：scale(0), opacity(0)
   - 动画序列：
     - 0-0.5s: scale(0) → scale(1.2), opacity(1)（放大出现）
     - 0.5-1.0s: scale(1.2) → scale(1.0)（收缩到正常）
     - 持续：轻微脉动效果（scale 1.0 ↔ 1.05）
   - 旋转效果：360度旋转（持续2s）
   - And 总时长：3秒

5. Given 纸屑效果
   When 实现时
   Then 系统显示：
   - 粒子数量：100-150个
   - 粒子形状：圆、方、三角、星形、心形
   - 粒子颜色：金(#FFD700)、红(#FF6B6B)、橙(#FFA500)、绿(#4CAF50)、蓝(#2196F3)、紫(#9C27B0)
   - 飘落速度：随机（200-600px/s）
   - 旋转角度：随机（0-360度）
   - 初始位置：屏幕顶部（y: -50px，x: 0-100%随机）
   - 结束位置：屏幕底部（y: height + 50px）
   And 使用Canvas或CSS动画实现

6. Given 金色光芒效果
   When 实现时
   Then 系统显示：
   - 徽章周围的光环（box-shadow）
   - 光环颜色：金(#FFD700)
   - 光环半径：从20px扩展到80px
   - 动画：expand(0.5s) → fade(1.5s) → disappear
   - 重复：2次
   And 使用CSS keyframes或Framer Motion

### Multiple Badges (AC7-AC9)

7. Given 同时获得多个徽章
   When 多个徽章条件同时达成时
   Then 依次显示每个徽章动画
   - 第1个徽章动画结束后
   - 等待1秒
   - 显示第2个徽章动画
   - 以此类推
   And 徽章按重要性或类别排序

8. Given 多个徽章动画播放
   When 全部播放完成后
   Then 显示汇总动画：
   - "恭喜获得X个新徽章！"
   - 所有徽章缩略图网格显示
   - "查看徽章"按钮
   And 汇总动画持续3秒

9. Given 用户不想等待多个徽章动画
   When 点击"跳过"按钮
   Then 立即结束所有动画
   - 显示汇总动画
   - 或直接跳转到徽章页面

### Animation Controls (AC10-AC11)

10. Given 动画播放时
    When 显示动画时
    Then 提供"跳过"按钮：
    - 位于右下角
    - 按钮文字："跳过"
    - 灰色按钮
    - And 点击可立即结束动画

11. Given 动画播放完成
    When 动画自然结束
    Then 动画元素淡出：
    - 遮罩opacity: 1 → 0（0.5s）
    - 徽章scale: 1 → 0（0.5s）
    - 纸屑fade out（0.5s）
    And 页面恢复正常显示

### Badge Detail Integration (AC12-AC13)

12. Given 动画播放完成后
    When 自动跳转时
    Then 系统跳转到徽章页面
    - 定位到刚获得的徽章
    - 高亮显示该徽章（金色边框脉动）
    - 显示徽章详情弹窗
    And 用户可以查看徽章详情

13. Given 用户不想自动跳转
    When 动画播放时
    Then 可以点击"稍后查看"按钮
    - 按钮位于左下角
    - 关闭动画
    - 不跳转到徽章页面
    - 显示"徽章已保存，稍后可在徽章页面查看"Toast

### Audio Effects (AC14-AC15)

14. Given 动画播放时
    When 徽章出现时
    Then 播放成功音效：
    - 音效名称："badge_earned.mp3"
    - 音效时长：1-2秒
    - 音效风格：欢快、鼓励
    - 音量：适中（不刺耳）
    And 音效与视觉动画同步

15. Given 用户禁用音效
    When 系统设置中关闭音效
    Then 不播放音效
    And 只显示视觉动画

### Performance and Optimization (AC16-AC18)

16. Given 动画播放
    When 动画运行时
    Then 保持流畅帧率（60fps）
    - 使用requestAnimationFrame
    - 使用transform和opacity（GPU加速）
    - 避免频繁的DOM操作
    And 不卡顿

17. Given 纸屑粒子动画
    When 实现时
    Then 优化性能：
    - 使用Canvas绘制（比DOM节点更高效）
    - 限制粒子数量（最多150个）
    - 使用对象池复用粒子
    - 超出屏幕的粒子立即移除
    And 内存占用 < 50MB

18. Given 动画在低端设备上
    When 检测到设备性能不足时
    Then 降低动画复杂度：
    - 减少粒子数量（50个）
    - 禁用光芒效果
    - 缩短动画时长（2秒）
    - 禁用旋转动画
    And 根据设备性能自动调整

### Error Handling (AC19-AC20)

19. Given 动画加载失败
    When 徽章图片或音效加载失败
    Then 降级显示：
    - 使用默认徽章图标
    - 不显示音效
    - 显示"获得徽章！"简单通知
    And 不中断用户体验

20. Given 动画播放异常
    当发生JavaScript错误
    Then 捕获错误并记录日志
    - 关闭动画
    - 显示"获得徽章！"通知
    - 不影响应用继续运行
    And 发送错误报告给开发团队

## Tasks / Subtasks

- [ ] Task 1: Create badge checker service (AC: #1, #7)
  - [ ] Create lib/services/badge-checker.ts
  - [ ] Implement checkAndAwardBadges(userId, actionType)
  - [ ] Implement getEarnedBadges(userId)
  - [ ] Implement checkBadgeCondition(badge, userData)
  - [ ] Implement awardBadge(userId, badgeId, reason)
  - [ ] Add badge trigger points (task, points, checkin, wish)

- [ ] Task 2: Create celebration animation components (AC: #3-#6)
  - [ ] Create components/features/badge/celebration-overlay.tsx
    - Full-screen overlay with backdrop blur
    - Confetti canvas
    - Badge icon display with animation
    - Golden glow effect
    - Congratulation text
  - [ ] Create components/features/badge/confetti-canvas.tsx
    - Particle system
    - Shape rendering
    - Animation loop
    - Performance optimization
  - [ ] Create components/features/badge/badge-reveal.tsx
    - Scale animation
    - Rotation animation
    - Pulse effect
  - [ ] Create components/features/badge/golden-glow.tsx
    - Box-shadow animation
    - Expand and fade effect
  - [ ] Use Framer Motion for animations

- [ ] Task 3: Create BadgeEarnedModal (AC: #3-#6, #10-#13)
  - [ ] Create components/features/badge/badge-earned-modal.tsx
  - [ ] Combine all animation components
  - [ ] Implement skip button
  - [ ] Implement "view later" button
  - [ ] Implement auto-redirect to badge page
  - [ ] Handle multiple badges queue

- [ ] Task 4: Implement badge audio (AC: #14-#15)
  - [ ] Add audio files to public/badges/
  - [ ] badge_earned.mp3 (success sound)
  - [ ] Implement audio player
  - [ ] Respect user's sound settings
  - [ ] Sync audio with visual animation

- [ ] Task 5: Integrate badge checker (AC: #1)
  - [ ] After task completion (Epic 2)
    - Call checkAndAwardBadges(userId, 'task')
  - [ ] After points change (Epic 3)
    - Call checkAndAwardBadges(userId, 'points')
  - [ ] After check-in (Story 5.7)
    - Call checkAndAwardBadges(userId, 'checkin')
  - [ ] After wish redemption (Epic 4)
    - Call checkAndAwardBadges(userId, 'wish')

- [ ] Task 6: Handle multiple badges (AC: #7-#9)
  - [ ] Create badge queue system
  - [ ] Sequential animations
  - [ ] Summary animation at end
  - [ ] Skip all functionality

- [ ] Task 7: Performance optimization (AC: #16-#18)
  - [ ] Use Canvas for confetti
  - [ ] Object pooling for particles
  - [ ] GPU-accelerated animations (transform, opacity)
  - [ ] Device detection for quality settings
  - [ ] Performance monitoring

- [ ] Task 8: Error handling (AC: #19-#20)
  - [ ] Fallback for failed image loads
  - [ ] Graceful degradation for audio
  - [ ] Error boundary for animation component
  - [ ] Error logging and reporting

- [ ] Task 9: Write BDD tests (All ACs)
  - [ ] Test badge trigger on task completion
  - [ ] Test animation display
  - [ ] Test multiple badges queue
  - [ ] Test skip button
  - [ ] Test auto-redirect
  - [ ] Test audio sync
  - [ ] Test performance (60fps)
  - [ ] Test error handling
  - [ ] Test background behavior

## Dev Notes

### Animation Components

```typescript
// components/features/badge/celebration-overlay.tsx
import { motion, AnimatePresence } from 'framer-motion';

export function BadgeCelebrationOverlay({
  badges,
  onComplete,
  onSkip
}: CelebrationProps) {
  return (
    <AnimatePresence>
      {badges.map((badge, index) => (
        <motion.div
          key={badge.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: index * 4 }} // 4s per badge (3s animation + 1s gap)
        >
          <BadgeEarnedModal badge={badge} onSkip={onSkip} />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

// components/features/badge/badge-reveal.tsx
export function BadgeReveal({ badge }: { badge: Badge }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180, opacity: 0 }}
      animate={{
        scale: [0, 1.2, 1],
        rotate: [0, 360],
        opacity: [0, 1, 1]
      }}
      transition={{
        duration: 2,
        times: [0, 0.25, 1]
      }}
    >
      <BadgeIcon src={badge.iconUrl} alt={badge.name} size={200} />
      <GoldenGlow />
    </motion.div>
  );
}

// components/features/badge/golden-glow.tsx
export function GoldenGlow() {
  return (
    <>
      {[...Array(2)].map((_, i) => (
        <motion.div
          key={i}
          className="golden-glow"
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{
            scale: [0.5, 2, 3],
            opacity: [0.8, 0.4, 0]
          }}
          transition={{
            duration: 2,
            delay: i * 1.5
          }}
        />
      ))}
    </>
  );
}
```

### Confetti Particle System

```typescript
// components/features/badge/confetti-canvas.tsx
import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 100;
const COLORS = ['#FFD700', '#FF6B6B', '#FFA500', '#4CAF50', '#2196F3', '#9C27B0'];
const SHAPES = ['circle', 'square', 'triangle', 'star', 'heart'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  shape: string;
  size: number;
}

export function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize particles
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: -50,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 4 + 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      size: Math.random() * 10 + 5
    }));

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach(particle => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;

        // Draw particle
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        ctx.fillStyle = particle.color;
        drawShape(ctx, particle.shape, particle.size);
        ctx.restore();

        // Reset particle if out of bounds
        if (particle.y > canvas.height + 50) {
          particle.y = -50;
          particle.x = Math.random() * canvas.width;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="confetti-canvas" />;
}

function drawShape(ctx: CanvasRenderingContext2D, shape: string, size: number) {
  switch (shape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'square':
      ctx.fillRect(-size, -size, size * 2, size * 2);
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size, size);
      ctx.lineTo(-size, size);
      ctx.closePath();
      ctx.fill();
      break;
    // ... other shapes
  }
}
```

### Badge Checker Integration

```typescript
// lib/services/badge-checker.ts
import { db } from '@/lib/db';
import { badges, userBadges } from '@/lib/db/schema';
import { eq, and, not, sql } from 'drizzle-orm';

export async function checkAndAwardBadges(
  userId: string,
  actionType: 'task' | 'points' | 'checkin' | 'wish'
): Promise<Badge[]> {
  const earnedBadges: Badge[] = [];

  // Get all badges
  const allBadges = await db.query.badges.findMany();

  // Get user data for condition checking
  const userData = await getUserData(userId);

  // Filter badges by action type
  const relevantBadges = allBadges.filter(badge => {
    switch (actionType) {
      case 'task':
        return badge.category === 'task' || badge.conditionType === 'consecutive_days';
      case 'points':
        return badge.category === 'points' || badge.conditionType === 'total_points';
      case 'checkin':
        return badge.category === 'checkin' || badge.conditionType === 'checkin_days';
      case 'wish':
        return badge.category === 'wish' || badge.conditionType === 'wishes_redeemed';
      default:
        return false;
    }
  });

  // Check each badge condition
  for (const badge of relevantBadges) {
    // Check if already earned
    const existing = await db.query.userBadges.findFirst({
      where: and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badge.id))
    });

    if (existing) continue;

    // Check condition
    const earned = await checkBadgeCondition(badge, userData);

    if (earned) {
      await awardBadge(userId, badge.id, `达成条件：${badge.description}`);
      earnedBadges.push(badge);
    }
  }

  // Trigger celebration if badges earned
  if (earnedBadges.length > 0) {
    triggerCelebration(earnedBadges);
  }

  return earnedBadges;
}

async function checkBadgeCondition(badge: Badge, userData: UserData): Promise<boolean> {
  switch (badge.conditionType) {
    case 'consecutive_days':
      return userData.maxStreak >= badge.conditionValue;
    case 'total_points':
      return userData.totalPoints >= badge.conditionValue;
    case 'checkin_days':
      return userData.checkInDays >= badge.conditionValue;
    case 'wishes_redeemed':
      return userData.wishesRedeemed >= badge.conditionValue;
    default:
      return false;
  }
}

async function awardBadge(userId: string, badgeId: string, reason: string) {
  await db.insert(userBadges).values({
    userId,
    badgeId,
    earnedReason: reason
  });
}

function triggerCelebration(badges: Badge[]) {
  // Emit event to trigger animation
  window.dispatchEvent(new CustomEvent('badge-earned', { detail: { badges } }));
}
```

### BDD Test Scenarios

```typescript
describe('Story 5.9: Badge Earned Celebration Animation', () => {
  it('given 儿童达成徽章条件，then 播放庆祝动画', async () => {
    // Given: 儿童连续完成7天任务
    const child = await createChild();
    for (let i = 0; i < 7; i++) {
      await completeAndApproveTask(child.id);
    }

    // When: 检查徽章
    const earnedBadges = await checkAndAwardBadges(child.id, 'task');

    // Then: 触发庆祝动画
    expect(earnedBadges).toHaveLength(1);
    expect(earnedBadges[0].name).toBe('持之以恒');
    
    const event = await waitForCustomEvent('badge-earned');
    expect(event.detail.badges).toHaveLength(1);
  });

  it('given 同时获得多个徽章，then 依次播放动画', async () => {
    // Given: 达成多个徽章条件
    const child = await createChild();
    // ... setup multiple conditions

    // When: 检查徽章
    const earnedBadges = await checkAndAwardBadges(child.id, 'task');

    // Then: 触发多个动画（依次播放）
    expect(earnedBadges.length).toBeGreaterThan(1);
    // 动画播放逻辑在组件中测试
  });

  it('given 动画播放时，then 可以跳过', async () => {
    // Given: 徽章动画正在播放
    const child = await createChildWithBadge();
    const wrapper = render(<BadgeCelebrationOverlay badges={[child.badge]} />);

    // When: 点击跳过按钮
    fireEvent.click(wrapper.getByText('跳过'));

    // Then: 动画立即结束
    await waitFor(() => {
      expect(wrapper.queryByTestId('celebration-overlay')).not.toBeInTheDocument();
    });
  });
});
```

### Components Structure

```
components/features/badge/
├── celebration-overlay.tsx    # Main overlay
├── badge-earned-modal.tsx     # Individual badge modal
├── badge-reveal.tsx           # Badge icon animation
├── golden-glow.tsx            # Glow effect
└── confetti-canvas.tsx        # Confetti particles
```

### Success Criteria

1. [ ] All tasks completed
2. [ ] All BDD tests passing
3. [ ] Badge trigger works correctly
4. [ ] Animation smooth (60fps)
5. [ ] Confetti effect looks good
6. [ ] Multiple badges handled
7. [ ] Skip button works
8. [ ] Auto-redirect works
9. [ ] Audio syncs with visual
10. [ ] Performance optimized (< 50MB)
11. [ ] Error handling robust
12. [ ] Code review passed

## Dependencies

- Epic 5: Story 5.8 - Badge definitions and showcase
- Epic 5: Story 5.10 - Notification after animation
- Epic 2: Task completion trigger
- Epic 3: Points change trigger
- Epic 5.7: Check-in trigger
- Epic 4: Wish redemption trigger
- Framer Motion - Animation library

## Dev Agent Record

### File List

**Files to Create:**
- lib/services/badge-checker.ts
- components/features/badge/celebration-overlay.tsx
- components/features/badge/badge-earned-modal.tsx
- components/features/badge/badge-reveal.tsx
- components/features/badge/golden-glow.tsx
- components/features/badge/confetti-canvas.tsx
- public/badges/badge_earned.mp3

**Files to Modify:**
- app/(child)/layout.tsx (listen for badge-earned event)
- lib/db/queries/badges.ts (add award queries)
