'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Child PIN Login Page
 *
 * Children login using 4-digit PIN code
 * Fast and simple for shared devices
 *
 * Source: Story 1.3 AC #1, #3, #4
 */
export default function PinLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate PIN format
    if (!/^\d{4}$/.test(pin)) {
      setError('请输入4位数字PIN码');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to child dashboard
        router.push('/child-dashboard');
      } else {
        setError(data.error || '登录失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              儿童登录
            </h1>
            <p className="text-gray-600">
              输入4位PIN码登录
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* PIN Input */}
            <div className="flex flex-col items-center">
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-4 text-center">
                PIN码
              </label>
              <input
                id="pin"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={handlePinChange}
                autoFocus
                className="w-48 text-center text-3xl tracking-widest px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-primary focus:border-primary transition-all"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || pin.length !== 4}
              className="w-full py-4 bg-primary text-white font-bold text-lg rounded-xl hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            忘记PIN码？请联系家长
          </div>
        </div>
      </div>
    </div>
  );
}
