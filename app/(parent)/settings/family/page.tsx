'use client';

import { useState } from 'react';

/**
 * Family Settings Page
 *
 * Parent can manage family members and invite other parents
 *
 * Source: Story 1.4 Task 5 - Create invitation management UI pages
 */
export default function FamilySettingsPage() {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [invitations, setInvitations] = useState([
    {
      id: '1',
      phone: '138****0001',
      status: 'pending',
      created_at: '2026-02-26T08:00:00Z',
    },
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const familyMembers = [
    {
      id: '1',
      name: '张三（主要家长）',
      role: 'primary_parent',
      phone: '13800000001',
    },
    {
      id: '2',
      name: '李四（次要家长）',
      role: 'secondary_parent',
      phone: '13800000002',
    },
    {
      id: '3',
      name: '小明',
      role: 'child',
      phone: null,
    },
  ];

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // TODO: Implement invitation API call
    // For now, just simulate
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowInviteForm(false);
      setError('');
    }, 1000);
  };

  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 11) return phone;
    return `${phone.slice(0, 3)}****${phone.slice(7)}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">家庭设置</h1>
        <p className="mt-2 text-gray-600">
          管理家庭成员和邀请其他家长加入家庭
        </p>
      </div>

      {/* Family Members */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            家庭成员
          </h2>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {showInviteForm ? '取消邀请' : '邀请家长'}
          </button>
        </div>

        {/* Invite Form */}
        {showInviteForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              发送邀请
            </h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label htmlFor="invitePhone" className="block text-sm font-medium text-gray-700">
                  手机号
                </label>
                <input
                  id="invitePhone"
                  type="tel"
                  placeholder="请输入11位手机号"
                  pattern="[1][3-9]\d{9}"
                  maxLength={11}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 border"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '发送中...' : '发送邀请'}
              </button>
            </form>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-3">
          {familyMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {member.name}
                </p>
                <p className="text-xs text-gray-500">
                  {member.role === 'primary_parent' && '主要家长'}
                  {member.role === 'secondary_parent' && '次要家长'}
                  {member.role === 'child' && '儿童'}
                </p>
              </div>
              <div className="text-sm text-gray-600">
                {member.phone ? maskPhone(member.phone) : '无'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invitations Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          邀请记录
        </h2>

        {invitations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            暂无邀请记录
          </p>
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {maskPhone(invitation.phone)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(invitation.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {invitation.status === 'pending' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      待处理
                    </span>
                  )}
                  {invitation.status === 'accepted' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      已接受
                    </span>
                  )}
                  {invitation.status === 'expired' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      已过期
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
