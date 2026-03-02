'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

/**
 * Family Members Management Page
 *
 * Story 1.7: Primary Parent Manage Members
 *
 * Allows primary parent to:
 * - View all family members
 * - Suspend/resume child accounts
 * - Transfer primary parent role
 * - View member audit logs
 */

interface Member {
  id: string;
  name: string;
  phone: string;
  role: 'parent' | 'child';
  is_primary: boolean;
  is_suspended: boolean;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface AuditLog {
  id: string;
  action_type: string;
  metadata: string;
  ip_address: string;
  created_at: string;
}

export default function FamilyMembersPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [transferPassword, setTransferPassword] = useState('');
  const [transferTargetId, setTransferTargetId] = useState('');

  // Fetch family members on load
  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      const response = await fetch('/api/families/members');
      const data = await response.json();

      if (data.success) {
        setMembers(data.members);
      } else {
        toast({
          title: '加载失败',
          description: data.error || '无法加载家庭成员',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '加载失败',
        description: '网络错误，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSuspendMember(memberId: string) {
    if (!suspendReason.trim()) {
      toast({
        title: '请提供原因',
        description: '请输入挂起该账户的原因',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/families/members/${memberId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: suspendReason.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '账户已挂起',
          description: '该账户已被挂起，无法登录',
        });
        setShowSuspendDialog(false);
        setSuspendReason('');
        fetchMembers();
      } else {
        toast({
          title: '操作失败',
          description: data.error || '无法挂起账户',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '操作失败',
        description: '网络错误，请稍后重试',
        variant: 'destructive',
      });
    }
  }

  async function handleResumeMember(memberId: string) {
    try {
      const response = await fetch(`/api/families/members/${memberId}/resume`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '账户已恢复',
          description: '该账户已恢复，可以正常登录',
        });
        fetchMembers();
      } else {
        toast({
          title: '操作失败',
          description: data.error || '无法恢复账户',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '操作失败',
        description: '网络错误，请稍后重试',
        variant: 'destructive',
      });
    }
  }

  async function handleViewAuditLogs(member: Member) {
    try {
      const response = await fetch(`/api/families/members/${member.id}/audit-logs?limit=50`);
      const data = await response.json();

      if (data.success) {
        setAuditLogs(data.audit_logs);
        setSelectedMember(member);
        setShowAuditLogs(true);
      } else {
        toast({
          title: '加载失败',
          description: data.error || '无法加载审计日志',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '加载失败',
        description: '网络错误，请稍后重试',
        variant: 'destructive',
      });
    }
  }

  async function handleTransferPrimaryRole() {
    if (!transferPassword.trim()) {
      toast({
        title: '请输入密码',
        description: '请输入您的密码以确认操作',
        variant: 'destructive',
      });
      return;
    }

    if (!transferTargetId) {
      toast({
        title: '请选择家长',
        description: '请选择要将角色转移给哪位家长',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/families/members/transfer-primary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPrimaryId: transferTargetId,
          passwordConfirm: transferPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '角色转移成功',
          description: '主要家长角色已成功转移',
        });
        setShowTransferDialog(false);
        setTransferPassword('');
        setTransferTargetId('');
        router.push('/dashboard');
      } else {
        toast({
          title: '操作失败',
          description: data.error || '无法转移角色',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '操作失败',
        description: '网络错误，请稍后重试',
        variant: 'destructive',
      });
    }
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getRoleLabel(role: string): string {
    return role === 'parent' ? '家长' : '儿童';
  }

  function getRoleIcon(role: string): string {
    return role === 'parent' ? '👨‍👩‍👧' : '🧒';
  }

  function getStatusBadge(member: Member): JSX.Element {
    if (member.is_primary) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          主要家长
        </span>
      );
    }

    if (member.is_suspended) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          已挂起
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        活跃
      </span>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">家庭成员管理</h1>
          <p className="mt-2 text-gray-600">管理家庭成员、账户权限和角色</p>
        </div>

        {/* Actions */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setShowTransferDialog(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            转移主要家长角色
          </button>
        </div>

        {/* Members List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  成员
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getRoleIcon(member.role)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {member.name || '未设置姓名'}
                        </div>
                        <div className="text-sm text-gray-500">{member.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{getRoleLabel(member.role)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(member)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(member.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewAuditLogs(member)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      日志
                    </button>
                    {member.role === 'child' && (
                      <>
                        {member.is_suspended ? (
                          <button
                            onClick={() => handleResumeMember(member.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            恢复
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedMember(member);
                              setShowSuspendDialog(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            挂起
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {members.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">暂无家庭成员</p>
              <Link
                href="/settings/children"
                className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                添加成员
              </Link>
            </div>
          )}
        </div>

        {/* Suspend Dialog */}
        {showSuspendDialog && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">挂起账户</h2>
                <p className="text-gray-600 mb-4">
                  您确定要挂起 <strong>{selectedMember.name}</strong> 的账户吗？
                  挂起后该用户将无法登录。
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    挂起原因
                  </label>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入挂起原因..."
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowSuspendDialog(false);
                      setSuspendReason('');
                      setSelectedMember(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => handleSuspendMember(selectedMember.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    确认挂起
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Dialog */}
        {showTransferDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">转移主要家长角色</h2>
                <p className="text-gray-600 mb-4">
                  选择一位家长来转移主要家长角色。此操作需要密码确认。
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择家长
                  </label>
                  <select
                    value={transferTargetId}
                    onChange={(e) => setTransferTargetId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">请选择家长...</option>
                    {members
                      .filter((m) => m.role === 'parent')
                      .map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name || member.phone}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    确认密码
                  </label>
                  <input
                    type="password"
                    value={transferPassword}
                    onChange={(e) => setTransferPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入您的密码..."
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowTransferDialog(false);
                      setTransferPassword('');
                      setTransferTargetId('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleTransferPrimaryRole}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    确认转移
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Logs Dialog */}
        {showAuditLogs && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">
                    {selectedMember.name || selectedMember.phone} - 操作日志
                  </h2>
                  <button
                    onClick={() => {
                      setShowAuditLogs(false);
                      setSelectedMember(null);
                      setAuditLogs([]);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto p-6 max-h-[60vh]">
                {auditLogs.length === 0 ? (
                  <p className="text-center text-gray-500">暂无操作日志</p>
                ) : (
                  <div className="space-y-4">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="border-l-4 border-blue-500 pl-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">
                              {log.action_type.replace(/_/g, ' ')}
                            </p>
                            {log.metadata && (
                              <p className="text-sm text-gray-600 mt-1">
                                {log.metadata}
                              </p>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {formatDate(log.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
