# Implementation Guide

This file contains the step-by-step logic that AI should follow when executing this skill.

## Step 1: Detect OS (Always)

**OS is detected on every run**, not saved to configuration, because developers may work across different platforms.

```javascript
// OS detection - run every time
const platform = process.platform
if (platform === 'win32') {
    // Use PowerShell script
    os = 'windows'
} else {
    // Use Bash script
    os = 'unix'
}
```

## Step 2: Check for Existing Configuration

Check if `.skills/start-web-dev-server/config.json` exists.

If it exists, load the configuration and skip to **Step 5**.

If not, proceed to **Step 3**.

## Step 3: Gather Configuration

Gather the following information through analysis and user prompts:

### Required Configuration:

1. **port** - The port number (e.g., 3000, 5173)
2. **pageTitle** - The HTML title to validate against
3. **forceOccupy** - Boolean, whether to kill conflicting processes

### Auto-detect or Prompt:

4. **packageManager** - "npm", "yarn", or "pnpm" (check for lock files)
5. **projectType** - "nextjs", "nuxtjs", or "vite" (check package.json)
6. **runtime** - "node", "bun", or "deno" (check for runtime-specific files)

**Note: `os` is auto-detected on each run and NOT saved to config.**

### Auto-detection Logic:

```javascript
// Package Manager
if (exists('pnpm-lock.yaml')) return 'pnpm'
if (exists('yarn.lock')) return 'yarn'
if (exists('package-lock.json')) return 'npm'

// Project Type
const pkg = JSON.parse(readFileSync('package.json'))
const deps = {...pkg.dependencies, ...pkg.devDependencies}
if (deps.next || deps['@next/core']) return 'nextjs'
if (deps.nuxt) return 'nuxtjs'
if (deps.vite) return 'vite'

// Runtime
if (exists('bun.lockb')) return 'bun'
if (exists('deno.json') || exists('deno.lock')) return 'deno'
return 'node' // default
```

### Prompt Template for Missing Info:

```
I need some information to configure the start-web-dev-server skill:

1. What port should the dev server use? (e.g., 3000)
2. What is the expected HTML page title? (e.g., "My App" - check index.html or app root)
3. Should I force occupy the port if another process is using it? (y/n)

Current auto-detected configuration:
- OS: {os} (detected each run)
- Package Manager: {packageManager}
- Project Type: {projectType}
- Runtime: {runtime}

Please confirm or provide correct values.
```

## Step 4: Save Configuration

Create `.skills/start-web-dev-server/config.json`:

```json
{
  "port": 3000,
  "pageTitle": "My App",
  "forceOccupy": false,
  "packageManager": "npm",
  "projectType": "nextjs",
  "runtime": "node"
}
```

**Note: `os` is NOT saved** - it is detected automatically on each run.

## Step 5: Execute Dev Server Start

Generate and execute the appropriate script based on OS.

### For Windows (PowerShell):

Create `start-server.ps1` with:

```powershell
# Configuration
$Port = {{port}}
$ExpectedTitle = "{{pageTitle}}"
$ForceOccupy = ${{forceOccupy}}
$PackageManager = "{{packageManager}}"
$ProjectType = "{{projectType}}"
$Runtime = "{{runtime}}"

# Function to get process using port
function Get-ProcessByPort {
    param([int]$Port)
    $netstat = netstat -ano | Select-String ":$Port\s.*LISTENING"
    if ($netstat) {
        $pid = ($netstat -split '\s+')[-1]
        return [int]$pid
    }
    return $null
}

# Function to get page title via curl
function Get-PageTitle {
    param([int]$Port)
    try {
        $response = curl -s "http://localhost:$Port" -UseBasicParsing
        if ($response -match '<title>(.*?)</title>') {
            return $matches[1].Trim()
        }
    } catch {
        return $null
    }
    return $null
}

# Check if port is in use
$existingPid = Get-ProcessByPort -Port $Port

if ($existingPid) {
    Write-Host "⚠ Port $Port is in use by process $existingPid"

    # Get the actual page title
    $actualTitle = Get-PageTitle -Port $Port

    if ($actualTitle) {
        Write-Host "✓ Checking page title..."
        Write-Host "  Actual: '$actualTitle'"
        Write-Host "  Expected: '$ExpectedTitle'"

        # Check if titles match (mutual inclusion)
        $titleMatches = ($actualTitle -like "*$ExpectedTitle*") -or ($ExpectedTitle -like "*$actualTitle*")

        if ($titleMatches) {
            Write-Host "✓ Title matches: '$actualTitle' (expected)"
            Write-Host "✓ Correct server already running"
            exit 0
        } else {
            Write-Host "✗ Title mismatch: '$actualTitle' != '$ExpectedTitle'"
            Write-Host "⚠ Another process is using this port"
        }
    }

    # Handle conflict
    if ($ForceOccupy) {
        Write-Host "✓ Force occupy enabled, killing process $existingPid..."
        Stop-Process -Id $existingPid -Force
        Start-Sleep -Seconds 1
    } else {
        Write-Host "✗ Port $Port is occupied by another process"
        Write-Host "  Enable forceOccupy or manually free the port"
        exit 1
    }
} else {
    Write-Host "✓ Port $Port is free"
}

# Determine dev command
$DevCommand = switch ($ProjectType) {
    "nextjs" { "dev" }
    "nuxtjs" { "dev" }
    "vite" { "dev" }
    default { "dev" }
}

# Determine runner
$Runner = switch ($PackageManager) {
    "npm" { "npm run" }
    "yarn" { "yarn" }
    "pnpm" { "pnpm" }
    default { "npm run" }
}

# Determine runtime prefix
$RuntimePrefix = switch ($Runtime) {
    "bun" { "bun" }
    "deno" { "deno run" }
    default { "" }
}

# Start dev server
Write-Host "✓ Starting dev server..."
$Command = if ($RuntimePrefix) {
    "$RuntimePrefix $Runner $DevCommand"
} else {
    "$Runner $DevCommand"
}

Write-Host "  Running: $Command"

# Start in background
$job = Start-Job -ScriptBlock {
    param($Cmd)
    Invoke-Expression $Cmd
} -ArgumentList $Command

Write-Host "✓ Dev server started (Job ID: $($job.Id))"
```

