#!/bin/bash

# OAuth E2E Test Runner
# Runs all OAuth tests with comprehensive reporting

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Utilities
log_header() {
  echo -e "\n${BLUE}${1}${NC}"
  echo "═══════════════════════════════════════════════════════════"
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

log_info() {
  echo -e "${CYAN}ℹ ${1}${NC}"
}

log_step() {
  echo -e "\n${MAGENTA}→ ${1}${NC}"
}

# Check if dev server is running
check_dev_server() {
  log_step "Checking for local dev server..."
  if timeout 2 bash -c 'cat < /dev/null > /dev/tcp/localhost/3000' 2>/dev/null; then
    log_success "Dev server is running on http://localhost:3000"
    return 0
  else
    log_warning "Dev server is NOT running on http://localhost:3000"
    return 1
  fi
}

# Check if Vercel deployment is accessible
check_vercel_deployment() {
  log_step "Checking Vercel deployment..."
  if curl -s -m 5 -o /dev/null -w "%{http_code}" "https://fixify-brian-kimarios-projects.vercel.app" | grep -q "200\|301\|302"; then
    log_success "Vercel deployment is accessible"
    return 0
  else
    log_warning "Vercel deployment is NOT accessible"
    return 1
  fi
}

# Install dependencies if needed
install_dependencies() {
  log_step "Ensuring dependencies are installed..."
  if [ ! -d "node_modules" ]; then
    log_info "Installing npm dependencies..."
    npm install
  fi
  
  # Install Playwright browsers
  log_info "Installing Playwright browsers..."
  npx playwright install chromium --with-deps
}

# Run Playwright tests
run_playwright_tests() {
  local test_type=$1
  local base_url=$2
  local test_name=$3
  
  log_step "Running ${test_name}..."
  
  export PLAYWRIGHT_TEST_BASE_URL="$base_url"
  
  if npm run test:oauth -- --reporter=html; then
    log_success "${test_name} PASSED"
    return 0
  else
    log_error "${test_name} FAILED"
    return 1
  fi
}

# Generate report
generate_report() {
  log_step "Generating test report..."
  
  if [ -d "playwright-report" ]; then
    log_success "Test report generated: playwright-report/index.html"
    log_info "View report with: npx playwright show-report"
  fi
}

# Main test flow
main() {
  echo -e "\n${BLUE}${MAGENTA}"
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║         OAuth E2E Test Suite - Comprehensive Run           ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"

  TEST_PASSED=0
  TEST_FAILED=0

  # Stage 1: Verification
  log_header "STAGE 1: Verification"

  # Verify OAuth configuration
  log_step "Verifying OAuth configuration..."
  if node scripts/verify-oauth-config.js > /dev/null 2>&1; then
    log_success "OAuth configuration verified"
  else
    log_warning "OAuth configuration check had issues (non-blocking)"
  fi

  # Stage 2: Setup
  log_header "STAGE 2: Setup"

  install_dependencies

  # Stage 3: Local Dev Tests
  log_header "STAGE 3: Local Development Tests"

  if check_dev_server; then
    log_info "Running tests against local dev server (http://localhost:3000)..."
    if run_playwright_tests "local" "http://localhost:3000" "Local OAuth Tests"; then
      ((TEST_PASSED++))
    else
      ((TEST_FAILED++))
    fi
  else
    log_warning "Skipping local tests (dev server not running)"
    log_info "To run local tests, start the dev server: npm run dev"
  fi

  # Stage 4: Vercel Deployment Tests
  log_header "STAGE 4: Vercel Deployment Tests"

  if check_vercel_deployment; then
    log_info "Running tests against Vercel deployment..."
    if run_playwright_tests "prod" "https://fixify-brian-kimarios-projects.vercel.app" "Vercel OAuth Tests"; then
      ((TEST_PASSED++))
    else
      ((TEST_FAILED++))
    fi
  else
    log_warning "Skipping Vercel tests (deployment not accessible)"
    log_info "Ensure Vercel deployment is accessible and Deployment Protection is disabled"
  fi

  # Stage 5: Report
  log_header "STAGE 5: Test Report"

  generate_report

  # Final Summary
  log_header "SUMMARY"

  echo -e "\n${MAGENTA}Test Results:${NC}"
  echo "  Passed: ${GREEN}${TEST_PASSED}${NC}"
  echo "  Failed: ${RED}${TEST_FAILED}${NC}"

  if [ $TEST_FAILED -eq 0 ] && [ $TEST_PASSED -gt 0 ]; then
    echo -e "\n${GREEN}✓ All tests PASSED!${NC}"
    echo -e "\n${CYAN}Next steps:${NC}"
    echo "  1. OAuth is configured correctly"
    echo "  2. Test new user registration on Vercel"
    echo "  3. Monitor for any errors in production"
    return 0
  elif [ $TEST_FAILED -gt 0 ]; then
    echo -e "\n${RED}✗ Some tests FAILED${NC}"
    echo -e "\n${CYAN}Troubleshooting:${NC}"
    echo "  1. Check browser console: npx playwright show-report"
    echo "  2. Verify .env.local configuration"
    echo "  3. Check Vercel Deployment Protection is disabled"
    echo "  4. Ensure Supabase OAuth redirect URLs are configured"
    return 1
  else
    echo -e "\n${YELLOW}⚠ No tests were run${NC}"
    echo -e "\n${CYAN}To run tests:${NC}"
    echo "  1. Start local dev server: npm run dev"
    echo "  2. Ensure Vercel deployment is accessible"
    echo "  3. Run this script again"
    return 1
  fi
}

# Run main
main
exit $?
