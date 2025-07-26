import { readFileSync } from 'fs';
import path from 'path';

const SOP_PATH = path.join(process.cwd(), 'data', 'sop_mrna_v1.md');

interface LlamaIndexResponse {
  plan: string[];
  confidence: number;
  reasoning: string;
}

export async function querySOPWithLlamaIndex(alert: {
  id: number;
  temp: number;
  lat: number;
  lon: number;
  minutes_to_failure: number;
  next_stop?: { lat: number; lon: number; city: string; eta_minutes: number };
}, regenerateReason?: string): Promise<LlamaIndexResponse> {
  
  // Load SOP content
  const sopContent = readFileSync(SOP_PATH, 'utf8');
  
  // Construct query for LlamaIndex
  const query = `
URGENT COLD-CHAIN ALERT - NEED IMMEDIATE ACTION PLAN

Alert Details:
- Pallet ID: ${alert.id}
- Current Temperature: ${alert.temp}°C (threshold: 8°C)
- Minutes until irreversible damage: ${alert.minutes_to_failure}
- Location: ${alert.lat}, ${alert.lon}
- Next stop: ${alert.next_stop?.city || 'Unknown'} (ETA: ${alert.next_stop?.eta_minutes || 'Unknown'} minutes)
${regenerateReason ? `- Previous plan rejected: ${regenerateReason}` : ''}

Based on the SOP below, generate a specific actionable plan with:
1. Regional detection (Americas vs Asia)
2. Time-critical decision (ice delivery vs emergency reroute)
3. Specific contact numbers and steps
4. Confidence score (0-1)

SOP Document:
${sopContent}

Return JSON format:
{
  "plan": ["step 1", "step 2", ...],
  "confidence": 0.85,
  "reasoning": "explanation of decision logic"
}
`;

  try {
    // Mock LlamaIndex response for now - replace with actual API call
    const mockResponse = await callKimiAPI(query);
    
    return {
      plan: mockResponse.plan || [
        "Default plan: Contact emergency manager",
        "Escalate to regional coordinator"
      ],
      confidence: mockResponse.confidence || 0.75,
      reasoning: mockResponse.reasoning || "Fallback to emergency procedure"
    };
    
  } catch (error) {
    console.error('LlamaIndex query failed:', error);
    
    // Fallback plan
    return {
      plan: [
        "ERROR: LlamaIndex unavailable",
        "Execute emergency escalation protocol", 
        "Contact emergency manager immediately"
      ],
      confidence: 0.60,
      reasoning: "System fallback due to API failure"
    };
  }
}

async function callKimiAPI(prompt: string): Promise<any> {
  const KIMI_API_KEY = process.env.KIMI_API_KEY;
  
  if (!KIMI_API_KEY) {
    throw new Error('KIMI_API_KEY not found in environment variables');
  }

  try {
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIMI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: 'You are a cold-chain logistics expert AI. Analyze SOPs and generate actionable emergency response plans. Always respond in valid JSON format with plan array, confidence score, and reasoning.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Try to parse JSON response
    try {
      return JSON.parse(content);
    } catch (parseError) {
      // If JSON parsing fails, extract plan from text
      const lines = content.split('\n').filter(line => line.trim());
      return {
        plan: lines.slice(0, 5), // Take first 5 lines as plan steps
        confidence: 0.75,
        reasoning: "Extracted from non-JSON response"
      };
    }

  } catch (error) {
    console.error('Kimi API call failed:', error);
    throw error;
  }
}