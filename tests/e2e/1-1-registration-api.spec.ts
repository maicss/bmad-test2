import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3344';

// Generate unique phone number (11 digits)
function generateTestPhone(): string {
  const timestamp = Date.now().toString().slice(-7);
  return '13' + timestamp.padStart(9, '0').slice(0, 9);
}

test.describe('Story 1.1: Parent Phone Registration (API)', () => {
  test.describe.configure({ mode: 'serial' });

  test.describe('Password Registration Flow', () => {
    test('given 正确的密码注册信息，when 调用注册API，then 应该成功注册', async ({ request }) => {
      const phone = generateTestPhone();

      const response = await request.post(BASE_URL + '/api/auth/register', {
        data: {
          type: 'password',
          phone: phone,
          password: 'Password1',
          confirmPassword: 'Password1'
        }
      });

      const data = await response.json();
      expect(data.success).toBeTruthy();
      expect(data.user).toBeDefined();
      expect(data.user.role).toBe('parent');
    });

    test('given 弱密码，when 调用注册API，then 应该返回错误', async ({ request }) => {
      const phone = generateTestPhone();
      const response = await request.post(BASE_URL + '/api/auth/register', {
        data: {
          type: 'password',
          phone: phone,
          password: 'short',
          confirmPassword: 'short'
        }
      });

      const data = await response.json();
      expect(data.success).toBeFalsy();
      expect(data.message).toContain('密码');
    });

    test('given 密码不匹配，when 调用注册API，then 应该返回错误', async ({ request }) => {
      const phone = generateTestPhone();
      const response = await request.post(BASE_URL + '/api/auth/register', {
        data: {
          type: 'password',
          phone: phone,
          password: 'Password1',
          confirmPassword: 'Password2'
        }
      });

      const data = await response.json();
      expect(data.success).toBeFalsy();
      expect(data.message).toContain('密码');
    });

    test('given 密码缺少大写字母，when 调用注册API，then 应该返回错误', async ({ request }) => {
      const phone = generateTestPhone();
      const response = await request.post(BASE_URL + '/api/auth/register', {
        data: {
          type: 'password',
          phone: phone,
          password: 'password1',
          confirmPassword: 'password1'
        }
      });

      const data = await response.json();
      expect(data.success).toBeFalsy();
      expect(data.message).toContain('密码');
    });

    test('given 密码缺少数字，when 调用注册API，then 应该返回错误', async ({ request }) => {
      const phone = generateTestPhone();
      const response = await request.post(BASE_URL + '/api/auth/register', {
        data: {
          type: 'password',
          phone: phone,
          password: 'Password',
          confirmPassword: 'Password'
        }
      });

      const data = await response.json();
      expect(data.success).toBeFalsy();
      expect(data.message).toContain('密码');
    });
  });

  test.describe('OTP Registration Flow', () => {
    test('given 正确的OTP注册信息，when 调用注册API，then 应该成功注册', async ({ request }) => {
      const phone = generateTestPhone();

      const response = await request.post(BASE_URL + '/api/auth/register', {
        data: {
          type: 'otp',
          phone: phone,
          otp: '111111'
        }
      });

      const data = await response.json();
      expect(data.success).toBeTruthy();
      expect(data.user).toBeDefined();
      expect(data.user.role).toBe('parent');
    });
  });
});
