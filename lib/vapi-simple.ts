// lib/vapi-simple.ts
import { VapiClient } from "@vapi-ai/server-sdk";

if (!process.env.VAPI_API_KEY) {
  throw new Error("VAPI_API_KEY environment variable is required");
}

const vapi = new VapiClient({ token: process.env.VAPI_API_KEY });

/**
 * Formats phone number to E.164 format if not already formatted
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // If it doesn't start with country code, assume US (+1)
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If it already has country code but no +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If it already starts with +, return as is
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }
  
  // Otherwise assume it needs + prefix
  return `+${digits}`;
}

/**
 * Create a voice workflow, call the number, and return detailed results
 */
export async function callWithPromptAndGetResponse(
  prompt: string,
  phoneNumber: string,
  pollIntervalMs = 2000,
  timeoutMs = 120_000
) {
  console.log("=== VAPI CALL DEBUG ===");
  console.log("Original phone number:", phoneNumber);
  const formattedNumber = formatPhoneNumber(phoneNumber);
  console.log("Formatted phone number:", formattedNumber);
  console.log("Prompt:", prompt);
  console.log("VAPI_PHONE_NUMBER:", process.env.VAPI_PHONE_NUMBER || "NOT SET");

  // Create the call with minimal, robust configuration
  const callConfig = {
    customer: { number: formattedNumber },
    phoneNumberId: process.env.VAPI_PHONE_NUMBER,
    assistant: {
      firstMessage: prompt,
      model: {
        provider: "openai" as const,
        model: "gpt-3.5-turbo",
        systemPrompt: `You are making an outbound call. Your instructions:
1. Speak the first message clearly
2. Wait for the person to respond
3. Have a brief, friendly conversation
4. Do NOT hang up immediately - wait for their response
5. Only end the call when the conversation naturally concludes

Be patient and wait for responses. This is a real phone call with a real person.`,
        temperature: 0.7,
        maxTokens: 150,
      },
      voice: {
        provider: "playht",
        voiceId: "jennifer",
      },
      // Minimal settings to avoid premature hangup
      recordingEnabled: true,
      endCallMessage: "Thank you for your time. Goodbye!",
      maxDurationSeconds: 180, // 3 minutes
      silenceTimeoutSeconds: 10, // Shorter silence timeout
      responseDelaySeconds: 1, // Give person time to start speaking
    },
  };

  console.log("Call configuration:", JSON.stringify(callConfig, null, 2));

  let call;
  try {
    call = await vapi.calls.create(callConfig);
    console.log(`✅ Call created successfully with ID: ${call.id}`);
  } catch (error) {
    console.error("❌ Failed to create call:", error);
    throw new Error(`Failed to create call: ${error}`);
  }

  // Immediate check to see initial status
  try {
    const initialCheck = await vapi.calls.get(call.id);
    console.log(`Initial call status: ${initialCheck.status}`);
    console.log(`Initial call details:`, {
      status: initialCheck.status,
      startedAt: initialCheck.startedAt,
      endedAt: initialCheck.endedAt,
      endedReason: initialCheck.endedReason,
    });
  } catch (error) {
    console.error("Error getting initial call status:", error);
  }

  // Poll for completion with detailed logging
  const start = Date.now();
  let callStatus;
  let callDetails;
  let attempts = 0;
  const maxAttempts = Math.floor(timeoutMs / pollIntervalMs);

  console.log(`Starting to poll every ${pollIntervalMs}ms for up to ${maxAttempts} attempts`);

  do {
    attempts++;
    await new Promise((r) => setTimeout(r, pollIntervalMs));
    
    try {
      callDetails = await vapi.calls.get(call.id);
      callStatus = callDetails.status;
      
      console.log(`📞 Poll ${attempts}/${maxAttempts} (${Math.floor((Date.now() - start) / 1000)}s):`, {
        status: callStatus,
        endedReason: callDetails.endedReason || "none",
        duration: callDetails.durationSeconds || 0,
        hasTranscript: !!callDetails.transcript,
        messagesCount: callDetails.messages?.length || 0,
      });
      
      // Log any error details
      if (callDetails.endedReason) {
        console.log(`🔍 Call ended reason: ${callDetails.endedReason}`);
        
        // Check for common immediate hangup causes
        if (callDetails.endedReason.includes('customer-did-not-answer')) {
          console.log("❌ Customer did not answer the call");
        } else if (callDetails.endedReason.includes('customer-busy')) {
          console.log("❌ Customer's line was busy");
        } else if (callDetails.endedReason.includes('assistant-')) {
          console.log("❌ Assistant-related issue - check your configuration");
        } else if (callDetails.endedReason.includes('pipeline-error')) {
          console.log("❌ Pipeline error - possible API key or model issue");
        }
      }
      
      if (callStatus === "completed" || callStatus === "ended") {
        console.log("✅ Call completed");
        break;
      }
      
      // Check for failed states
      if (["failed", "no-answer", "busy", "error"].includes(callStatus)) {
        console.log(`❌ Call failed with status: ${callStatus}`);
        break;
      }
      
    } catch (error) {
      console.error(`❌ Error polling call status (attempt ${attempts}):`, error);
      if (attempts >= 3) {
        throw error;
      }
    }
    
  } while (Date.now() - start < timeoutMs && attempts < maxAttempts);

  // Final call details
  if (!callDetails) {
    throw new Error("Failed to get call details");
  }

  console.log("=== FINAL CALL RESULTS ===");
  console.log("Final status:", callDetails.status);
  console.log("Ended reason:", callDetails.endedReason || "none");
  console.log("Duration:", callDetails.durationSeconds || 0, "seconds");
  console.log("Started at:", callDetails.startedAt);
  console.log("Ended at:", callDetails.endedAt);

  // Get transcript from multiple possible sources
  let transcript = "";
  if (callDetails.transcript) {
    transcript = callDetails.transcript;
  } else if (callDetails.messages && callDetails.messages.length > 0) {
    transcript = callDetails.messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');
  }

  console.log("Transcript length:", transcript.length);
  if (transcript) {
    console.log("Transcript preview:", transcript.substring(0, 200) + "...");
  }

  return {
    callId: call.id,
    transcript,
    status: callDetails.status,
    endedReason: callDetails.endedReason,
    duration: callDetails.durationSeconds,
    startedAt: callDetails.startedAt,
    endedAt: callDetails.endedAt,
    success: callDetails.status === "completed" && callDetails.durationSeconds > 5,
  };
}

// Helper function to test your configuration
export async function testVapiConfiguration() {
  console.log("=== TESTING VAPI CONFIGURATION ===");
  
  if (!process.env.VAPI_API_KEY) {
    console.log("❌ VAPI_API_KEY not set");
    return false;
  }
  console.log("✅ VAPI_API_KEY is set");
  
  if (!process.env.VAPI_PHONE_NUMBER) {
    console.log("❌ VAPI_PHONE_NUMBER not set");
    return false;
  }
  console.log("✅ VAPI_PHONE_NUMBER is set:", process.env.VAPI_PHONE_NUMBER);
  
  try {
    // Test API connection by listing calls
    const calls = await vapi.calls.list({ limit: 1 });
    console.log("✅ API connection successful");
    return true;
  } catch (error) {
    console.log("❌ API connection failed:", error);
    return false;
  }
}