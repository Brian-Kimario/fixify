#!/bin/bash
set -e

# OAuth Deployment Test Script
# Tests OAuth flow on local dev and Vercel production
# Usage: ./scripts/test-oauth-deployment.sh [local|prod|both]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${BLUE}ℹ ${1}${NC}"
}

log_success() {
  echo -e "${GREEN}✓ ${1}${NC}"
}

log_error() {
  echo -e "${RED}✗ ${1}${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠ ${1}${NC}"
}

# Parse arguments
TEST_ENV=${1:-both}

if [[ ! "$TEST_ENV" =~ ^(local|prod|both)$ ]]; then
  log_error "Invalid argument. Usage: $0 [local|prod|both]"
  exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        OAuth Deployment Test Suite                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check dependencies
log_info "Checking dependencies..."
if ! command -v node &> /dev/null; then
  log_error "Node.js is not installed"
  exit 1
fi
log_success "Node.js found: $(node --version)"

if ! command -v npm &> /dev/null && ! command -v pnpm &> /dev/null; then
  log_error "npm or pnpm is not installed"
  exit 1
fi
log_success "Package manager found"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  log_info "Installing dependencies..."
  npm install || pnpm install
fi

# Check if Playwright is installed
log_info "Ensuring Playwright browsers are installed..."
npx playwright install chromium

echo ""
log_info "Loading environment configuration..."
if [ -f ".env.local" ]; then
  source .env.local
  log_success ".env.local loaded"
else
  log_warning ".env.local not found, using defaults"
fi

# Verify Supabase URL
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  log_error "NEXT_PUBLIC_SUPABASE_URL not set in .env.local"
  exit 1
fi
log_success "Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"

# Verify app URL for production
VERCEL_URL="https://fixify-brian-kimarios-projects.vercel.app"
log_info "Vercel deployment URL: $VERCEL_URL"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                   Pre-Test Verification                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if local dev server is running
if [ "$TEST_ENV" = "local" ] || [ "$TEST_ENV" = "both" ]; then
  log_info "Checking local dev server (http://localhost:3000)..."
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    log_success "Local dev server is running"
  else
    log_warning "Local dev server is NOT running"
    log_info "Start it with: npm run dev"
    if [ "$TEST_ENV" = "local" ]; then
      exit 1
    fi
  fi
fi

# Check if Vercel deployment is accessible
if [ "$TEST_ENV" = "prod" ] || [ "$TEST_ENV" = "both" ]; then
  log_info "Checking Vercel deployment ($VERCEL_URL)..."
  if curl -s -I "$VERCEL_URL" > /dev/null 2>&1; then
    log_success "Vercel deployment is accessible"
  else
    log_error "Vercel deployment is NOT accessible"
    if [ "$TEST_ENV" = "prod" ]; then
      exit 1
    fi
  fi
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Running Test Suite                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Run Playwright tests
if [ "$TEST_ENV" = "local" ]; then
  log_info "Running tests for LOCAL environment..."
  npm run test:oauth:local || pnpm test:oauth:local
elif [ "$TEST_ENV" = "prod" ]; then
  log_info "Running tests for PRODUCTION environment..."
  npm run test:oauth:prod || pnpm test:oauth:prod
else
  log_info "Running tests for BOTH environments..."
  npm run test:oauth || pnpm test:oauth
fi

TEST_STATUS=$?

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Test Summary                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ $TEST_STATUS -eq 0 ]; then
  log_success "All OAuth tests PASSED ✓"
  echo ""
  log_success "OAuth flow is working correctly on Vercel!"
  log_success "New users should now:"
  log_success "  1. Sign in with Google"
  log_success "  2. Grant permission to Fixify"
  log_success "  3. Auto-create profile with role='customer'"
  log_success "  4. Redirect to /customer dashboard"
  echo ""
else
  log_error "Some tests FAILED ✗"
  echo ""
  log_error "Troubleshooting steps:"
  log_error "  1. Check .env.local has correct Supabase URL"
  log_error "  2. Verify Supabase OAuth config includes correct redirect URLs"
  log_error "  3. For local tests: ensure 'npm run dev' is running"
  log_error "  4. For production: check Vercel deployment is accessible"
  log_error "  5. Check browser console for errors (run with DEBUG_BROWSER=1)"
  echo ""
fi

exit $TEST_STATUS
