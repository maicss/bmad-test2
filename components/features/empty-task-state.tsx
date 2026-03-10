/**
 * Empty Task State Component
 *
 * Story 2.8: Child Views Today's Task List
 * Task 10: 实现错误处理和用户反馈
 *
 * 显示友好的空状态提示
 * - 鼓励性文案
 * - 游戏化设计
 * - 行动引导
 */

interface EmptyTaskStateProps {
  message?: string;
  onRefresh?: () => void;
}

export function EmptyTaskState({
  message = '今天没有任务，去玩吧！',
  onRefresh,
}: EmptyTaskStateProps) {
  const encouragementMessages = [
    { emoji: '🎉', text: '太棒了！今天没有任务！' },
    { emoji: '🌈', text: '休息时间，尽情玩耍！' },
    { emoji: '⭐', text: '你做得很棒！' },
    { emoji: '☀️', text: '享受美好的一天！' },
  ];

  const randomMessage = encouragementMessages[
    Math.floor(Math.random() * encouragementMessages.length)
  ];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* 大型emoji */}
      <div className="text-8xl mb-6 animate-bounce">
        {randomMessage.emoji}
      </div>

      {/* 鼓励文字 */}
      <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
        {randomMessage.text}
      </h3>

      <p className="text-lg text-gray-600 mb-8 text-center">
        {message}
      </p>

      {/* 刷新按钮（如果提供） */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors text-lg font-medium"
        >
          刷新
        </button>
      )}

      {/* 装饰性元素 */}
      <div className="mt-8 flex gap-4 text-4xl">
        <span className="animate-pulse">🎮</span>
        <span className="animate-pulse" style={{ animationDelay: '100ms' }}>🎨</span>
        <span className="animate-pulse" style={{ animationDelay: '200ms' }}>🎵</span>
        <span className="animate-pulse" style={{ animationDelay: '300ms' }}>⚽</span>
        <span className="animate-pulse" style={{ animationDelay: '700ms' }}>📚</span>
      </div>
    </div>
  );
}
