"use client"
import { createWorkflow } from "@/lib/api";

export default function TestVapi() {
    const handleClick = async () => {
        try {
            const result = await createWorkflow("Hello, What is your name and how can I help you?", "6156384307"); // pass a value or leave undefined
            console.log("Workflow created:", result);
        } catch (err) {
            console.error("Error creating workflow:", err);
        }
    };

    return (
        <div>
            <h1>Test Vapi</h1>
            <button onClick={handleClick}>Create Workflow</button>
        </div>
    );
}
