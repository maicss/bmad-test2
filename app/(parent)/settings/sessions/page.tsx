'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Session {
  id: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
  device_id: string;
  user_agent: string;
  ip_address: string;
  last_activity_at: string;
  expires_at: string;
  remember_me: boolean;
  is_current: boolean;
}

interface DeviceTypeIcon {
  mobile: string;
  tablet: string;
  desktop: string;
}

const DEVICE_ICONS: DeviceTypeIcon = {
  mobile: '📱',
  tablet: '📲',
  desktop: '💻',
};

const DEVICE_TYPE_LABELS: Record<string, string> = {
  mobile: '手机',
  tablet: '平板',
  desktop: '电脑',
};

/**
 * Active Sessions Management Page
 *
 * Story 1.6 Task 8 - Active sessions management UI
 *
 * Parents can view and manage all active login sessions
 * Features:
 * - View all active sessions with device info
 * - See current session highlighted
 * - Logout from specific device
 * - Logout from all devices
 *
 * AC #5: 家长可以在账号设置中查看所有活跃的登录会话，包括设备类型、最后活动时间、当前 IP 地址
 */
export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/sessions');

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
      } else {
        const data = await response.json();
        setError(data.error || '获取会话列表失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    if (!confirm('确定要退出此设备吗？')) {
      return;
    }

    try {
      setActionLoading(sessionId);
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadSessions();
      } else {
        const data = await response.json();
        alert(data.error || '退出设备失败');
      }
    } catch (err) {
      alert('网络错误，请稍后重试');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm('确定要退出所有设备吗？您将需要重新登录。')) {
      return;
    }

    try {
      setActionLoading('all');
      const response = await fetch('/api/auth/sessions', {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('已退出所有设备，正在跳转到登录页...');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        const data = await response.json();
        alert(data.error || '退出所有设备失败');
      }
    } catch (err) {
      alert('网络错误，请稍后重试');
    } finally {
      setActionLoading(null);
    }
  };

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`;
    return `${Math.floor(diffMins / 1440)}天前`;
  };

  const formatExpiresAt = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffHours < 1) return '即将过期';
    if (diffHours < 24) return `${diffHours}小时后过期`;
    return `${Math.floor(diffHours / 24)}天后过期`;
  };

  const getDeviceIcon = (deviceType: string) => {
    return DEVICE_ICONS[deviceType as keyof DeviceTypeIcon] || '💻';
  };

  const getDeviceLabel = (deviceType: string) => {
    return DEVICE_TYPE_LABELS[deviceType] || '未知设备';
  };

  const getUserAgentSummary = (userAgent: string) => {
    // Parse user-agent to show readable browser info
    const ua = userAgent.toLowerCase();

    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('edg')) return 'Edge';
    if (ua.includes('iphone')) return 'iPhone';
    if (ua.includes('ipad')) return 'iPad';
    if (ua.includes('android')) return 'Android';

    return '未知浏览器';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-500">加载中...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            活跃会话
          </h1>
          <p className="text-gray-600">
            管理您所有已登录的设备
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">没有活跃的会话</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`bg-white rounded-lg shadow p-6 ${
                  session.is_current ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Device Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">
                        {getDeviceIcon(session.device_type)}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getDeviceLabel(session.device_type)}
                        </h3>
                        {session.is_current && (
                          <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            当前设备
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Session Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">浏览器</p>
                        <p className="text-gray-900">
                          {getUserAgentSummary(session.user_agent)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">IP 地址</p>
                        <p className="text-gray-900">{session.ip_address}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">最后活动</p>
                        <p className="text-gray-900">
                          {formatLastActivity(session.last_activity_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">过期时间</p>
                        <p className="text-gray-900">
                          {formatExpiresAt(session.expires_at)}
                        </p>
                      </div>
                    </div>

                    {/* Session Tags */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {session.remember_me && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          已记住（7天）
                        </span>
                      )}
                      {session.device_type === 'mobile' && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                          移动设备
                        </span>
                      )}
                      {session.device_type === 'desktop' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          桌面设备
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!session.is_current && (
                    <div className="ml-4">
                      <button
                        onClick={() => handleLogoutSession(session.id)}
                        disabled={actionLoading === session.id}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 transition-colors"
                      >
                        {actionLoading === session.id ? '退出中...' : '退出设备'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Logout All Button */}
            {sessions.length > 1 && (
              <div className="mt-6 bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      退出所有设备
                    </h3>
                    <p className="text-sm text-gray-600">
                      这将退出所有设备，包括当前设备
                    </p>
                  </div>
                  <button
                    onClick={handleLogoutAll}
                    disabled={actionLoading === 'all'}
                    className="px-6 py-3 bg-red-500 text-white font-semibold rounded hover:bg-red-600 disabled:bg-gray-400 transition-colors"
                  >
                    {actionLoading === 'all' ? '退出中...' : '退出所有设备'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8">
          <button
            onClick={() => router.back()}
            className="text-primary hover:underline"
          >
            ← 返回设置
          </button>
        </div>
      </div>
    </div>
  );
}
