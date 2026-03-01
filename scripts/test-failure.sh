#!/bin/bash
# Simulates a full ping -> stop -> failure detection cycle.
# Usage: ./scripts/test-failure.sh <slug>
#
# IMPORTANT: For this to work quickly, create a monitor with a short
# interval (e.g. 10s) and grace period (e.g. 10s). Otherwise you'll
# be waiting for interval + grace to elapse before failure is detected.
#
# Requires the dev server running on localhost:3000

SLUG=${1:-test-heartbeat}
WAIT=${2:-25}  # seconds to wait before triggering check (should be > interval + grace)
PING_URL="http://localhost:3000/api/ping/${SLUG}"
CHECK_URL="http://localhost:3000/api/dev/check"

echo "=== Step 1: Sending pings to bring monitor UP ==="
for i in 1 2 3; do
  RESPONSE=$(curl -fsS "$PING_URL" 2>&1)
  echo "[$(date '+%H:%M:%S')] Ping $i -> ${RESPONSE}"
  sleep 2
done

echo ""
echo "Monitor should now be UP. Check your dashboard."
echo ""
echo "=== Step 2: Stopping pings (simulating cron job failure) ==="
echo "Waiting ${WAIT}s for interval + grace period to expire..."
echo "(Tip: use a monitor with 10s interval + 10s grace for fast testing)"
sleep "$WAIT"

echo ""
echo "=== Step 3: Triggering checker to detect missed ping ==="
RESPONSE=$(curl -fsS -X POST "$CHECK_URL" 2>&1)
echo "Checker response -> ${RESPONSE}"

echo ""
echo "=== Done! Check your dashboard — the monitor should be DOWN ==="
echo ""
echo "To recover it, just ping again:"
echo "  curl $PING_URL"
echo ""
echo "Then trigger the checker again to detect recovery:"
echo "  curl -X POST $CHECK_URL"
