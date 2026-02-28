#!/bin/bash

# Test Runner Script
# Ensures required environment variables are set before running tests

if [ -z "$PORT" ]; then
  export PORT=3344
  echo "🔧 PORT not set, using default: $PORT"
fi

if [ -z "$NEXT_PUBLIC_APP_URL" ]; then
  export NEXT_PUBLIC_APP_URL="http://localhost:$PORT"
  echo "🔧 NEXT_PUBLIC_APP_URL not set, using default: $NEXT_PUBLIC_APP_URL"
fi

echo "🧪 Running tests with:"
echo "   PORT=$PORT"
echo "   NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL"
echo ""

# Run tests with environment variables
bun test tests/unit tests/integration "$@"
