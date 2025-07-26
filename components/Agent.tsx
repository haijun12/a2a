"use client";
import { createSolution } from "@/lib/api"
export default function Agent() {
    const userMessage = `There is a temperature spike to 12°C in our Fresno location for our mRNA vaccine. We have 180 minutes before breach occurs.`
    return (
        <button onClick={() => createSolution(userMessage)}> Click me to trigger shit</button>
    )
}