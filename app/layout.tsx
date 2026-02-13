import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Family Reward - 家庭行为管理游戏平台',
  description: '通过量化日常行为、游戏化积分系统、愿望兑换，帮助孩子养成好习惯',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
