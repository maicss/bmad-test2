#!/usr/bin/env bun
/**
 * Development Server Startup Script
 *
 * Validates environment variables before starting Next.js dev server
 */

const PORT = process.env.PORT;

if (!PORT) {
  console.error("❌ Error: PORT environment variable is not set!");
  console.error("");
  console.error("Please set PORT before starting dev server:");
  console.error("  bun run dev");
  console.error("");
  console.error("Or set it in your .env file:");
  console.error("  PORT=3344");
  console.error("");
  process.exit(1);
}

const port = parseInt(PORT, 10);
if (isNaN(port) || port < 1024 || port > 65535) {
  console.error(`❌ Error: PORT must be a valid port number (1024-65535), got: ${PORT}`);
  process.exit(1);
}

console.log(`✅ PORT is valid: ${port}`);
console.log(`🚀 Starting Next.js dev server on port ${port}...`);
console.log("");

// Start Next.js dev server using Bun subprocess
const nextProcess = Bun.spawn(['bun', 'next', 'dev', '-p', port.toString()], {
  stdout: 'inherit',
  stderr: 'inherit',
  env: {
    ...process.env,
    PORT: port.toString(),
  },
});

// Wait for process to exit
await nextProcess.exited;
process.exit(nextProcess.exitCode ?? 0);
