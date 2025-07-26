#!/usr/bin/env bash
# Demo Script: Emergency Reroute Scenario

echo "🚨 TRIGGERING EMERGENCY REROUTE DEMO..."
echo "Scenario: Critical temperature, no ice depot can deliver in time"

curl -X POST http://localhost:3000/api/datadog \
  -H "Content-Type: application/json" \
  -d '{
    "id": 99,
    "temp": 14.8,
    "duration": 1200,
    "lat": 34.05,
    "lon": -118.24,
    "minutes_to_failure": 45,
    "next_stop": {
      "city": "Los Angeles",
      "eta_minutes": 60,
      "lat": 34.06,
      "lon": -118.23
    },
    "tags": ["pallet:99", "lane:US-West-Emergency"],
    "product": "Critical Blood Products"
  }'

echo ""
echo "✅ Emergency reroute alert triggered!"
echo "Expected flow:"
echo "1. Guardian detects Americas region"
echo "2. Calculates: All depots > 45min to failure"
echo "3. Triggers emergency reroute protocol"
echo "4. Finds nearest emergency facility"
echo "5. Calls facility to confirm cold storage"
echo "6. Redirects truck immediately"
echo ""
echo "🌐 Check dashboard at http://localhost:3000"