'use client';

import { useState } from 'react';

/**
 * Children Management Page
 *
 * Parent can add, view, suspend/activate child accounts
 *
 * Source: Story 1.5 Task 3 - Create child management UI pages
 */
export default function ChildrenManagementPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [children, setChildren] = useState([
    {
      id: '1',
      name: '小明',
      age: 8,
      pin: '1234',
      role: 'child',
      created_at: '2026-02-26T08:00:00Z',
      is_active: true,
    },
    {
      id: '2',
      name: '小红',
      age: 6,
      pin: '5678',
      role: 'child',
      created_at: '2026-02-26T09:00:00Z',
      is_active: false,
    },
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // TODO: Implement API call
    // For now, just simulate
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowAddForm(false);
      setError('');
    }, 1000);
  };

  const handleToggleStatus = async (childId: string) => {
    // TODO: Implement API call
    setChildren(prev => prev.map(child => 
      child.id === childId 
        ? { ...child, is_active: !child.is_active }
        : child
    ));
  };

  const maskPIN = (pin: string) => {
    if (!pin || pin.length < 4) return '****';
    return pin;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">儿童管理</h1>
        <p className="mt-2 text-gray-600">
          添加和管理儿童账户
        </p>
      </div>

      {/* Children List */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            我的孩子们
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {showAddForm ? '取消添加' : '添加儿童'}
          </button>
        </div>

        {/* Add Child Form */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              添加新儿童
            </h3>
            <form onSubmit={handleAddChild} className="space-y-4">
              <div>
                <label htmlFor="childName" className="block text-sm font-medium text-gray-700">
                  姓名
                </label>
                <input
                  id="childName"
                  type="text"
                  placeholder="请输入儿童姓名"
                  maxLength={50}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 border"
                  required
                />
              </div>

              <div>
                <label htmlFor="childAge" className="block text-sm font-medium text-gray-700">
                  年龄
                </label>
                <input
                  id="childAge"
                  type="number"
                  min="6"
                  max="12"
                  placeholder="6-12"
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
                {loading ? '创建中...' : '创建儿童账户'}
              </button>
            </form>
          </div>
        )}

        {/* Children List */}
        {children.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            暂无儿童，点击"添加儿童"按钮开始
          </p>
        ) : (
          <div className="space-y-3">
            {children.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {child.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {child.age} 岁 · {child.role === 'child' && '儿童'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PIN码: {maskPIN(child.pin)}
                  </p>
                  <p className="text-xs text-gray-400">
                    创建时间: {new Date(child.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleToggleStatus(child.id)}
                    className={child.is_active
                      ? 'inline-flex items-center px-3 py-1 border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-50'
                      : 'inline-flex items-center px-3 py-1 border border-red-200 rounded-full text-xs font-medium text-red-600 hover:bg-red-50'
                    }
                  >
                    {child.is_active ? '已激活' : '已挂起'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
