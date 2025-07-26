import { NextRequest } from 'next/server';
import { bus } from '@/lib/core/bus';
import { generatePlan } from '@/lib/core/planning';
import { vapiService } from '@/lib/services/vapi';

export async function PUT(req: NextRequest) {
  try {
    const { id, approved, feedback } = await req.json();
    
    console.log(`Approval received for alert ${id}: ${approved ? 'APPROVED' : 'REJECTED'}`);
    
    // Emit approval event
    bus.emit('approval_received', {
      id,
      approved,
      feedback,
      timestamp: new Date().toISOString()
    });
    
    if (approved) {
      // Execute the approved plan
      bus.emit('plan_executed', {
        id,
        outcome: 'success',
        details: 'Plan approved and executed via voice call'
      });
      
      // Calculate cost avoided (mock calculation)
      const costAvoided = Math.floor(Math.random() * 100000) + 50000;
      
      bus.emit('resolved', {
        id,
        cost_avoided: costAvoided
      });
      
      return Response.json({ 
        ok: true, 
        action: 'executed',
        cost_avoided: costAvoided
      });
      
    } else {
      // Plan rejected - generate new plan based on feedback
      console.log(`Plan rejected for alert ${id}. Feedback: ${feedback}`);
      
      // Here we would normally get the original alert data to regenerate
      // For now, we'll tell the user we're working on a new plan
      const newPlanCall = await vapiService.initiateCall({
        id,
        phone: "+15550123456", // Default to tech hotline
        message: `Plan for pallet ${id} was rejected. Feedback received: "${feedback}". Our planning agent is generating a revised plan. We will call you back within 2 minutes with new options.`,
        contactName: "Operations Team"
      });
      
      bus.emit('voice_call_queued', {
        id,
        phone: "+15550123456",
        message: "Generating revised plan based on feedback",
        callId: newPlanCall.callId,
        status: newPlanCall.status
      });
      
      // Simulate plan regeneration delay
      setTimeout(async () => {
        // In real implementation, this would regenerate with the feedback
        // For now, we'll just indicate that we're working on it
        bus.emit('plan_generated', {
          id,
          plan: [
            "REVISED PLAN being generated...",
            "Incorporating feedback from previous rejection",
            "New options being evaluated by planning agent",
            "Will call back with updated recommendations"
          ],
          confidence: 0.80
        });
      }, 5000);
      
      return Response.json({ 
        ok: true, 
        action: 'regenerating',
        message: 'Generating revised plan based on feedback'
      });
    }
    
  } catch (error) {
    console.error('Approval processing error:', error);
    return Response.json({ error: 'Approval processing failed' }, { status: 500 });
  }
}