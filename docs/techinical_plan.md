# Cold-Chain Guardian - Technical Plan Document

## 1. System Overview

**Mission**: Detect temperature excursions in cold-chain logistics, generate SOP-backed remediation plans, obtain human approval, and execute corrective actions within 60 seconds—then auto-generate audit documentation.

**Core Value Proposition**: Transform a multi-hour manual response cycle into a sub-60-second automated intervention with human oversight.

## 2. Architecture & Data Flow

```
┌─────────────┐    webhook     ┌─────────────┐    query      ┌─────────────┐
│   Datadog   │ ──────────────▶│  Guardian   │ ─────────────▶│ LlamaIndex  │
│  Monitor    │                │     API     │               │   (SOP)     │
└─────────────┘                └─────────────┘               └─────────────┘
                                      │                              │
                                      ▼                              │
                               ┌─────────────┐                       │
                               │     SSE     │◀──────────────────────┘
                               │  Dashboard  │       plan
                               └─────────────┘
                                      │
                                      ▼
┌─────────────┐    approval    ┌─────────────┐    call       ┌─────────────┐
│    Slack    │ ──────────────▶│  Guardian   │ ─────────────▶│    Vapi     │
│   Button    │                │  Executor   │               │   Voice     │
└─────────────┘                └─────────────┘               └─────────────┘
```

**Event Flow**: Datadog webhook → Guardian ingestion → LlamaIndex SOP query → Slack approval → Vapi voice call → SSE status updates → PDF audit trail

## 3. API Contract Specifications

### 3.1 Stage 1: Alert Ingestion
**Endpoint**: `POST /api/datadog`
**Caller**: Datadog Monitor Webhook

**Request Payload**:
```json
{
  "id": 42,
  "temp": 12.3,
  "duration": 900,
  "tags": ["pallet:42", "lane:3"],
  "lat": 36.73,
  "lon": -119.7,
  "minutes_to_failure": 180,
  "next_stop": {
    "city": "Sacramento",
    "eta_minutes": 120,
    "lat": 38.58,
    "lon": -121.49
  }
}
```

**Response**: `200 { "ok": true }`

### 3.2 Stage 2: SOP Query & Plan Generation
**Implementation**: Internal library call to LlamaIndex
**Location**: `lib/llama.ts`

**Query Template**:
```typescript
const query = `Pallet ${id} at ${temp}°C (threshold: 8°C) for ${duration/60} minutes.
Next stop: ${city} in ${eta} minutes.
Minutes until irreversible damage: ${minutes_to_failure}.
Available ice depots: ${nearbyDepots}.
Generate actionable plan with specific contacts and steps.`;
```

**SOP Document Structure** (`/data/sop_mrna_v1.md`):
```yaml
---
pallet_type: "mRNA-vaccine"
threshold_temp: 8
irreversible_after: 180 # minutes
contacts:
  tech: "+15550123"
  qa: "qa@pharma.com"
  manager: "+15550456"
ice_depots:
  - name: "Fresno DC"
    lat: 36.73
    lon: -119.7
    lead_minutes: 60
    phone: "+15550789"
  - name: "Sacramento Hub"
    lat: 38.58
    lon: -121.49
    lead_minutes: 45
    phone: "+15550321"
actions:
  temperature_excursion:
    - "Move pallet to spare reefer compartment"
    - "Order 5kg dry ice from nearest depot"
    - "Increase compressor duty cycle by 20%"
    - "Log incident in QA system"
  route_optimization:
    - "Reroute to nearest facility with cold storage"
    - "Expedite delivery with priority transport"
---

# Standard Operating Procedure: mRNA Vaccine Transport

## Temperature Excursion Response
When temperature exceeds 8°C for more than 5 minutes...
```

### 3.3 Stage 3: Human Approval via Slack
**Method**: Slack Socket Mode with Interactive Buttons

**Message Payload**:
```json
{
  "channel": "#cold-chain-alerts",
  "text": "🚨 URGENT: Pallet 42 temperature excursion",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Pallet 42* at 12.3°C (3 hours to failure)\n*Plan*: Order ice from Fresno DC, ETA 60min"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "✅ Approve" },
          "style": "primary",
          "action_id": "approve_plan",
          "value": "42"
        },
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "❌ Escalate" },
          "style": "danger",
          "action_id": "escalate_plan",
          "value": "42"
        }
      ]
    }
  ]
}
```

**Approval Handler**: `PUT /api/approve`
```json
{ "id": 42, "action": "approve" }
```

### 3.4 Stage 4: Voice Call Execution
**Endpoint**: `POST https://api.vapi.ai/call`

