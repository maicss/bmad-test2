import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { phoneNumber } from 'better-auth/plugins';
import db from '@/lib/db';

/**
 * Better-Auth configuration
 *
 * Features:
 * - Phone plugin for OTP-based authentication
 * - Email & Password plugin for password-based authentication
 * - 36-hour rolling session refresh (NFR13)
 * - HttpOnly Cookie for session management (NFR11)
 *
 * Source: Story 1.1 Task 1
 * Source: Story 1.1 AC #3 - 36-hour session, HttpOnly Cookie
 */

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite' }),

  // Email & Password Authentication
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 20,
    autoSignIn: true,
  },

  // Phone Number Plugin with OTP
  plugins: [
    phoneNumber({
      // Send OTP code via SMS
      sendOTP: async ({ phoneNumber, code }) => {
        // TODO: Implement SMS sending via OTP_PROVIDER (console/aliyun/tencent)
        const otpProvider = Bun.env.OTP_PROVIDER || 'console';

        if (otpProvider === 'console') {
          // Development mode: output OTP to console
          console.log(`[OTP] Phone: ${phoneNumber}, Code: ${code}`);
        } else if (otpProvider === 'console-debug') {
          // Debug mode: use fixed code from OTP_DEBUG_CODE
          console.log(`[OTP-DEBUG] Phone: ${phoneNumber}, Code: ${Bun.env.OTP_DEBUG_CODE}`);
        } else if (otpProvider === 'aliyun') {
          // TODO: Implement Aliyun SMS sending
          console.log(`[SMS-ALIYUN] Phone: ${phoneNumber}, Code: ${code}`);
        } else if (otpProvider === 'tencent') {
          // TODO: Implement Tencent SMS sending
          console.log(`[SMS-TENCENT] Phone: ${phoneNumber}, Code: ${code}`);
        }
      },

      // OTP configuration
      otpLength: 6,
      expiresIn: 300, // 5 minutes (300 seconds)
      allowedAttempts: 3, // Max attempts before OTP invalidates

      // Auto sign up on phone verification
      signUpOnVerification: {
        getTempEmail: (phoneNumber) => {
          // Use phone-based email for internal Better-Auth compatibility
          return `${phoneNumber}@bmad-temp.local`;
        },
        getTempName: (phoneNumber) => {
          // Use phone number as temporary name
          return `User-${phoneNumber.slice(-4)}`;
        },
      },
    }),
  ],

  // Session Configuration
  session: {
    // 36-hour session expiration (NFR13)
    expiresIn: 60 * 60 * 36, // 129600 seconds = 36 hours
    // Rolling refresh every 1 hour
    updateAge: 60 * 60 * 1, // 3600 seconds = 1 hour
  },

  // Advanced Configuration
  advanced: {
    // Secure cookies (production only)
    useSecureCookies: Bun.env.NODE_ENV === 'production',

    // Custom cookie configuration
    cookies: {
      session_token: {
        name: 'better-auth.session_token',
        attributes: {
          httpOnly: true, // NFR11: HttpOnly Cookie
          secure: Bun.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 36, // 36 hours
        },
      },
    },
  },
});

// Export auth instance for use in API routes and client
export type Session = typeof auth.$Infer.Session;

