import { NextRequest } from 'next/server';
import { bus } from '@/lib/bus';
import { generatePlan, validatePlan } from '@/lib/planning';
import { vapiService } from '@/lib/vapi';

export async function POST(req: NextRequest) {
  try {
    const alert = await req.json();
    
    console.log('Received alert:', alert);
    
    // Emit alert event for real-time updates
    bus.emit('alert', alert);
    
    // Generate plan using our planning agent with LlamaIndex
    const plan = await generatePlan(alert);
    bus.emit('plan_generated', { 
      id: alert.id, 
      plan: plan.plan, 
      depot: plan.depot,
      confidence: plan.confidence,
      contact_phone: plan.contact_phone
    });
    
    // Validate plan before execution
    const validation = validatePlan(plan, alert.minutes_to_failure);
    
    if (!validation.valid) {
      // Escalate to emergency manager
      const escalationCall = await vapiService.initiateCall({
        id: alert.id,
        phone: "+15550345678", // Emergency manager
        message: `Emergency escalation for pallet ${alert.id}: ${validation.reason}. Temperature ${alert.temp}°C, ${alert.minutes_to_failure} minutes remaining.`,
        contactName: "Emergency Manager"
      });
      
      bus.emit('voice_call_queued', {
        id: alert.id,
        phone: "+15550345678",
        message: `Emergency escalation: ${validation.reason}`,
        callId: escalationCall.callId,
        status: escalationCall.status
      });
      
      return Response.json({ 
        ok: true, 
        action: 'escalated',
        reason: validation.reason,
        callId: escalationCall.callId
      });
    }
    
    // Initiate voice call for approval
    const voiceMessage = `
      Urgent temperature alert for pallet ${alert.id}. 
      Current temperature: ${alert.temp}°C. 
      ${alert.minutes_to_failure} minutes until irreversible damage. 
      Recommended action: ${plan.plan[0]}. 
      Contact ${plan.depot.contact} at ${plan.depot.name}. 
      Do you approve this plan? Say "yes" to proceed or "no" to request alternatives.
    `.trim();
    
    const call = await vapiService.initiateCall({
      id: alert.id,
      phone: plan.contact_phone,
      message: voiceMessage,
      contactName: plan.depot.contact
    });
    
    bus.emit('voice_call_queued', {
      id: alert.id,
      phone: plan.contact_phone,
      message: voiceMessage,
      callId: call.callId,
      status: call.status
    });
    
    return Response.json({ 
      ok: true, 
      callId: call.callId,
      plan: plan.plan,
      depot: plan.depot,
      confidence: plan.confidence
    });
    
  } catch (error) {
    console.error('Datadog webhook error:', error);
    return Response.json({ error: 'Processing failed' }, { status: 500 });
  }
}