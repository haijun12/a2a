#!/usr/bin/env bash
# Demo Script: Americas Cold-Chain Alert

echo "🇺🇸 TRIGGERING AMERICAS DEMO ALERT..."
echo "Scenario: Vaccine shipment in Fresno needs ice delivery"

curl -X POST http://localhost:3000/api/datadog \
  -H "Content-Type: application/json" \
  -d '{
    "id": 43,
    "temp": 11.8,
    "duration": 600,
    "lat": 37.77,
    "lon": -122.42,
    "minutes_to_failure": 180,
    "next_stop": {
      "city": "San Francisco",
      "eta_minutes": 45,
      "lat": 37.78,
      "lon": -122.41
    },
    "tags": ["pallet:43", "lane:US-West"],
    "product": "mRNA Vaccine"
  }'

echo ""
echo "✅ Americas alert triggered!"
echo "Expected flow:"
echo "1. Guardian detects Americas region"
echo "2. Queries SOP for Americas ice depots"
echo "3. Finds Fresno DC (60min ETA) < 180min to failure"
echo "4. Calls +15550789 (Fresno DC) for approval"
echo "5. If approved: Execute ice delivery"
echo ""
echo "🌐 Check dashboard at http://localhost:3000"