**Request Payload**:
```json
{
  "assistantId": "<VAPI_ASSISTANT_ID>",
  "phoneNumberId": "<FROM_PHONE_ID>",
  "customer": {
    "phoneNumber": "+15550789"
  },
  "assistantOverrides": {
    "firstMessage": "URGENT: Pallet 42 temperature alert. Order 5kg dry ice immediately for truck arriving in 60 minutes. Confirm receipt."
  },
  "metadata": {
    "shipmentId": 42,
    "alertType": "temperature_excursion",
    "priority": "high"
  }
}
```

**Response**: `201 { "callId": "abc123", "status": "queued" }`

### 3.5 Stage 5: Real-time Updates via SSE
**Endpoint**: `GET /api/events`
**Content-Type**: `text/event-stream`

**Event Stream Format**:
```
event: alert
data: {"id":42,"temp":12.3,"lat":36.73,"lon":-119.7,"status":"detected"}

event: plan_generated
data: {"id":42,"plan":"Order ice from Fresno DC","confidence":0.89}

event: approval_pending
data: {"id":42,"slack_ts":"1640995200.123456"}

event: approved
data: {"id":42,"approver":"john.doe","timestamp":"2024-01-01T12:30:00Z"}

event: call_initiated
data: {"id":42,"callId":"abc123","recipient":"+15550789"}

event: resolved
data: {"id":42,"outcome":"success","cost_avoided":50000}
```

## 4. File Structure & Implementation

```
cold-chain-guardian/
├── app/
│   ├── api/
│   │   ├── datadog/route.ts          # Alert ingestion
│   │   ├── approve/route.ts          # Slack approval handler
│   │   ├── events/route.ts           # SSE stream
│   │   └── audit/route.ts            # PDF generation
│   ├── components/
│   │   ├── WorldMap.tsx              # Main dashboard map
│   │   ├── AgentTimeline.tsx         # Step-by-step progress
│   │   ├── AlertDrawer.tsx           # Alert detail panel
│   │   └── AuditLog.tsx              # Historical incidents
│   └── page.tsx                      # Main dashboard
├── lib/
│   ├── bus.ts                        # Event emitter
│   ├── llama.ts                      # LlamaIndex integration
│   ├── vapi.ts                       # Voice call wrapper
│   ├── slack.ts                      # Slack bot setup
│   └── audit.ts                      # PDF generation
├── data/
│   └── sop_mrna_v1.md               # Standard procedures
├── scripts/
│   ├── spike_metric.sh              # Demo alert trigger
│   └── setup_env.sh                 # Environment setup
└── public/
    └── audit_template.html          # PDF template
```

## 5. Core Implementation Components

### 5.1 Event Bus (`lib/bus.ts`)
```typescript
import { EventEmitter } from 'node:events';

export const bus = new EventEmitter();

export interface AlertEvent {
  id: number;
  temp: number;
  duration: number;
  lat: number;
  lon: number;
  minutes_to_failure: number;
}

export interface PlanEvent {
  id: number;
  plan: string;
  confidence: number;
  contacts: string[];
}

// Event types for type safety
export type BusEvents = {
  alert: AlertEvent;
  plan_generated: PlanEvent;
  approval_pending: { id: number; slack_ts: string };
  approved: { id: number; approver: string };
  call_initiated: { id: number; callId: string };
  resolved: { id: number; outcome: 'success' | 'failed' };
};
```

### 5.2 Datadog Webhook Handler (`app/api/datadog/route.ts`)
```typescript
import { NextRequest } from 'next/server';
import { bus } from '@/lib/bus';
import { generatePlan } from '@/lib/llama';
import { postToSlack } from '@/lib/slack';

export async function POST(req: NextRequest) {
  try {
    const alert = await req.json();
    
    // Emit alert event for dashboard
    bus.emit('alert', alert);
    
    // Generate plan using LlamaIndex
    const plan = await generatePlan(alert);
    bus.emit('plan_generated', { id: alert.id, plan: plan.text, confidence: plan.confidence });
    
    // Post to Slack for approval
    const slackResponse = await postToSlack(alert.id, plan.text);
    bus.emit('approval_pending', { id: alert.id, slack_ts: slackResponse.ts });
    
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Datadog webhook error:', error);
    return Response.json({ error: 'Processing failed' }, { status: 500 });
  }
}
```

