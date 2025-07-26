#!/usr/bin/env bash
# Demo Script: Asia Cold-Chain Alert

echo "🇨🇳 TRIGGERING ASIA DEMO ALERT..."
echo "Scenario: Vaccine shipment in Shanghai with critical timing"

curl -X POST http://localhost:3000/api/datadog \
  -H "Content-Type: application/json" \
  -d '{
    "id": 45,
    "temp": 12.5,
    "duration": 900,
    "lat": 31.23,
    "lon": 121.47,
    "minutes_to_failure": 150,
    "next_stop": {
      "city": "Shanghai",
      "eta_minutes": 90,
      "lat": 31.25,
      "lon": 121.50
    },
    "tags": ["pallet:45", "lane:CN-East"],
    "product": "mRNA Vaccine"
  }'

echo ""
echo "✅ Asia alert triggered!"
echo "Expected flow:"
echo "1. Guardian detects Asia region"
echo "2. Queries SOP for Asia ice depots"
echo "3. Finds Shanghai Distribution (75min ETA) vs 150min to failure"
echo "4. Critical timing: 75min + 30min buffer = 105min < 150min ✓"
echo "5. Calls +862112345678 (Shanghai Distribution) for approval"
echo ""
echo "🌐 Check dashboard at http://localhost:3000"