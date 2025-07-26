import { bus } from '@/lib/bus';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      const initialEvent = `event: connected\ndata: ${JSON.stringify({ 
        timestamp: new Date().toISOString(),
        message: 'Guardian agent monitoring active...' 
      })}\n\n`;
      controller.enqueue(encoder.encode(initialEvent));

      // Set up event listeners for all bus events
      const eventHandlers = {
        alert: (data: any) => {
          const event = `event: alert\ndata: ${JSON.stringify({
            ...data,
            timestamp: new Date().toISOString(),
            type: 'alert'
          })}\n\n`;
          controller.enqueue(encoder.encode(event));
        },
        
        plan_generated: (data: any) => {
          const event = `event: plan_generated\ndata: ${JSON.stringify({
            ...data,
            timestamp: new Date().toISOString(),
            type: 'plan_generated'
          })}\n\n`;
          controller.enqueue(encoder.encode(event));
        },
        
        voice_call_queued: (data: any) => {
          const event = `event: voice_call_queued\ndata: ${JSON.stringify({
            ...data,
            timestamp: new Date().toISOString(),
            type: 'voice_call_queued'
          })}\n\n`;
          controller.enqueue(encoder.encode(event));
        },
        
        voice_call_completed: (data: any) => {
          const event = `event: voice_call_completed\ndata: ${JSON.stringify({
            ...data,
            timestamp: new Date().toISOString(),
            type: 'voice_call_completed'
          })}\n\n`;
          controller.enqueue(encoder.encode(event));
        },
        
        approval_received: (data: any) => {
          const event = `event: approval_received\ndata: ${JSON.stringify({
            ...data,
            timestamp: new Date().toISOString(),
            type: 'approval_received'
          })}\n\n`;
          controller.enqueue(encoder.encode(event));
        },
        
        plan_executed: (data: any) => {
          const event = `event: plan_executed\ndata: ${JSON.stringify({
            ...data,
            timestamp: new Date().toISOString(),
            type: 'plan_executed'
          })}\n\n`;
          controller.enqueue(encoder.encode(event));
        },
        
        resolved: (data: any) => {
          const event = `event: resolved\ndata: ${JSON.stringify({
            ...data,
            timestamp: new Date().toISOString(),
            type: 'resolved'
          })}\n\n`;
          controller.enqueue(encoder.encode(event));
        }
      };

      // Register all event handlers
      Object.entries(eventHandlers).forEach(([eventName, handler]) => {
        bus.on(eventName, handler);
      });

      // Clean up when connection closes
      return () => {
        Object.entries(eventHandlers).forEach(([eventName, handler]) => {
          bus.off(eventName, handler);
        });
      };
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}