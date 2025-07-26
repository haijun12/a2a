1 The problem in plain English
Cold-chain logistics (vaccines, biologics, high-end food) live on a knife-edge: one brief temperature spike can scrap a $2 million pallet and trigger regulatory audits. Shippers already have telemetry—reefers stream °C data to Datadog, GPS pings, driver ELD feeds—but response is still human-driven:

An e-mail or dashboard light blinks → someone eventually sees it

They dig through a PDF SOP to decide what to do

They phone the yard or on-call tech

Later they assemble evidence for QA / FDA

During nights, weekends, or alert floods this chain snaps; by the time the right person reacts, product is ruined, compliance is jeopardised, and detention or recall costs stack up.

2 Why existing tools fall short
What exists	Why it isn’t enough
Dashboards & data loggers (FedEx SenseAware, Tive, IoT reefers)	They surface data but still rely on staff to notice and interpret it in time.
24/7 “control towers” at large carriers	Only Fortune-100 pharma can afford staffed war-rooms; SMEs still triage alarms manually.
Rule-based SMS alerts	No context: technicians get dozens of false alarms and start ignoring pings.
Post-hoc audit software	Helps with paperwork after loss occurs; does nothing to save the shipment.

Gap: No mainstream solution closes the loop from raw signal → contextual plan → human sign-off → machine-executed action → auto-audit in seconds.

3 Our thesis & solution
Ambient agents + human-approval valve = instant, trusted intervention.

We build a lightweight “Guardian” agent that:

Listens, not polls
Datadog metric monitor fires a webhook the moment temperature or dwell time breaches threshold.

Thinks in context
LlamaIndex queries your internal SOP (“pallet at 12 °C for 15 min → move to backup reefer or add dry ice”) and returns a short, actionable plan.

Asks, then acts
Posts the plan to Slack #agent-inbox; any authorised user can Approve.
If approved (or timer expires) the agent auto-calls the on-site tech via Vapi with TTS instructions.

Proves it
Emits Server-Sent Events to the dashboard and writes a PDF timeline (alert → plan → approval → call) for auditors.

This compresses hours of human hand-offs into < 60 seconds, turning costly spoilage into a near-miss.

4 Core workflows (happy path & fallback)
Step	Actor	Sponsor call	Visual cue
❶ Temp spike → /api/datadog	Datadog monitor	Datadog MCP	Map marker flashes red
❷ Generate plan	Guardian (backend)	LlamaIndex	Drawer shows plan text
❸ Send to Slack	Guardian	Slack Bolt	Message with Approve button
❹ Approve click	Human	—	Slack ✅, KPI decrements
❺ Voice call	Guardian	Vapi /call	Phone rings; toast “Call placed”
❻ Status update + PDF	Guardian	—	Marker turns green; Audit PDF link

Fallback: If no approve within 5 min, Guardian escalates to regional manager; timer & second call prove autonomy with guard-rails.

5 Why this mitigates the pain better than anyone today
Pain-point	Existing lag	Guardian response
Detection → human notice	15 – 60 min (e-mail or dashboard)	< 5 s (webhook + SSE)
Find correct SOP	5 – 10 min (search PDF)	< 1 s (LlamaIndex query)
Reach on-site tech	10 – 30 min (calls, shift roster)	Automated voice in < 10 s
Audit paperwork	30 – 60 min manual	PDF autogen instantly

ROI: one saved pallet / week (e.g. $50 k of insulin) pays for the system 10× over in a month; smaller shippers get enterprise-grade response without hiring a war-room.

6 How judges will see it in 90 seconds
bash spike_metric.sh – marker turns red.

Drawer shows AI plan, click Send to Slack.

Judge clicks Approve → phone rings (“Move pallet 42 to spare reefer”).

Marker flips green; KPI “$ saved” +135.

Audit timeline modal → Download PDF.

They experience the full closed loop, see three sponsor APIs fire, and grasp the dollar/time impact immediately.

7 What’s truly novel
Ambient agent pattern—event-driven, long-lived, no chat latency constraints.

Human-approval valve—trust & compliance; not a black-box AI making blind moves.

Lowest lift adoption—no new hardware, plugs into Datadog, Slack, phone numbers you already own.

That combination doesn’t exist in mainstream cold-chain tooling—and that’s why it has a credible shot at the hackathon’s overall and multi-tool prizes.







Sources
You said:
Can we capture this in the PRD?


ChatGPT said:

Thought for a couple of seconds
Below is a concise, copy-ready PRD you can drop into docs/PRD.md (or paste into Devpost) to frame the whole story for judges and teammates.