### For Unix (Bash):

Create `start-server.sh` with:

```bash
#!/bin/bash

# Configuration
PORT={{port}}
EXPECTED_TITLE="{{pageTitle}}"
FORCE_OCCUPY={{forceOccupy}}
PACKAGE_MANAGER="{{packageManager}}"
PROJECT_TYPE="{{projectType}}"
RUNTIME="{{runtime}}"

# Function to get PID using port
get_pid_by_port() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        lsof -ti:$port 2>/dev/null
    else
        netstat -tulnp 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1
    fi
}

# Function to get page title via curl
get_page_title() {
    local port=$1
    local html=$(curl -s "http://localhost:$port" 2>/dev/null)
    if echo "$html" | grep -q "<title>"; then
        echo "$html" | sed -n 's/.*<title>\([^<]*\)<\/title>.*/\1/p' | head -1 | xargs
    fi
}

# Check if port is in use
EXISTING_PID=$(get_pid_by_port $PORT)

if [ -n "$EXISTING_PID" ]; then
    echo "⚠ Port $PORT is in use by process $EXISTING_PID"

    # Get the actual page title
    ACTUAL_TITLE=$(get_page_title $PORT)

    if [ -n "$ACTUAL_TITLE" ]; then
        echo "✓ Checking page title..."
        echo "  Actual: '$ACTUAL_TITLE'"
        echo "  Expected: '$EXPECTED_TITLE'"

        # Check if titles match (mutual inclusion)
        if [[ "$ACTUAL_TITLE" == *"$EXPECTED_TITLE"* ]] || [[ "$EXPECTED_TITLE" == *"$ACTUAL_TITLE"* ]]; then
            echo "✓ Title matches: '$ACTUAL_TITLE' (expected)"
            echo "✓ Correct server already running"
            exit 0
        else
            echo "✗ Title mismatch: '$ACTUAL_TITLE' != '$EXPECTED_TITLE'"
            echo "⚠ Another process is using this port"
        fi
    fi

    # Handle conflict
    if [ "$FORCE_OCCUPY" = "true" ]; then
        echo "✓ Force occupy enabled, killing process $EXISTING_PID..."
        kill -9 $EXISTING_PID 2>/dev/null
        sleep 1
    else
        echo "✗ Port $PORT is occupied by another process"
        echo "  Enable forceOccupy or manually free the port"
        exit 1
    fi
else
    echo "✓ Port $PORT is free"
fi

# Determine dev command (same for all types)
DEV_COMMAND="dev"

# Determine runner
RUNNER=""
case $PACKAGE_MANAGER in
    npm)
        RUNNER="npm run"
        ;;
    yarn)
        RUNNER="yarn"
        ;;
    pnpm)
        RUNNER="pnpm"
        ;;
    *)
        RUNNER="npm run"
        ;;
esac

# Determine runtime prefix
RUNTIME_PREFIX=""
case $RUNTIME in
    bun)
        RUNTIME_PREFIX="bun"
        ;;
    deno)
        RUNTIME_PREFIX="deno run"
        ;;
esac

# Start dev server
echo "✓ Starting dev server..."

if [ -n "$RUNTIME_PREFIX" ]; then
    COMMAND="$RUNTIME_PREFIX $RUNNER $DEV_COMMAND"
else
    COMMAND="$RUNNER $DEV_COMMAND"
fi

echo "  Running: $COMMAND"

# Start in background
nohup $COMMAND > /dev/null 2>&1 &
echo "✓ Dev server started (PID: $!)"
```

## Step 6: Execute the Script

After generating the script based on detected OS:

1. For Windows: `powershell -ExecutionPolicy Bypass -File .skills/start-web-dev-server/start-server.ps1`
2. For Unix: `chmod +x .skills/start-web-dev-server/start-server.sh && .skills/start-web-dev-server/start-server.sh`

## Configuration Update

If the user wants to change configuration later:

1. Delete `.skills/start-web-dev-server/config.json`
2. Re-run the skill to reconfigure
