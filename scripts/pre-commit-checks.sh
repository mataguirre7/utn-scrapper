#!/bin/bash
# Pre-commit security checks

set -e

echo "🔒 Running security checks..."

# 1. Check .env is NOT staged
if git diff --cached --name-only | grep -q "\.env"; then
    echo "❌ ERROR: .env file is staged for commit!"
    echo "   Run: git reset HEAD .env"
    exit 1
fi

# 2. Check storage/ is NOT staged
if git diff --cached --name-only | grep -q "storage/"; then
    echo "❌ ERROR: storage/ is staged for commit!"
    echo "   Run: git reset HEAD storage/"
    exit 1
fi

# 3. Check for hardcoded credentials in staged files
echo "Checking for hardcoded credentials..."
if git diff --cached --include="*.ts" | grep -i "password.*=\|apikey.*=\|token.*=" | grep -v "config.cvg\|config.telegram\|config.openai"; then
    echo "❌ WARNING: Possible hardcoded credentials found"
    exit 1
fi

# 4. TypeScript build
echo "Building TypeScript..."
npm run build

# 5. Prisma schema valid
echo "Validating Prisma schema..."
npx prisma validate

echo "✅ All checks passed!"
