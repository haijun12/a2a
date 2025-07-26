import { EventEmitter } from 'node:events';

export const bus = new EventEmitter();

export interface AlertEvent {
  id: number;
  temp: number;
  duration: number;
  lat: number;
  lon: number;
  minutes_to_failure: number;
  next_stop: {
    city: string;
    eta_minutes: number;
    lat: number;
    lon: number;
  };
  product: string;
  status: 'normal' | 'warning' | 'alert';
}

export interface PlanEvent {
  id: number;
  plan: string[];
  depot: {
    name: string;
    phone: string;
    contact: string;
    lead_minutes: number;
  };
  confidence: number;
  contact_phone: string;
}

export interface VoiceCallEvent {
  id: number;
  phone: string;
  message: string;
  callId: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
}

export interface ApprovalEvent {
  id: number;
  approved: boolean;
  feedback?: string;
  timestamp: string;
}

export type BusEvents = {
  alert: AlertEvent;
  plan_generated: PlanEvent;
  voice_call_queued: VoiceCallEvent;
  voice_call_completed: VoiceCallEvent;
  approval_received: ApprovalEvent;
  plan_executed: { id: number; outcome: 'success' | 'failed'; details: string };
  resolved: { id: number; cost_avoided: number };
};