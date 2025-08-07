#!/bin/bash

# Pre-commit check script to catch issues before pushing
# Run this before committing to avoid CI/CD failures

set -e  # Exit on error

echo "🔍 Running pre-commit checks..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any checks fail
FAILED=0

# Function to run a check
run_check() {
    local name="$1"
    local command="$2"
    
    echo -n "  ⏳ $name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC}"
        FAILED=1
        return 1
    fi
}

# 1. Check for TypeScript errors
echo "1. TypeScript Compilation"
if ! run_check "Type checking" "pnpm type-check"; then
    echo -e "   ${YELLOW}Fix TypeScript errors before committing${NC}"
    pnpm type-check 2>&1 | grep -E "error TS" | head -10
fi

# 2. Check for ESLint errors
echo ""
echo "2. ESLint"
if ! run_check "Linting" "pnpm lint"; then
    echo -e "   ${YELLOW}Fix linting errors before committing${NC}"
    pnpm lint 2>&1 | grep -E "Error:|error" | head -10
fi

# 3. Run tests
echo ""
echo "3. Tests"
if ! run_check "Running tests" "pnpm test --silent"; then
    echo -e "   ${YELLOW}Fix failing tests before committing${NC}"
    echo "   Failed test suites:"
    pnpm test 2>&1 | grep "FAIL" | head -10
fi

# 4. Check build
echo ""
echo "4. Build"
if ! run_check "Building application" "pnpm build"; then
    echo -e "   ${YELLOW}Fix build errors before committing${NC}"
fi

# 5. Check for console.log statements in production code (excluding tests)
echo ""
echo "5. Code Quality"
CONSOLE_LOGS=$(grep -r "console\.log" src/ --exclude-dir=__tests__ --exclude-dir=tests 2>/dev/null | wc -l)
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    echo -e "  ⚠️  Found $CONSOLE_LOGS console.log statements in production code"
    FAILED=1
else
    echo -e "  ${GREEN}✓${NC} No console.log in production code"
fi

# 6. Check for TODO comments
echo ""
echo "6. TODO Comments"
TODOS=$(grep -r "TODO\|FIXME\|XXX" src/ 2>/dev/null | wc -l)
if [ "$TODOS" -gt 0 ]; then
    echo -e "  ℹ️  Found $TODOS TODO/FIXME comments"
    grep -r "TODO\|FIXME\|XXX" src/ 2>/dev/null | head -5
fi

# 7. Check package.json for missing dependencies
echo ""
echo "7. Dependencies"
if ! run_check "Checking dependencies" "pnpm install --frozen-lockfile"; then
    echo -e "   ${YELLOW}Dependencies out of sync. Run 'pnpm install'${NC}"
fi

# 8. Security audit
echo ""
echo "8. Security"
echo -n "  ⏳ Checking for vulnerabilities... "
AUDIT_RESULT=$(pnpm audit --audit-level=high 2>&1 || true)
HIGH_VULNS=$(echo "$AUDIT_RESULT" | grep -E "high|critical" | wc -l)
if [ "$HIGH_VULNS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️${NC}"
    echo "   Found high/critical vulnerabilities. Run 'pnpm audit' for details"
else
    echo -e "${GREEN}✓${NC}"
fi

# Summary
echo ""
echo "================================"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo "Ready to commit and push."
else
    echo -e "${RED}❌ Some checks failed.${NC}"
    echo "Please fix the issues above before committing."
    exit 1
fi

# Additional reminders
echo ""
echo "📋 Pre-commit checklist:"
echo "  □ Have you updated documentation if needed?"
echo "  □ Have you added/updated tests for new features?"
echo "  □ Have you checked for breaking changes?"
echo "  □ Is your commit message descriptive?"
echo ""
echo "💡 Tip: Run this script before every commit:"
echo "   ./scripts/pre-commit-check.sh"