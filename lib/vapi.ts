import { randomUUID } from 'crypto';

export interface VoiceCallRequest {
  id: number;
  phone: string;
  message: string;
  contactName: string;
}

export interface VoiceCallResponse {
  callId: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  transcript?: string;
  approved?: boolean;
  feedback?: string;
}

// Mock Vapi service - will be replaced with real API calls
export class MockVapiService {
  private calls = new Map<string, VoiceCallResponse>();

  async initiateCall(request: VoiceCallRequest): Promise<VoiceCallResponse> {
    const callId = randomUUID();
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response: VoiceCallResponse = {
      callId,
      status: 'queued'
    };
    
    this.calls.set(callId, response);
    
    // Simulate call progress
    setTimeout(() => this.simulateCallProgress(callId, request), 2000);
    
    return response;
  }

  async checkCallStatus(callId: string): Promise<VoiceCallResponse> {
    return this.calls.get(callId) || {
      callId,
      status: 'failed',
      transcript: 'Call not found'
    };
  }

  private async simulateCallProgress(callId: string, request: VoiceCallRequest) {
    // Simulate call connecting
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.calls.set(callId, {
      ...this.calls.get(callId)!,
      status: 'in_progress'
    });

    // Simulate conversation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate mock transcript
    const transcript = `
      Agent: Hello, this is Cold-Chain Guardian calling about urgent pallet ${request.id}.
      Contact: ${request.contactName} speaking.
      Agent: Temperature alert detected at ${request.phone}. Pallet ${request.id} needs immediate action.
      Agent: ${request.message}
      Contact: Approved, proceed with the plan.
    `;

    this.calls.set(callId, {
      callId,
      status: 'completed',
      transcript: transcript.trim(),
      approved: true,
      feedback: 'Plan approved via voice call'
    });
  }
}

export const vapiService = new MockVapiService();