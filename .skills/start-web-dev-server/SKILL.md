---
name: start-web-dev-server
description: Ensures the development server is properly started before running integration or E2E tests. Handles port conflicts intelligently by checking if the correct server is already running.
---

# Start Web Dev Server

This skill ensures the development server is properly started before running integration or E2E tests.

## Features

- **Port conflict detection**: Checks if the port is already in use
- **Smart validation**: Uses the page title to verify if the correct server is running
- **Cross-platform**: Supports Windows (PowerShell) and Unix (Bash)
- **Multi-runtime**: Supports Node.js, Bun, and Deno
- **Multi-framework**: Supports Nuxt.js, Next.js, and Vite projects
- **Multi-manager**: Supports npm, yarn, and pnpm

## Usage

Simply invoke this skill before running tests:

```
/start-web-dev-server
```

## Configuration

On first run, the skill will prompt for the following configuration:

| Option | Description | Saved |
|--------|-------------|-------|
| **Port** | The port number the dev server should use (e.g., 3000) | ✓ |
| **Page Title** | The HTML `<title>` content to verify the correct server is running | ✓ |
| **Force Occupy** | Whether to kill other processes using the port if needed | ✓ |
| **OS** | Auto-detected on each run (windows/unix) | ✗ |
| **Package Manager** | Auto-detected (npm/yarn/pnpm) | ✓ |
| **Project Type** | Auto-detected (nextjs/nuxtjs/vite) | ✓ |
| **Runtime** | Auto-detected (node/bun/deno) | ✓ |

**Note:** OS is detected on every run (not saved) because developers may work across different platforms.

Configuration is saved to `.skills/start-web-dev-server/config.json` for future use.

## Logic Flow

1. **Check if port is in use**
   - If free: Start the dev server directly
   - If in use: Continue to validation

2. **Validate the running server**
   - Curl `localhost:<port>` to get the HTML
   - Extract `<title>` content
   - Compare with expected title (contains check, mutual inclusion allowed)

3. **Handle conflicts**
   - If title matches: Server already running, nothing to do
   - If title doesn't match: Another process is using the port
     - If `forceOccupy` is true: Kill the process and start dev server
     - If `forceOccupy` is false: Log error and exit

## Generated Scripts

The skill generates platform-specific scripts:

- **Windows**: `.skills/start-web-dev-server/start-server.ps1`
- **Unix**: `.skills/start-web-dev-server/start-server.sh`

## Dev Server Commands

| Project Type | Command |
|--------------|---------|
| nextjs | `npm run dev` / `yarn dev` / `pnpm dev` |
| nuxtjs | `npm run dev` / `yarn dev` / `pnpm dev` |
| vite | `npm run dev` / `yarn dev` / `pnpm dev` |

## Example Output

```
✓ Port 3000 is free
✓ Starting dev server...
✓ Dev server started successfully
```

Or with conflict:

```
⚠ Port 3000 is in use by another process
✓ Checking page title...
✓ Title matches: "My App" (expected)
✓ Correct server already running
```

Or with force occupy:

```
⚠ Port 3000 is in use by process 12345
✓ Force occupy enabled, killing process...
✓ Starting dev server...
✓ Dev server started successfully
```
