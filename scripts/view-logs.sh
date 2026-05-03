#!/bin/bash
# View application logs from database

echo "📊 Displaying notification logs..."
echo ""

npx prisma studio --browser none &
sleep 3

echo "Open browser to: http://localhost:5555"
echo "Navigate to: NotificationLog table"
echo ""
echo "Press Ctrl+C to close"

wait
