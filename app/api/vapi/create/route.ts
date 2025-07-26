// app/api/vapi/create/route.ts
import { NextRequest } from 'next/server';
import { callWithPromptAndGetResponse } from '@/lib/vapi-simple';

export async function POST(request: NextRequest) {
  try {
    const { prompt, number } = await request.json();
    
    if (!prompt || !number) {
      return Response.json(
        { error: 'prompt and number are required' },
        { status: 400 }
      );
    }
    const result = await callWithPromptAndGetResponse(prompt, number);

    
    console.log("Call result:", result);
    return Response.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Failed to process the call' },
      { status: 500 }
    );
  }
}