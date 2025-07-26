import { readFileSync } from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { querySOPWithLlamaIndex } from '../services/llama';

const SOP_PATH = path.join(process.cwd(), 'data', 'sop_mrna_v1.md');

export interface GeneratedPlan {
  plan: string[];
  depot?: {
    name: string;
    phone: string;
    contact: string;
    lead_minutes: number;
    region: string;
  };
  emergency_facility?: {
    name: string;
    phone: string;
    capacity: string;
  };
  contact_phone: string;
  confidence: number;
  strategy: 'ice_delivery' | 'emergency_reroute' | 'escalation';
  region: 'americas' | 'asia';
}

interface SOPData {
  contacts: {
    americas: { [key: string]: string };
    asia: { [key: string]: string };
  };
  ice_depots: {
    americas: Array<any>;
    asia: Array<any>;
  };
  emergency_facilities: {
    americas: Array<any>;
    asia: Array<any>;
  };
}

function parseSOPData(): SOPData {
  const sopContent = readFileSync(SOP_PATH, 'utf8');
  const yamlMatch = sopContent.match(/^---([\s\S]*?)---/);
  if (!yamlMatch) throw new Error('SOP YAML not found');
  
  return yaml.load(yamlMatch[1]) as SOPData;
}

function detectRegion(lat: number, lon: number): 'americas' | 'asia' {
  // Americas: lat >= 20 && lat <= 60 && lon >= -130 && lon <= -60
  if (lat >= 20 && lat <= 60 && lon >= -130 && lon <= -60) {
    return 'americas';
  }
  // Asia: lat >= -10 && lat <= 50 && lon >= 95 && lon <= 145
  if (lat >= -10 && lat <= 50 && lon >= 95 && lon <= 145) {
    return 'asia';
  }
  // Default to americas for unknown regions
  return 'americas';
}

export async function generatePlan(alert: {
  id: number;
  temp: number;
  lat: number;
  lon: number;
  minutes_to_failure: number;
  next_stop?: { lat: number; lon: number; city: string; eta_minutes: number };
}, regenerateReason?: string): Promise<GeneratedPlan> {
  
  try {
    // Use LlamaIndex with Kimi API to generate intelligent plan
    const llamaResponse = await querySOPWithLlamaIndex(alert, regenerateReason);
    
    // Parse the LlamaIndex response to extract structured plan
    const sopData = parseSOPData();
    const region = detectRegion(alert.lat, alert.lon);
    
    // Find appropriate contact based on plan content and region
    const contact = extractContactFromPlan(llamaResponse.plan, sopData, region);
    
    return {
      plan: llamaResponse.plan,
      depot: contact.depot,
      emergency_facility: contact.emergency_facility,
      contact_phone: contact.phone,
      confidence: llamaResponse.confidence,
      strategy: determineStrategy(llamaResponse.plan),
      region
    };
    
  } catch (error) {
    console.error('LlamaIndex plan generation failed, using fallback:', error);
    
    // Fallback to rule-based planning
    return generateFallbackPlan(alert, regenerateReason);
  }
}

function extractContactFromPlan(plan: string[], sopData: any, region: 'americas' | 'asia') {
  const planText = plan.join(' ').toLowerCase();
  
  // Check if plan mentions specific depots
  const regionalDepots = sopData.ice_depots[region] || [];
  for (const depot of regionalDepots) {
    if (planText.includes(depot.name.toLowerCase()) || planText.includes(depot.contact.toLowerCase())) {
      return {
        depot: {
          name: depot.name,
          phone: depot.phone,
          contact: depot.contact,
          lead_minutes: depot.lead_minutes,
          region: depot.region
        },
        phone: depot.phone
      };
    }
  }
  
  // Check for emergency facilities
  const emergencyFacilities = sopData.emergency_facilities[region] || [];
  for (const facility of emergencyFacilities) {
    if (planText.includes(facility.name.toLowerCase()) || planText.includes('emergency') || planText.includes('reroute')) {
      return {
        emergency_facility: {
          name: facility.name,
          phone: facility.phone,
          capacity: facility.capacity
        },
        phone: facility.phone
      };
    }
  }
  
  // Default to emergency manager
  return {
    phone: sopData.contacts[region].emergency_manager
  };
}

function determineStrategy(plan: string[]): 'ice_delivery' | 'emergency_reroute' | 'escalation' {
  const planText = plan.join(' ').toLowerCase();
  
  if (planText.includes('ice') || planText.includes('depot')) {
    return 'ice_delivery';
  }
  if (planText.includes('reroute') || planText.includes('facility') || planText.includes('redirect')) {
    return 'emergency_reroute';
  }
  return 'escalation';
}

function generateFallbackPlan(alert: any, regenerateReason?: string): GeneratedPlan {
  const sopData = parseSOPData();
  const region = detectRegion(alert.lat, alert.lon);
  const safetyBuffer = 30;

  const regionalDepots = sopData.ice_depots[region] || [];
  const viableDepots = regionalDepots.filter(depot => 
    depot.lead_minutes <= (alert.minutes_to_failure - safetyBuffer)
  );

  if (viableDepots.length > 0) {
    const selectedDepot = viableDepots[0];
    return {
      plan: [
        "FALLBACK PLAN: LlamaIndex unavailable",
        `Contact ${selectedDepot.contact} at ${selectedDepot.name}`,
        `Order 5kg dry ice for delivery`,
        `ETA: ${selectedDepot.lead_minutes} minutes`,
        "Monitor progress every 15 minutes"
      ],
      depot: {
        name: selectedDepot.name,
        phone: selectedDepot.phone,
        contact: selectedDepot.contact,
        lead_minutes: selectedDepot.lead_minutes,
        region: selectedDepot.region
      },
      contact_phone: selectedDepot.phone,
      confidence: 0.70,
      strategy: 'ice_delivery',
      region
    };
  }

  // Emergency escalation fallback
  return {
    plan: [
      "CRITICAL: System fallback mode",
      "No viable depot options available",
      "Emergency manager intervention required",
      `Temperature: ${alert.temp}°C, Time: ${alert.minutes_to_failure}min`
    ],
    contact_phone: sopData.contacts[region].emergency_manager,
    confidence: 0.60,
    strategy: 'escalation',
    region
  };
}

export function validatePlan(plan: GeneratedPlan, minutes_to_failure: number): {
  valid: boolean;
  reason?: string;
} {
  const safetyBuffer = minutes_to_failure - plan.depot.lead_minutes;
  
  if (safetyBuffer < 15) {
    return {
      valid: false,
      reason: `Depot ETA (${plan.depot.lead_minutes}min) too close to failure (${minutes_to_failure}min). Need 15min buffer.`
    };
  }
  
  return { valid: true };
}