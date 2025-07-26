# Cold-Chain Guardian - Project Understanding

## Current Status: Building Core API Routes
*Last Updated: 2025-01-26*

## Key Requirements Clarification:
- **NO SMS** - Use Vapi voice calls only
- Planning agent creates actionable steps
- Vapi calls relevant POC for approval
- If approved → execute plan
- If not approved → send feedback to planning agent → tell user "will call back with new plan"

## System Flow:
1. **Alert Detection**: Datadog webhook → Guardian API
2. **Plan Generation**: LlamaIndex queries SOP → creates actionable steps
3. **Voice Approval**: Vapi calls relevant POC with plan
4. **Execution**: If approved → execute, if not → regenerate plan
5. **Real-time Updates**: SSE stream to dashboard

## Demo Workflows:
### Workflow A: Americas Ice Delivery
- Location: California (Americas region)
- Scenario: Ice depot can reach in time
- Action: Call depot to order ice delivery

### Workflow B: Asia Emergency Reroute  
- Location: Asia region
- Scenario: Ice depot cannot reach in time
- Action: Call emergency facility to arrange reroute

## Technical Architecture:
- **Frontend**: React TSX with real-time map
- **Backend**: Next.js App Router with SSE
- **Event Bus**: Node EventEmitter for coordination
- **Integrations**: Datadog MCP + LlamaIndex + Vapi

## Completed:
✅ Enhanced SOP with geography-based routing and decision logic

## In Progress:
🔄 Building API routes (/api/datadog, /api/events, /api/approve)

## Next Steps:
- LlamaIndex integration with SOP query logic
- Decision engine for ice vs redirect scenarios  
- Vapi voice call integration
- Demo trigger scripts for both workflows

## Key Files:
- `/data/sop_mrna_v1.md` - Enhanced SOP with decision matrix
- `/lib/bus.ts` - Event system for coordination
- `/Cold-Chain Logistics Plan.tsx` - Demo UI foundation