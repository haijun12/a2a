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


export async function createSolution(alertMessage: string) {
    const message = `
        You are a cold chain incident responder. Only use the information provided in the following CONTEXT to generate your answer. Do not make up any names, phone numbers, or roles.


        TASK:
        Given the following temperature spike alert, do the following:
        1. Identify the appropriate person to call (with name, role, phone number)
        2. Provide a short step-by-step solution based on protocols

        ALERT:
        ${alertMessage}

        OUTPUT FORMAT:
        {
        "contact": {
            "name": "",
            "role": "",
            "phone": ""
        },
        "solution": [
            "",
            "",
            ""
        ]
        }
        `;
        const response = await fetch("/api/llamaindex/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message }),
          });
    
        const data = await response.json();
        if (response.ok) {
            const obj = JSON.parse(data.response);
            const prompt = `This is an emergency alert. Please follow the cold chain response protocol.
                Hello ${obj.contact.name},

                ${alertMessage}

                Here are some suggested steps to take:
                ${obj.solution.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')}
                How would you like to proceed?
            `;
            const phoneNumber = obj.contact.phone;
            console.log("Prompt:", prompt);
            console.log("Phone number:", phoneNumber);
            const d = await createWorkflow(prompt, phoneNumber);
            console.log("D", d);
        } else {

        }
    return true;
}