### 5.3 Failsafe Logic & Bad Plan Mitigation
```typescript
// lib/guardian.ts
export interface FailsafeRule {
  name: string;
  check: (alert: AlertEvent, plan: string) => boolean;
  action: 'reject' | 'escalate' | 'modify';
}

export const failsafeRules: FailsafeRule[] = [
  {
    name: 'distance_feasibility',
    check: (alert, plan) => {
      const depot = findNearestDepot(alert.lat, alert.lon);
      return depot.lead_minutes <= alert.minutes_to_failure - 30; // 30min buffer
    },
    action: 'escalate'
  },
  {
    name: 'contact_whitelist',
    check: (alert, plan) => {
      const contacts = extractContacts(plan);
      return contacts.every(c => APPROVED_CONTACTS.includes(c));
    },
    action: 'reject'
  },
  {
    name: 'action_whitelist',
    check: (alert, plan) => {
      const actions = extractActions(plan);
      return actions.every(a => APPROVED_ACTIONS.includes(a));
    },
    action: 'modify'
  }
];

export function validatePlan(alert: AlertEvent, plan: string): ValidationResult {
  for (const rule of failsafeRules) {
    if (!rule.check(alert, plan)) {
      return { valid: false, rule: rule.name, action: rule.action };
    }
  }
  return { valid: true };
}
```

## 6. UI Component Specifications

### 6.1 World Map Dashboard
**Component**: `WorldMap.tsx`
**Libraries**: React-Leaflet, Tailwind CSS

**Features**:
- Real-time shipment markers (green/yellow/red status)
- Ice depot locations (blue squares)
- Route visualization with ETA overlays
- Click-to-drill-down to agent detail page

**Marker States**:
- 🟢 Green: Temperature nominal
- 🟡 Yellow: Within 3 hours of threshold
- 🔴 Red: Temperature excursion active
- ⚫ Gray: Resolved/archived

### 6.2 Agent Timeline
**Component**: `AgentTimeline.tsx`
**Animation**: Framer Motion for step reveals

**Timeline Steps**:
1. ✅ Alert detected (timestamp, location)
2. ✅ Context gathered (SOP matched, depots identified)
3. ✅ Plan generated (AI confidence score)
4. ⏳ Awaiting approval (Slack message link)
5. ✅ Plan approved (approver name)
6. ✅ Voice call placed (call duration, recipient)
7. ✅ Incident resolved (cost avoided, audit PDF)

### 6.3 Alert Drawer
**Component**: `AlertDrawer.tsx`
**Trigger**: Map marker click

**Sections**:
- Alert summary (temp, duration, criticality)
- Generated plan with confidence score
- Live transcript of voice call
- Audit actions (download PDF, copy JSON)

## 7. Demo Script & Staging

### 7.1 90-Second Demo Flow
```bash
# Terminal 1: Start development server
npm run dev

# Terminal 2: Trigger alert
chmod +x scripts/spike_metric.sh
./scripts/spike_metric.sh

# Live demo actions:
# 1. Show world map - marker turns red
# 2. Click marker - drawer opens with plan
# 3. Show Slack message with approval button
# 4. Click approve - phone rings (Vapi call)
# 5. Marker turns green - show cost saved
# 6. Download audit PDF
```

### 7.2 Backup Plans
- **Pre-recorded Loom video** if WiFi fails
- **Static JSON responses** if APIs are down
- **Mock phone audio** if Vapi has latency
- **Offline PDF** if generation fails

## 8. Environment Variables

```bash
# .env.local
OPENAI_API_KEY=sk-...
LLAMAINDEX_API_KEY=llama_...
VAPI_API_KEY=vapi_...
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DATADOG_WEBHOOK_SECRET=dd_...
```

## 9. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Alert-to-plan latency | < 10 seconds | Server logs |
| Approval-to-action latency | < 5 seconds | SSE timestamps |
| Demo uptime | 100% | Offline fallbacks |
| Judge engagement | Audible "wow" | Phone call demo |
| Sponsor API coverage | 3/3 APIs used | Datadog + LlamaIndex + Vapi |

## 10. Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-------------|
| Vapi call latency | High | Medium | Pre-recorded audio backup |
| Slack token expiry | Medium | High | Socket mode + refresh logic |
| SSE connection drops | Medium | Medium | Auto-reconnect + state sync |
| LlamaIndex rate limits | Low | Medium | Response caching + fallback |
| Time overrun | High | High | MVP feature prioritization |

## 11. Post-Hackathon Roadmap

**Phase 1 - Production Ready** (4 weeks):
- Database persistence (PostgreSQL)
- User authentication & RBAC
- Enhanced SOP editor UI
- Multi-tenant architecture

**Phase 2 - Scale & Intelligence** (8 weeks):
- Predictive analytics (weather/traffic)
- Machine learning for plan optimization
- Integration with ERP systems
- Mobile app for field technicians

**Phase 3 - Market Expansion** (12 weeks):
- White-label deployment
- Compliance certifications (FDA, WHO)
- Partnership with logistics providers
- Blockchain audit trail

---

This technical plan provides the complete blueprint for implementing the Cold-Chain Guardian system within hackathon constraints while maintaining production-quality architecture and clear expansion paths.