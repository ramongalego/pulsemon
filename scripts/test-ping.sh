#!/bin/bash
# Simulates a cron job pinging PulseMon at a regular interval.
# Usage: ./scripts/test-ping.sh <slug> [interval_seconds]
# Example: ./scripts/test-ping.sh test-heartbeat 60
#
# To simulate a failure, press Ctrl+C to stop the script.
# The monitor should go "down" after interval + grace period.

SLUG=${1:-test-heartbeat}
INTERVAL=${2:-60}
URL="http://localhost:3000/api/ping/${SLUG}"

echo "Pinging ${URL} every ${INTERVAL}s..."
echo "Press Ctrl+C to stop (simulates a cron job failure)"
echo ""

while true; do
  RESPONSE=$(curl -fsS "$URL" 2>&1)
  echo "[$(date '+%H:%M:%S')] Ping sent -> ${RESPONSE}"
  sleep "$INTERVAL"
done
