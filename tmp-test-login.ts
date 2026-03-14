import { getUserByPhone } from './lib/db/queries/users';
import { getDeviceLock, createSession, upsertUserSessionDevice } from './lib/db/queries/sessions';
import { generateDeviceFingerprint, detectDeviceType, generateDeviceName } from './lib/auth/device-fingerprint';
import { logUserAction } from './lib/db/queries/audit-logs';

const phone = '13800000100';
const password = '1111';
const userAgent = 'Playwright/1.0';
const ipAddress = '127.0.0.1';

console.log('Step 1: Get user by phone');
try {
  const user = await getUserByPhone(phone);
  console.log('User found:', user ? 'YES' : 'NO');
  if (!user) {
    process.exit(1);
  }
  console.log('User ID:', user.id);

  console.log('\nStep 2: Generate device fingerprint');
  const deviceId = await generateDeviceFingerprint(userAgent, ipAddress);
  console.log('Device ID:', deviceId);

  console.log('\nStep 3: Get device lock');
  const deviceLock = await getDeviceLock(user.id, deviceId);
  console.log('Device lock:', deviceLock ? 'LOCKED' : 'NO LOCK');

  console.log('\nStep 4: Verify password');
  const passwordValid = await Bun.password.verify(password, user.password_hash || '');
  console.log('Password valid:', passwordValid);

  console.log('\nStep 5: Create session');
  const sessionToken = 'test-token-' + Date.now();
  const session = await createSession({
    userId: user.id,
    token: sessionToken,
    deviceId,
    deviceType: detectDeviceType(userAgent),
    userAgent,
    ipAddress,
    rememberMe: false,
  });
  console.log('Session created:', session.id);

  console.log('\nStep 6: Upsert user session device');
  await upsertUserSessionDevice({
    userId: user.id,
    deviceId,
    deviceType: detectDeviceType(userAgent),
    deviceName: generateDeviceName(userAgent),
  });
  console.log('User session device upserted');

  console.log('\nAll steps completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('\nError occurred:', error);
  console.error('Error message:', error instanceof Error ? error.message : String(error));
  console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
  process.exit(1);
}
