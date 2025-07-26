import "dotenv/config";
import {
  agent,
  agentStreamEvent,
} from "@llamaindex/workflow";

import {
  openai,
} from "@llamaindex/openai";
import { z } from "zod";
import { QueryEngineTool, Settings, VectorStoreIndex, tool } from "llamaindex";
import { HuggingFaceEmbedding } from "@llamaindex/huggingface";
import { SimpleDirectoryReader } from "@llamaindex/readers/directory";
import path from "path";

Settings.embedModel = new HuggingFaceEmbedding({
    modelType: "BAAI/bge-small-en-v1.5",
    quantized: false,
  });

Settings.llm = openai({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4o",
  });

  

  export async function chatWithAgent(message: string): Promise<string> {
    const reader = new SimpleDirectoryReader();
    const dataDirPath = path.join(process.cwd(), "data");
const documents = await reader.loadData({ directoryPath: dataDirPath });
const index = await VectorStoreIndex.fromDocuments(documents);

const tools = [
    index.queryTool({
      metadata: {
        name: "san_francisco_budget_tool",
        description: `This tool can answer detailed questions about the individual components of the budget of San Francisco in 2023-2024.`,
      },
      options: { similarityTopK: 10 },
    }),
  ];
  // Create an agent using the tools array
const ragAgent = agent({ tools });

let toolResponse = await ragAgent.run("What's the budget of San Francisco in 2023-2024?");

console.log(toolResponse);
return "toolResponse";
  }