// Consolidated Vapi service: Real + Mock implementations
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
  duration?: number;
  success?: boolean;
}

// Mock implementation for testing
class MockVapiService {
  private calls = new Map<string, VoiceCallResponse>();

  async initiateCall(request: VoiceCallRequest): Promise<VoiceCallResponse> {
    const callId = randomUUID();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response: VoiceCallResponse = {
      callId,
      status: 'queued'
    };
    
    this.calls.set(callId, response);
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.calls.set(callId, {
      ...this.calls.get(callId)!,
      status: 'in_progress'
    });

    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const transcript = `
      Agent: Hello, this is Cold-Chain Guardian calling about urgent pallet ${request.id}.
      Contact: ${request.contactName} speaking.
      Agent: Temperature alert detected. Pallet ${request.id} needs immediate action.
      Agent: ${request.message}
      Contact: Approved, proceed with the plan.
    `;

    this.calls.set(callId, {
      callId,
      status: 'completed',
      transcript: transcript.trim(),
      approved: true,
      feedback: 'Plan approved via voice call',
      duration: 45,
      success: true
    });
  }
}

// Real Vapi implementation (when VAPI_API_KEY is available)
class RealVapiService {
  private client: any; // VapiClient when @vapi-ai/server-sdk is installed

  constructor() {
    // Would initialize VapiClient here
    console.log('Real Vapi service not implemented yet - using mock');
  }

  async initiateCall(request: VoiceCallRequest): Promise<VoiceCallResponse> {
    // Real implementation would use actual Vapi SDK
    // For now, fall back to mock
    return new MockVapiService().initiateCall(request);
  }

  async checkCallStatus(callId: string): Promise<VoiceCallResponse> {
    return new MockVapiService().checkCallStatus(callId);
  }
}

// Phone number formatting utility
function formatPhoneNumber(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');
  
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }
  
  return `+${digits}`;
}

// Service factory
function createVapiService() {
  const hasVapiKey = process.env.VAPI_API_KEY && process.env.VAPI_PHONE_NUMBER;
  
  if (hasVapiKey) {
    console.log('🎯 Using Real Vapi service');
    return new RealVapiService();
  } else {
    console.log('🎭 Using Mock Vapi service');
    return new MockVapiService();
  }
}

export const vapiService = createVapiService();
export { formatPhoneNumber };