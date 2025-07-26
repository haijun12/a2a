---
pallet_type: "mRNA-vaccine"
threshold_temp: 8
critical_temp: 15
irreversible_after: 180  # minutes
safety_buffer: 30        # minutes buffer before irreversible damage

# Regional contacts based on geography
contacts:
  americas:
    tech_hotline: "+15550123456"
    qa_manager: "+15550789012"
    emergency_manager: "+15550345678"
    region_manager: "+15550456789"
  asia:
    tech_hotline: "+8611234567890"
    qa_manager: "+8611987654321"
    emergency_manager: "+8611122334455"
    region_manager: "+8611556677889"

# Ice depots organized by region with precise timing
ice_depots:
  americas:
    - name: "Fresno DC"
      lat: 36.73
      lon: -119.7
      lead_minutes: 60
      capacity: "50kg dry ice"
      phone: "+15550987654"
      contact: "Mike - Fresno Operations"
      region: "CA_Central"
    - name: "Sacramento Hub"
      lat: 38.58
      lon: -121.49
      lead_minutes: 45
      capacity: "75kg dry ice"
      phone: "+15550543210"
      contact: "Sarah - Sacramento Logistics"
      region: "CA_North"
    - name: "LA Center"
      lat: 34.05
      lon: -118.24
      lead_minutes: 90
      capacity: "100kg dry ice"
      phone: "+15550111222"
      contact: "Carlos - LA Cold Storage"
      region: "CA_South"
  asia:
    - name: "Shanghai Distribution"
      lat: 31.23
      lon: 121.47
      lead_minutes: 75
      capacity: "80kg dry ice"
      phone: "+862112345678"
      contact: "Li Wei - Shanghai Ops"
      region: "CN_East"
    - name: "Singapore Hub"
      lat: 1.35
      lon: 103.87
      lead_minutes: 45
      capacity: "60kg dry ice"
      phone: "+6591234567"
      contact: "Raj Patel - Singapore Logistics"
      region: "SG_Central"

# Emergency facilities for redirections
emergency_facilities:
  americas:
    - name: "Fresno Medical Center"
      lat: 36.75
      lon: -119.72
      phone: "+15559876543"
      capacity: "Emergency cold storage available"
    - name: "Sacramento General Hospital"
      lat: 38.56
      lon: -121.47
      phone: "+15555432109"
      capacity: "24/7 pharmaceutical storage"
  asia:
    - name: "Shanghai Pudong Hospital"
      lat: 31.22
      lon: 121.48
      phone: "+862198765432"
      capacity: "Advanced cold chain facility"

# Routing decision matrix
routing_logic:
  time_to_depot_vs_failure:
    safe: "depot_lead_time + safety_buffer < minutes_to_failure"
    risky: "depot_lead_time + safety_buffer >= minutes_to_failure"
  
  distance_to_depot_vs_destination:
    reroute_threshold: 0.7  # If depot is <70% distance to destination, reroute
    
  critical_escalation:
    temp_threshold: 15
    time_threshold: 60  # minutes to failure

actions:
  temperature_excursion:
    immediate:
      - "Calculate exact minutes to irreversible damage"
      - "Identify nearest ice depot in region"
      - "Check if ice can arrive in time (depot_lead + safety_buffer < failure_time)"
    
    ice_delivery_scenario:
      - "CALL depot contact immediately"
      - "ORDER 5kg dry ice for delivery to truck's next stop"
      - "CONFIRM delivery ETA and driver contact"
      - "MONITOR progress every 15 minutes"
      - "SMS driver with depot contact info"
    
    reroute_scenario:
      - "CALCULATE distance to nearest emergency facility"
      - "CALL facility to confirm cold storage availability"
      - "REDIRECT truck to facility immediately"
      - "NOTIFY receiving destination of delay"
      - "ARRANGE expedited transport from facility"
  
  geography_specific:
    americas:
      - "Use Americas contact numbers and depots"
      - "Consider US regulatory requirements"
      - "Standard English communication"
    asia:
      - "Use Asia contact numbers and depots"
      - "Consider local regulatory requirements"
      - "Multi-language communication capability"

# Decision tree implementation
decision_matrix:
  step_1_region_detection:
    americas: "lat >= 20 && lat <= 60 && lon >= -130 && lon <= -60"
    asia: "lat >= -10 && lat <= 50 && lon >= 95 && lon <= 145"
  
  step_2_timing_analysis:
    safe_ice_delivery: "min_depot_lead_time + 30 < minutes_to_failure"
    risky_ice_delivery: "min_depot_lead_time + 30 >= minutes_to_failure && min_depot_lead_time < minutes_to_failure"
    emergency_reroute: "min_depot_lead_time >= minutes_to_failure"
  
  step_3_distance_optimization:
    depot_closer: "distance_to_depot < (distance_to_destination * 0.7)"
    destination_closer: "distance_to_depot >= (distance_to_destination * 0.7)"

failsafe_rules:
  - "RULE 1: If depot lead time > (minutes_to_failure - safety_buffer) → emergency reroute"
  - "RULE 2: If temperature > 15°C → immediate emergency escalation"
  - "RULE 3: If no regional depots available → use nearest available globally"
  - "RULE 4: If all options exhausted → escalate to regional emergency manager"
  - "RULE 5: Always confirm recipient availability before rerouting"
---

# Standard Operating Procedure: mRNA Vaccine Transport

## Temperature Excursion Response Protocol

### Immediate Actions (0-2 minutes)
1. **Verify alert** - Confirm temperature reading accuracy
2. **Assess timeline** - Calculate exact minutes until irreversible damage
3. **Identify nearest ice depot** - Use GPS coordinates to find optimal depot

### Decision Matrix
- **Scenario A**: Ice depot reachable within (minutes_to_failure - 30min) → Execute ice delivery
- **Scenario B**: No safe depot available → Reroute to nearest facility
- **Scenario C**: Critical temperature (>15°C) → Emergency escalation

### Communication Protocol
1. **Voice call** to depot contact with specific instructions
2. **Confirmation** of ice order and delivery timeline
3. **Status updates** every 15 minutes until resolved

### Post-Incident Actions
- Complete incident report
- Update temperature logs
- Review and optimize route for future shipments