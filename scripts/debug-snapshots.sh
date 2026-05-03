#!/bin/bash
# View and manage debug snapshots

set -e

SNAPSHOTS_DIR="storage/debug"

if [ ! -d "$SNAPSHOTS_DIR" ]; then
  echo "❌ No debug snapshots found in $SNAPSHOTS_DIR"
  echo ""
  echo "Run debug mode first:"
  echo "  DEBUG_MODE=true npm run debug:browser"
  exit 1
fi

echo "📊 Debug Snapshots Available:"
echo ""
ls -lh "$SNAPSHOTS_DIR" | grep -v "^total" | awk '{print $9, "(" $5 ")"}'
echo ""

echo "🔍 Opening dashboard snapshot in default browser..."
if [ -f "$SNAPSHOTS_DIR/dashboard.html" ]; then
  case "$OSTYPE" in
    darwin*)  open "$SNAPSHOTS_DIR/dashboard.html" ;;
    linux*)   xdg-open "$SNAPSHOTS_DIR/dashboard.html" ;;
    msys*)    start "$SNAPSHOTS_DIR/dashboard.html" ;;
  esac
  echo "✓ Dashboard opened. Use DevTools (F12) to inspect elements."
  echo ""
  echo "💡 Tips:"
  echo "  1. Press F12 to open DevTools"
  echo "  2. Use Ctrl+F to search for selectors"
  echo "  3. Right-click → Inspect to see HTML structure"
  echo "  4. Copy CSS selectors and update src/scraper/selectors.ts"
else
  echo "❌ dashboard.html not found"
fi

echo ""
echo "📁 All snapshots:"
echo "  - dashboard.html/png      Dashboard (course list)"
echo "  - course-{id}.html/png    Individual course content"
echo "  - calendar.html/png       Calendar section"
echo "  - auth-*.html/png         Authentication debug info"
