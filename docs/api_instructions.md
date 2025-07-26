End-to-end API contract (what your code must send / receive)
Stage    Who calls whom    Method + URL    Body (minimum viable)    Success response    Notes
1. Datadog ➜ Guardian    Datadog monitor → POST /api/datadog    JSON
{ "id":42, "temp":12.3, "duration":900, "tags":["pallet:42","lane:3"] }    200 {ok:true}    Datadog lets you craft the payload in the monitor. At minimum include a stable id, the current °C, and how long it’s out of range — you parse nothing else. 
Datadog Monitoring
2. Guardian ➜ LlamaIndex    generatePlan() inside lib/llama.ts    Library call
index.query("Temp 12 °C > 8 °C for 15 min – action?")    Returns string plan (≤ 200 chars)    No rate limit for one query; easy to mock with a hard-coded string until keys are ready. 
LlamaIndex
3. Guardian ➜ Slack    chat.postMessage (Socket-mode)    JSON fields:
channel:"#agent-inbox"
text:"🚨 Pallet 42 over temp"
blocks:[{type:"actions",elements:[{type:"button",text:{...},action_id:"approve-btn"}]}]    200 ok    Slack will later POST an interaction payload to your Bolt app when the Approve button is clicked. 
Slack API
4. Slack ➜ Guardian    Bolt handler → PUT /api/approve    JSON { "id": 42 }    200 {ok:true}    Keep body tiny; you already know the plan.    
5. Guardian ➜ Vapi    POST https://api.vapi.ai/call    json            
{                    
"assistantId": "<ASSISTANT_ID>",                    
"phoneNumberId": "<FROM_ID>",                    
"customer": { "phoneNumber": "+15555550100" },                    
"metadata": { "shipmentId": 42 },                    
"answerOnBridge": true                    
}                    
    201 { "callId":"abc123" }    Only three required fields for a single outbound call. 
Vapi
6. Guardian ➜ Dashboard (SSE)    GET /api/events stream    Server-sent chunks:
event:alert\ndata:{"id":42,"temp":12.3}\n\n
event:plan\ndata:{"id":42,"plan":"Add dry-ice…"}\n\n
event:resolved\ndata:{"id":42}\n\n    n/a (stream stays open)    Works on Next.js App Router when you set export const dynamic = "force-dynamic"; inside the route. 
Medium

Glue code “shape” (Bolt-friendly)
ts
Copy
Edit
// lib/bus.ts
import { EventEmitter } from 'node:events';
export const bus = new EventEmitter();

// app/api/datadog/route.ts
export async function POST(req: NextRequest) {
  const alert = await req.json();        // shape above
  bus.emit('alert', alert);
  const plan = await generatePlan(alert);
  bus.emit('plan', { id: alert.id, plan });
  return Response.json({ ok: true });
}

// app/api/approve/route.ts
export async function PUT(req: NextRequest) {
  const { id } = await req.json();
  await callVapi(id);                    // wrapper in lib/vapi.ts
  bus.emit('resolved', { id });
  return Response.json({ ok: true });
}

// app/api/events/route.ts
export const dynamic = 'force-dynamic';
export async function GET() {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    start(ctrl) {
      ['alert', 'plan', 'resolved'].forEach(evt =>
        bus.on(evt, data =>
          ctrl.enqueue(enc.encode(event:${evt}\ndata:${JSON.stringify(data)}\n\n))
        )
      );
    }
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
}
Dev-spike script (place in scripts/)
bash
Copy
Edit
#!/usr/bin/env bash
# scripts/spike_metric.sh
curl -X POST http://localhost:3000/api/datadog \
  -H "Content-Type: application/json" \
  -d '{ "id": 42, "temp": 12.3, "duration": 900, "tags": ["pallet:42"] }'
Make executable: chmod +x scripts/spike_metric.sh.

Where each file lives
bash
Copy
Edit
cold-chain-guardian/
├─ scripts/spike_metric.sh
├─ app/api/datadog/route.ts
├─ app/api/approve/route.ts
├─ app/api/events/route.ts
├─ lib/bus.ts
├─ lib/llama.ts        # calls LlamaIndex
└─ lib/vapi.ts         # POST to /call
Why this contract works
Minimal state: id, temp, duration are enough to decide.

Single plan string: keeps LlamaIndex call cheap and predictable.

Slack button action_id "approve-btn" maps 1-to-1 to the /approve route.

SSE schema mirrors events — the dashboard never polls.

All three sponsor APIs exercised once → satisfies hackathon rule.

Wire these payloads exactly, drop the dev script into /scripts/, and your v0 dashboard will light up the moment you run bash scripts/spike_metric.sh.