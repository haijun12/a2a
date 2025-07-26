// CALLS TO API

export async function createWorkflow(prompt: string, number?: string) {
    const response = await fetch('/api/vapi/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: prompt,
            number: number
        })
    });
    const data = await response.json();
    return data;
}