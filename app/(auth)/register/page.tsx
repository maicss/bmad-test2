'use client';

import { useState } from 'react';

export default function RegisterPage() {
  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('otp');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Handle OTP send
  const handleSendOTP = async () => {
    if (!phone || phone.length !== 11) {
      setError('请输入有效的手机号');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        alert('验证码已发送');
      } else {
        setError(data.message || '发送验证码失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate phone
    if (!phone || phone.length !== 11 || !phone.startsWith('1')) {
      setError('请输入有效的中国手机号（11位，以1开头）');
      return;
    }

    // Validate based on auth method
    if (authMethod === 'otp') {
      if (!otp || otp.length !== 6) {
        setError('请输入6位验证码');
        return;
      }
    } else {
      if (!password || password.length < 8 || password.length > 20) {
        setError('密码长度必须在8-20位之间');
        return;
      }

      if (!/[A-Z]/.test(password)) {
        setError('密码必须包含至少1个大写字母');
        return;
      }

      if (!/\d/.test(password)) {
        setError('密码必须包含至少1个数字');
        return;
      }

      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
    }

    setLoading(true);

    try {
      const body = {
        type: authMethod,
        phone,
        ...(authMethod === 'otp' ? { otp } : { password, confirmPassword }),
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to parent dashboard on success
        window.location.href = '/parent/dashboard';
      } else {
        setError(data.message || '注册失败，请重试');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">家长注册</h1>
            <p className="text-gray-600 mt-2">创建家庭账户，开始管理孩子行为</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            {/* Phone Input */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                手机号
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入11位手机号"
                maxLength={11}
                pattern="[0-9]*"
                className="w-full px-4 py-3 border border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                disabled={loading}
              />
            </div>

            {/* Auth Method Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                验证方式
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="authMethod"
                    value="otp"
                    checked={authMethod === 'otp'}
                    onChange={(e) => setAuthMethod(e.target.value as 'otp' | 'password')}
                    className="mr-2"
                    disabled={loading}
                  />
                  <span>验证码</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="authMethod"
                    value="password"
                    checked={authMethod === 'password'}
                    onChange={(e) => setAuthMethod(e.target.value as 'otp' | 'password')}
                    className="mr-2"
                    disabled={loading}
                  />
                  <span>密码</span>
                </label>
              </div>
            </div>

            {/* OTP Flow */}
            {authMethod === 'otp' && (
              <>
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                    验证码
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="请输入6位验证码"
                      maxLength={6}
                      pattern="[0-9]*"
                      className="flex-1 px-4 py-3 border border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={loading || otpSent}
                      className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-gray-400 transition-colors"
                    >
                      {otpSent ? '已发送' : '发送验证码'}
                    </button>
                  </div>
                </div>
                {otpSent && (
                  <div className="text-sm text-green-600">
                    ✓ 验证码已发送到您的手机
                  </div>
                )}
              </>
            )}

            {/* Password Flow */}
            {authMethod === 'password' && (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    密码
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入8-20位密码"
                    maxLength={20}
                    className="w-full px-4 py-3 border border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    disabled={loading}
                  />
                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-1 text-xs">
                      {password.length < 8 && <span className="text-red-500">密码过短</span>}
                      {password.length >= 8 && password.length < 12 && <span className="text-yellow-500">强度：弱</span>}
                      {password.length >= 12 && password.length < 16 && <span className="text-blue-500">强度：中</span>}
                      {password.length >= 16 && <span className="text-green-500">强度：强</span>}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    确认密码
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入密码"
                    maxLength={20}
                    className="w-full px-4 py-3 border border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    disabled={loading}
                  />
                </div>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:bg-gray-400 transition-colors"
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            已有账户？{' '}
            <a href="/login" className="text-primary hover:underline">
              直接登录
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