Cold-Chain Guardian — Hackathon PRD (v1.0)
Goal	Detect a temperature excursion, generate an SOP-backed fix, get human approval, and execute the fix in < 60 s—then auto-audit it.

1. Problem & Stakes
Pain-point	Data
Spoilage	Biopharma loses $35 B/yr to cold-chain failures; WHO: up to 50 % of vaccines wasted globally.
Response Lag	Even with sensors, teams notice excursions 15–60 min later, often after product is ruined.
Manual Handoff	Staff must search PDF SOPs, phone techs, then compile audit docs—hours of friction.

Existing dashboards alert but don’t act; staffed “control towers” are expensive and unavailable to most shippers.

2. Insight / Why We’ll Win
Ambient agent + human approval valve closes the loop in real time, without adding hardware.

Event-driven → reacts instantly.

LlamaIndex → contextual plan, not generic SMS spam.

Human button in Slack → trust & compliance.

Vapi call → decisive action, audible proof.

Auto PDF → passes FDA/WHO audits effortlessly.

3. Solution Overview
bash
Copy
Edit
Datadog webhook  ──▶  Guardian API  ───▶  LlamaIndex (plan)
                       │  ▲                │
                       ▼  │                ▼
           SSE ➜  Dashboard        Slack “Approve?”
                       │                │
                       ▼                ▼
                   Vapi call   ◀──  Approve / timeout
                       │
                       ▼
               Audit timeline + PDF
Three sponsor APIs: Datadog MCP (detect) → LlamaIndex (reason) → Vapi (act).

4. Core Workflows
Step	Actor	Time	Visible Cue
1. Spike detected	Datadog → API	< 5 s	Map marker turns red
2. Plan generated	Guardian → LlamaIndex	1 s	Drawer shows SOP text
3. Approval asked	Guardian → Slack	1 s	Message + Approve btn
4a. Human approves	Ops clicks	—	Phone rings, badge green
4b. No response (5 m)	Guardian escalates	—	Auto-call manager, badge orange→gray
5. Audit logged	Guardian	—	Timeline & PDF downloadable

5. Feature Set (demo-scope)
Must-have (≤ 5 hrs)	Nice-to-have
Real-time map + feed	Port dwell & weather pre-alerts
Drawer with plan & buttons	Escalation ladder UI
Slack approval flow	OAuth install
Vapi phone call	SMS fallback
PDF export	Blockchain notarisation

6. Tech Stack Decisions
Layer	Tool	Reason
Repo scaffold	Bolt.new	Fast API+EventBus boilerplate
UI	v0.dev + Tailwind/shadcn	Polished JSX in minutes
Event bus	Node EventEmitter	No DB needed for demo
Stream	SSE (/api/events)	Simple, Vercel-friendly
Reasoning	LlamaIndex stub (OpenAI)	1-line call, easy mock
Voice	Vapi TTS	Sponsor prize, visceral demo
Slack	Socket-mode Bolt	No OAuth headaches

7. Demo Narrative (3 min)
Problem slide — $35 B lost each year.

Run scripts/spike_metric.sh → Dashboard marker flashes red.

Drawer opens, shows “Add dry ice…”. Click Send to Slack.

Judge clicks Approve in Slack → Phone rings on stage.

Marker flips green; KPI “$135 saved” animates.

Open Audit modal → click Download PDF.

Architecture slide with Datadog-LlamaIndex-Vapi logos.

Backup: pre-recorded Loom if Wi-Fi or Vapi fails.

8. Success Metrics
KPI	Target
Detection-to-plan	< 10 s
Approval-to-action	< 5 s
Demo loop uptime	100 % offline fallback
Judge reaction	Audible “wow” when phone rings

9. Risks & Mitigations
Risk	Mitigation
Vapi latency	Pre-record call log / audio
Slack token mis-config	Use Socket-mode, test before show
SSE blocked on edge	force-dynamic flag in Next route
Time overrun	Skip PDF gen; use static file

10. Timeline (2 devs • 5 hrs)
Hour	Backend (Bolt + Claude)	Frontend (v0)
0-1	Bolt scaffold	Dashboard layout
1-2	Datadog route + bus	Hook SSE, markers/feed
2-3	LlamaIndex stub, Slack post	AlertDrawer component
3-4	/approve route, Vapi call	KPI bar, animations
4-5	End-to-end test, README	Slides, backup Loom

Ship this PRD with the repo; every teammate and judge will understand the pain, the gap, and exactly why Cold-Chain Guardian wins.